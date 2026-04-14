const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let vaultPath = 'C:\\Users\\jamie\\Documents\\Obsidian Vault';

// ── Vault IPC handlers ──────────────────────────────────────

ipcMain.handle('vault:getPath', () => vaultPath);

ipcMain.handle('vault:setPath', (_event, newPath) => {
  vaultPath = newPath;
  return true;
});

ipcMain.handle('vault:read', async (_event, filePath) => {
  const full = path.join(vaultPath, filePath);
  if (!full.startsWith(vaultPath)) throw new Error('Path traversal blocked');
  return fs.readFileSync(full, 'utf-8');
});

ipcMain.handle('vault:write', async (_event, filePath, content) => {
  const full = path.join(vaultPath, filePath);
  if (!full.startsWith(vaultPath)) throw new Error('Path traversal blocked');
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  return true;
});

ipcMain.handle('vault:list', async (_event, dirPath = '') => {
  const full = path.join(vaultPath, dirPath);
  if (!full.startsWith(vaultPath)) throw new Error('Path traversal blocked');
  if (!fs.existsSync(full)) return [];
  const entries = fs.readdirSync(full, { withFileTypes: true });
  return entries.map(e => ({
    name: e.name,
    isDirectory: e.isDirectory(),
    path: path.join(dirPath, e.name).replace(/\\/g, '/'),
  }));
});

ipcMain.handle('vault:search', async (_event, query) => {
  const results = [];
  const q = query.toLowerCase();

  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(rel, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q)) {
            const lines = content.split('\n');
            const matchLine = lines.findIndex(l => l.toLowerCase().includes(q));
            results.push({
              path: relPath,
              name: entry.name,
              snippet: matchLine >= 0 ? lines.slice(Math.max(0, matchLine - 1), matchLine + 3).join('\n') : lines.slice(0, 3).join('\n'),
            });
          }
        } catch { /* skip unreadable */ }
      }
      if (results.length >= 20) return;
    }
  }

  walk(vaultPath, '');
  return results;
});

// ── Window ──────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#030712',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
