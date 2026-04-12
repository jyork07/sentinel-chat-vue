import { useEffect, useRef, useState } from "react";
import { fetchChatHistory, sendMessage, type ChatMessage } from "@/lib/jarvis-api";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import SystemVitals from "@/components/SystemVitals";

export default function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMsgIdx, setNewMsgIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory(50)
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setNewMsgIdx(messages.length);
    setLoading(true);

    try {
      const response = await sendMessage(text);
      const assistantMsg: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      setNewMsgIdx((prev) => (prev !== null ? prev + 1 : null));
    } catch {
      const errMsg: ChatMessage = { role: "assistant", content: "Connection lost. Is the backend running?" };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      <SystemVitals />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-center pt-6 pointer-events-none">
        <h1 className="text-xs font-mono tracking-[0.3em] uppercase text-muted-foreground/60 glow-text">
          J.A.R.V.I.S.
        </h1>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 px-4 pt-16 pb-28 max-w-3xl mx-auto scrollbar-hide">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="h-16 w-16 rounded-full glass glow-primary flex items-center justify-center orb-pulse">
              <div className="h-6 w-6 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--glow-primary)/0.5)]" />
            </div>
            <p className="text-muted-foreground text-sm font-light">How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} isNew={newMsgIdx !== null && i >= newMsgIdx} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
