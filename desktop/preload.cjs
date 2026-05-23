const { contextBridge } = require('electron');

const apiArg = process.argv.find((arg) => arg.startsWith('--stoko-api-url='));
const apiUrl = apiArg ? apiArg.replace('--stoko-api-url=', '') : 'http://127.0.0.1:8000';

contextBridge.exposeInMainWorld('STOKO_API_URL', apiUrl);
contextBridge.exposeInMainWorld('STOKO_DESKTOP', {
  apiUrl,
});
