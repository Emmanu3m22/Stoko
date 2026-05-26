const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let backendProcess = null;
let mainWindow = null;
let apiUrl = null;

const isDev = !app.isPackaged;
const projectRoot = path.resolve(__dirname, '..');

function resolveBackendDir() {
  if (process.env.STOKO_BACKEND_DIR) return process.env.STOKO_BACKEND_DIR;
  if (isDev) return path.join(projectRoot, 'backend');
  return path.join(process.resourcesPath, 'backend');
}

function resolveBackendExecutable() {
  if (process.env.STOKO_BACKEND_EXECUTABLE) return process.env.STOKO_BACKEND_EXECUTABLE;

  const executableName = process.platform === 'win32' ? 'stoko-backend.exe' : 'stoko-backend';
  const packagedExecutable = path.join(process.resourcesPath, 'backend', executableName);
  if (!isDev && fs.existsSync(packagedExecutable)) return packagedExecutable;

  const devExecutable = path.join(projectRoot, 'backend', 'dist', 'stoko-backend', executableName);
  if (fs.existsSync(devExecutable)) return devExecutable;

  return null;
}

function resolveSeedDatabasePath() {
  if (process.env.STOKO_SEED_DB_PATH) return process.env.STOKO_SEED_DB_PATH;

  const packagedSeed = path.join(process.resourcesPath, 'seed', 'stoko.db');
  if (!isDev && fs.existsSync(packagedSeed)) return packagedSeed;

  const devSeed = path.join(projectRoot, 'backend', 'stoko.db');
  if (fs.existsSync(devSeed)) return devSeed;

  return null;
}

function prepareDatabase(userData) {
  const dbPath = process.env.STOKO_DB_PATH || path.join(userData, 'stoko.db');
  const seedPath = resolveSeedDatabasePath();

  if (!fs.existsSync(dbPath) && seedPath && fs.existsSync(seedPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.copyFileSync(seedPath, dbPath);
  }

  return dbPath;
}

function resolvePythonCommand(backendDir) {
  if (process.env.STOKO_PYTHON) return process.env.STOKO_PYTHON;

  const candidates = process.platform === 'win32'
    ? [
        path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
        path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
        'python',
      ]
    : [
        path.join(backendDir, '.venv', 'bin', 'python'),
        path.join(backendDir, 'venv', 'bin', 'python'),
        'python3',
        'python',
      ];

  return candidates.find((candidate) => candidate.includes(path.sep) ? fs.existsSync(candidate) : true);
}

function findFreePort(host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, host, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForBackend(url, timeoutMs = 20000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`${url}/api/v1/sistema/estado`, (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      req.on('error', retry);
      req.setTimeout(1500, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error('El backend local no respondió a tiempo.'));
        return;
      }
      setTimeout(check, 300);
    };

    check();
  });
}

async function startBackend() {
  const backendDir = resolveBackendDir();
  const backendExecutable = resolveBackendExecutable();
  const python = backendExecutable ? null : resolvePythonCommand(backendDir);
  if (!backendExecutable && !python) {
    throw new Error('No se encontró backend empaquetado ni intérprete Python para iniciar la API local.');
  }
  const userData = app.getPath('userData');
  const dbPath = prepareDatabase(userData);
  const port = Number(process.env.STOKO_API_PORT) || await findFreePort();
  apiUrl = `http://127.0.0.1:${port}`;

  backendProcess = spawn(
    backendExecutable || python,
    backendExecutable
      ? []
      : [
          '-m',
          'uvicorn',
          'app.main:app',
          '--host',
          '127.0.0.1',
          '--port',
          String(port),
        ],
    {
      cwd: backendExecutable ? path.dirname(backendExecutable) : backendDir,
      env: {
        ...process.env,
        STOKO_API_HOST: '127.0.0.1',
        STOKO_API_PORT: String(port),
        STOKO_DB_PATH: dbPath,
        STOKO_CONFIG_DIR: process.env.STOKO_CONFIG_DIR || userData,
      },
      stdio: isDev ? 'inherit' : 'ignore',
    },
  );

  backendProcess.on('exit', (code) => {
    if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stoko:backend-exit', code);
    }
  });

  await waitForBackend(apiUrl);
}

function resolveFrontendUrl() {
  if (process.env.STOKO_FRONTEND_URL) return process.env.STOKO_FRONTEND_URL;

  const distIndex = isDev
    ? path.join(projectRoot, 'frontend', 'dist', 'index.html')
    : path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) return pathToFileURL(distIndex).toString();

  return 'http://localhost:5173';
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    title: 'Stoko',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--stoko-api-url=${apiUrl}`],
    },
  });

  await mainWindow.loadURL(resolveFrontendUrl());
}

async function boot() {
  try {
    await startBackend();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox('No se pudo iniciar Stoko', error.message);
    app.quit();
  }
}

app.whenReady().then(boot);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && apiUrl) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});
