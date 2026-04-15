import { Download, Monitor, Cpu, Shield, Wifi, Github } from "lucide-react";

const DOWNLOAD_URL = "https://github.com/your-repo/jarvis/releases/latest/download/JARVIS-Setup.exe";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="text-primary">J.A.R.V.I.S.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Your personal AI assistant — voice control, gesture recognition, Obsidian memory, and local LLM powered intelligence. All running on your machine.
          </p>

          <a
            href={DOWNLOAD_URL}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-100"
          >
            <Download size={22} />
            Download for Windows
          </a>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Windows 10/11 · x64 · ~180 MB
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Cpu, title: "Local AI", desc: "Runs TinyLlama locally via Ollama — your data never leaves your machine." },
            { icon: Monitor, title: "Gesture Control", desc: "Hand gesture recognition via webcam using TensorFlow.js for hands-free commands." },
            { icon: Shield, title: "Obsidian Memory", desc: "Reads and writes to your Obsidian vault for persistent knowledge and conversation memory." },
            { icon: Wifi, title: "System Vitals", desc: "Real-time CPU, memory monitoring with a sleek HUD overlay." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-colors">
              <Icon size={24} className="text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup instructions */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-6 text-center">Quick Setup</h2>
        <ol className="space-y-4 text-sm text-muted-foreground">
          {[
            "Download and run JARVIS-Setup.exe",
            "Install Ollama and pull TinyLlama: ollama pull tinyllama",
            "Start the JARVIS backend: python main.py",
            "Launch JARVIS — it connects to localhost:7474 automatically",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-0.5 font-mono">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 text-center text-xs text-muted-foreground/50">
        <a href="/app" className="text-primary hover:underline mr-4">Launch Web App</a>
        <a href="https://github.com/your-repo/jarvis" className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors">
          <Github size={12} /> Source
        </a>
      </footer>
    </div>
  );
}
