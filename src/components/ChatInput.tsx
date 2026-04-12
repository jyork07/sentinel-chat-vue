import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
      <div className="glass glow-primary rounded-full flex items-center gap-3 px-5 py-3">
        {/* Orb icon */}
        <div className={`h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 ${disabled ? "orb-pulse" : ""}`}>
          <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--glow-primary)/0.6)]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask JARVIS..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground font-light"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-30"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
