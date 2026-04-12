const BASE_URL = "http://127.0.0.1:7474";

const HEADERS = {
  "X-JARVIS-TOKEN": "jarvis-openclaw-secret-2026",
  "Content-Type": "application/json",
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SysInfo {
  cpu: number;
  mem_pct: number;
  active_backend: string;
}

export interface OpenClawStatus {
  online: boolean;
}

export async function fetchChatHistory(n = 50): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE_URL}/api/history?n=${n}`, { headers: HEADERS });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function sendMessage(prompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/ollama/generate`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ model: "tinyllama", prompt, stream: false }),
  });
  if (!res.ok) throw new Error("Failed to generate response");
  const data = await res.json();
  return data.response;
}

export async function fetchSysInfo(): Promise<SysInfo> {
  const res = await fetch(`${BASE_URL}/api/sysinfo`, { headers: HEADERS });
  if (!res.ok) throw new Error("Failed to fetch sysinfo");
  return res.json();
}

export async function fetchOpenClawStatus(): Promise<OpenClawStatus> {
  try {
    const res = await fetch(`${BASE_URL}/api/openclaw/map`, { headers: HEADERS });
    if (!res.ok) return { online: false };
    const data = await res.json();
    const status = data?.data?.services_live?.OpenClaw?.status;
    return { online: status === "online" };
  } catch {
    return { online: false };
  }
}
