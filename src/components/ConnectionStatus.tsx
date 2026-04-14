import { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { fetchSysInfo } from "@/lib/jarvis-api";

export default function ConnectionStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      await fetchSysInfo();
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const id = setInterval(checkConnection, 15000);
    return () => clearInterval(id);
  }, [checkConnection]);

  if (connected === true) return null; // Hide when connected

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="glass rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto">
        {connected === false ? (
          <>
            <WifiOff size={14} className="text-destructive" />
            <span className="text-xs font-mono text-destructive/80">Backend unreachable</span>
          </>
        ) : (
          <>
            <Wifi size={14} className="text-muted-foreground animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">Connecting...</span>
          </>
        )}
        <button
          onClick={checkConnection}
          disabled={checking}
          className="ml-1 p-1 rounded-full hover:bg-secondary transition-colors"
        >
          <RefreshCw size={12} className={`text-muted-foreground ${checking ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
