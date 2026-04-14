// Obsidian vault integration — works via Electron IPC, falls back to localStorage in browser

const JARVIS_FOLDER = "JARVIS";

function isElectronAvailable(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

// ── Memory save (auto-save conversation summaries) ──────────

export async function saveMemory(title: string, content: string): Promise<boolean> {
  const date = new Date().toISOString().split("T")[0];
  const filename = `${JARVIS_FOLDER}/memories/${date}-${slugify(title)}.md`;
  const markdown = `---\ntitle: "${title}"\ndate: ${new Date().toISOString()}\ntags: [jarvis, memory]\n---\n\n${content}\n`;

  if (isElectronAvailable()) {
    return window.electronAPI!.writeVaultFile(filename, markdown);
  }
  // Fallback: localStorage
  const memories = JSON.parse(localStorage.getItem("jarvis-memories") || "[]");
  memories.push({ filename, content: markdown, date: new Date().toISOString() });
  localStorage.setItem("jarvis-memories", JSON.stringify(memories));
  return true;
}

// ── Knowledge search ────────────────────────────────────────

export async function searchKnowledge(query: string): Promise<VaultSearchResult[]> {
  if (isElectronAvailable()) {
    return window.electronAPI!.searchVault(query);
  }
  // Fallback: search localStorage memories
  const memories = JSON.parse(localStorage.getItem("jarvis-memories") || "[]");
  const q = query.toLowerCase();
  return memories
    .filter((m: any) => m.content.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q))
    .slice(0, 10)
    .map((m: any) => ({
      path: m.filename,
      name: m.filename.split("/").pop() || "",
      snippet: m.content.slice(0, 200),
    }));
}

// ── Read a specific note ────────────────────────────────────

export async function readNote(filePath: string): Promise<string | null> {
  if (isElectronAvailable()) {
    try {
      return await window.electronAPI!.readVaultFile(filePath);
    } catch {
      return null;
    }
  }
  const memories = JSON.parse(localStorage.getItem("jarvis-memories") || "[]");
  const found = memories.find((m: any) => m.filename === filePath);
  return found?.content || null;
}

// ── List vault files ────────────────────────────────────────

export async function listVaultFolder(dirPath = ""): Promise<VaultEntry[]> {
  if (isElectronAvailable()) {
    return window.electronAPI!.listVaultFiles(dirPath);
  }
  return [];
}

// ── Save conversation as memory ─────────────────────────────

export async function saveConversationMemory(
  messages: { role: string; content: string }[]
): Promise<boolean> {
  if (messages.length < 2) return false;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const title = lastUserMsg?.content.slice(0, 60) || "Conversation";

  const content = messages
    .map((m) => `**${m.role === "user" ? "You" : "JARVIS"}**: ${m.content}`)
    .join("\n\n");

  return saveMemory(title, content);
}

// ── Get vault connection status ─────────────────────────────

export async function getVaultStatus(): Promise<{ connected: boolean; path: string | null }> {
  if (isElectronAvailable()) {
    const path = await window.electronAPI!.getVaultPath();
    return { connected: true, path };
  }
  return { connected: false, path: null };
}

// ── Utility ─────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
