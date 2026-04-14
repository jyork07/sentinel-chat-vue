const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Obsidian vault operations
  readVaultFile: (filePath) => ipcRenderer.invoke('vault:read', filePath),
  writeVaultFile: (filePath, content) => ipcRenderer.invoke('vault:write', filePath, content),
  listVaultFiles: (dirPath) => ipcRenderer.invoke('vault:list', dirPath),
  searchVault: (query) => ipcRenderer.invoke('vault:search', query),
  getVaultPath: () => ipcRenderer.invoke('vault:getPath'),
  setVaultPath: (vaultPath) => ipcRenderer.invoke('vault:setPath', vaultPath),
});
