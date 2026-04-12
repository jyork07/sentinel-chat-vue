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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
      <div className="glass rounded-full flex items-center gap-3 px-4 py-2.5 border-primary/10">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground/50 font-light"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="h-7 w-7 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-20"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
