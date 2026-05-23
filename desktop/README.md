# Stoko Desktop

Electron levanta el backend FastAPI en `127.0.0.1` con un puerto local libre y carga el frontend con `window.STOKO_API_URL` apuntando a esa API.

## Desarrollo local

Requisitos:

- Backend con `.venv` instalado.
- Frontend con `node_modules` instalado.
- Dependencias de Electron instaladas en `desktop/`.

Comandos:

```bash
cd backend
.venv/bin/pip install -r requirements.txt

cd ../frontend
npm install
npm run build:electron

cd ../desktop
npm install
npm run dev
```

La base SQLite y la clave local quedan en el directorio de datos de usuario de Electron. Para pruebas manuales puedes forzar rutas con:

```bash
STOKO_DB_PATH=/tmp/stoko.db STOKO_CONFIG_DIR=/tmp/stoko-config npm run dev
```

## Empaquetado

Los scripts `build:mac`, `build:win` y `build:linux` preparan el frontend y ejecutan `electron-builder`.

Pendiente antes de distribución real:

- Incluir un runtime Python o backend congelado dentro del instalador.
- Probar instalación limpia en cada sistema operativo.
- Definir firma/notarización y estrategia de actualización.
