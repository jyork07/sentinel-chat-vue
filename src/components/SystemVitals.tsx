import { useEffect, useState } from "react";
import { Cpu, Activity } from "lucide-react";
import { fetchSysInfo, fetchOpenClawStatus, type SysInfo } from "@/lib/jarvis-api";

export default function SystemVitals() {
  const [sys, setSys] = useState<SysInfo | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const poll = () => {
      fetchSysInfo().then(setSys).catch(() => {});
      fetchOpenClawStatus().then((s) => setOnline(s.online)).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="vitals-pill fixed top-4 right-4 z-50 flex items-center gap-3 rounded-full px-4 py-2 text-xs font-mono text-muted-foreground select-none">
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${online ? "bg-primary shadow-[0_0_6px_hsl(145,80%,42%)]" : "bg-destructive shadow-[0_0_6px_hsl(0,72%,51%)]"}`} />
        <span className="opacity-60">OCR</span>
      </div>
      {sys && (
        <>
          <div className="flex items-center gap-1">
            <Cpu size={11} className="text-primary opacity-70" />
            <span>{sys.cpu.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={11} className="text-primary opacity-70" />
            <span>{sys.mem_pct.toFixed(0)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
