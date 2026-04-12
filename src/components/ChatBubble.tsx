import type { ChatMessage } from "@/lib/jarvis-api";
import { Bot, User } from "lucide-react";

interface Props {
  message: ChatMessage;
  isNew?: boolean;
}

export default function ChatBubble({ message, isNew }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : ""} ${isNew ? "message-enter" : ""}`}>
      <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-1 ${
        isUser ? "bg-secondary" : "glass glow-primary"
      }`}>
        {isUser ? <User size={13} className="text-muted-foreground" /> : <Bot size={13} className="text-primary" />}
      </div>
      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? "bg-secondary text-secondary-foreground"
          : "glass text-foreground"
      }`}>
        {message.content}
      </div>
    </div>
  );
}
