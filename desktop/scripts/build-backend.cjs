const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const backendDir = path.join(root, 'backend');
const python = process.env.STOKO_PYTHON || (
  process.platform === 'win32'
    ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
    : path.join(backendDir, '.venv', 'bin', 'python')
);

if (!fs.existsSync(python)) {
  console.error(`No se encontró Python en ${python}`);
  process.exit(1);
}

const args = [
  '-m',
  'PyInstaller',
  '--clean',
  '--noconfirm',
  '--name',
  'stoko-backend',
  '--collect-all',
  'google.genai',
  '--collect-all',
  'reportlab',
  '--collect-all',
  'openpyxl',
  '--hidden-import',
  'uvicorn.logging',
  '--hidden-import',
  'uvicorn.loops.auto',
  '--hidden-import',
  'uvicorn.protocols.http.auto',
  '--hidden-import',
  'uvicorn.protocols.websockets.auto',
  '--hidden-import',
  'app.main',
  'stoko_backend.py',
];

const result = spawnSync(python, args, {
  cwd: backendDir,
  env: {
    ...process.env,
    PYINSTALLER_CONFIG_DIR: process.env.PYINSTALLER_CONFIG_DIR || path.join(backendDir, '.pyinstaller'),
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
