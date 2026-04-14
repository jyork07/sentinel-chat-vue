import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchChatHistory, sendMessage, type ChatMessage } from "@/lib/jarvis-api";
import { useSpeechRecognition, speak } from "@/hooks/use-speech";
import { saveConversationMemory, searchKnowledge, getVaultStatus } from "@/lib/obsidian";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import SystemVitals from "@/components/SystemVitals";
import ConnectionStatus from "@/components/ConnectionStatus";
import ParticleCanvas from "@/components/ParticleCanvas";
import { Mic, MicOff, Hand, BookOpen, Save } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMsgIdx, setNewMsgIdx] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [vaultConnected, setVaultConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleVoiceResult = useCallback(async (text: string) => {
    setShowChat(true);
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => {
      setNewMsgIdx(prev.length);
      return [...prev, userMsg];
    });
    setLoading(true);

    try {
      const response = await sendMessage(text);
      const assistantMsg: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      setNewMsgIdx((prev) => (prev !== null ? prev + 1 : null));
      
      // Speak the response
      setIsSpeaking(true);
      speak(response, () => setIsSpeaking(false));
    } catch {
      const errMsg: ChatMessage = { role: "assistant", content: "I'm having trouble connecting to the backend." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const { listening, awake, startListening, stopListening } = useSpeechRecognition({
    onResult: handleVoiceResult,
    onWakeWord: () => {
      // Play a subtle chime or just visual feedback
    },
    wakeWord: "jarvis",
  });

  useEffect(() => {
    fetchChatHistory(50)
      .then((h) => {
        if (h.length > 0) {
          setMessages(h);
          setShowChat(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleTextSend = async (text: string) => {
    setShowChat(true);
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => {
      setNewMsgIdx(prev.length);
      return [...prev, userMsg];
    });
    setLoading(true);

    try {
      const response = await sendMessage(text);
      const assistantMsg: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      setNewMsgIdx((prev) => (prev !== null ? prev + 1 : null));
      setIsSpeaking(true);
      speak(response, () => setIsSpeaking(false));
    } catch {
      const errMsg: ChatMessage = { role: "assistant", content: "Connection lost. Is the backend running?" };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const intensity = loading ? 0.5 : isSpeaking ? 0.7 : awake ? 0.3 : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <ParticleCanvas intensity={intensity} speaking={isSpeaking} />

      <SystemVitals />
      <ConnectionStatus />

      {/* JARVIS title */}
      <div className="fixed top-5 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <h1 className="text-xs font-mono tracking-[0.4em] uppercase text-muted-foreground/50 glow-text">
          J.A.R.V.I.S.
        </h1>
      </div>

      {/* Status indicator */}
      <div className="fixed top-5 left-5 z-30">
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
            listening
              ? awake 
                ? "glass text-primary glow-green" 
                : "glass text-muted-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {listening ? (
            <Mic size={12} className={awake ? "text-primary" : ""} />
          ) : (
            <MicOff size={12} />
          )}
          {listening
            ? awake
              ? "Listening..."
              : 'Say "Jarvis"'
            : "Voice off"}
        </button>
      </div>

      {/* Center status when idle */}
      {!showChat && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="mt-32 text-center">
            <p className="text-muted-foreground/40 text-sm font-light">
              {listening ? (awake ? "I'm listening..." : 'Say "Jarvis" to begin') : "Enable voice to start"}
            </p>
          </div>
        </div>
      )}

      {/* Chat overlay */}
      {showChat && (
        <div className="fixed inset-0 z-20 flex flex-col pointer-events-none">
          <div className="flex-1 overflow-y-auto scrollbar-hide pt-16 pb-28 px-4 pointer-events-auto">
            <div className="max-w-2xl mx-auto flex flex-col gap-3">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} isNew={newMsgIdx !== null && i >= newMsgIdx} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleTextSend} disabled={loading} />
    </div>
  );
}
