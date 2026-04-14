// Type declarations for Electron IPC bridge
export {};

declare global {
  interface VaultEntry {
    name: string;
    isDirectory: boolean;
    path: string;
  }

  interface VaultSearchResult {
    path: string;
    name: string;
    snippet: string;
  }

  interface ElectronAPI {
    readVaultFile: (filePath: string) => Promise<string>;
    writeVaultFile: (filePath: string, content: string) => Promise<boolean>;
    listVaultFiles: (dirPath?: string) => Promise<VaultEntry[]>;
    searchVault: (query: string) => Promise<VaultSearchResult[]>;
    getVaultPath: () => Promise<string>;
    setVaultPath: (path: string) => Promise<boolean>;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
