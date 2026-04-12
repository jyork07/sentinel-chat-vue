import { useRef, useEffect, useCallback, useState } from "react";

interface UseSpeechOptions {
  onResult: (transcript: string) => void;
  onWakeWord?: () => void;
  wakeWord?: string;
}

export function useSpeechRecognition({ onResult, onWakeWord, wakeWord = "jarvis" }: UseSpeechOptions) {
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [awake, setAwake] = useState(false);
  const awakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = (finalTranscript + interimTranscript).toLowerCase();

      if (!awake && combined.includes(wakeWord)) {
        setAwake(true);
        onWakeWord?.();
        // Reset awake timeout
        if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
        awakeTimeoutRef.current = setTimeout(() => setAwake(false), 30000);
        return;
      }

      if (awake && finalTranscript.trim()) {
        // Remove wake word from the start if present
        let cleaned = finalTranscript.trim();
        const lc = cleaned.toLowerCase();
        if (lc.startsWith(wakeWord)) {
          cleaned = cleaned.slice(wakeWord.length).trim();
        }
        if (cleaned) {
          onResult(cleaned);
          // Reset awake timeout
          if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
          awakeTimeoutRef.current = setTimeout(() => setAwake(false), 30000);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart
      try { recognition.start(); } catch {}
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.error("Speech error:", e.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {}
  }, [awake, onResult, onWakeWord, wakeWord]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
    setAwake(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
    };
  }, []);

  return { listening, awake, startListening, stopListening, setAwake };
}

export function speak(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!window.speechSynthesis) return null;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 0.9;
  utterance.volume = 1;
  
  // Try to get a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) 
    || voices.find(v => v.lang.startsWith("en-") && v.localService)
    || voices.find(v => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return utterance;
}
