"use client";

import { Mic, MicOff, Send } from "lucide-react";
import { useState, KeyboardEvent, useEffect, useRef } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const TEXT_INPUT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEXT_INPUT === "true";

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_RECORD_SECONDS = 240;

  const getRecognition = (): SpeechRecognition | null => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return null;
    }

    const recog: SpeechRecognition = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recog.continuous = true;

    recog.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      if (final) {
        setMessage((prev) => (prev + " " + final).trimStart());
      }
      setInterimText(interim);
    };

    recog.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setIsRecording(false);
      setInterimText("");

      if (e.error === "service-not-allowed") {
        showToast("Speech service blocked. Please check browser permissions.");
      } else if (e.error === "not-allowed") {
        showToast("Microphone permission denied.");
      } else {
        showToast("Mic error encountered. Try typing or using Chrome.");
      }
    };

    recog.onend = () => {
      setIsRecording((prev) => {
        if (prev) {
          try {
            recog.start();
          } catch {}
          return true;
        }
        return false;
      });
      setInterimText("");
    };

    recognitionRef.current = recog;
    return recog;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
    setTimeLeft(null);
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      const recog = getRecognition();
      if (!recog) return;
      try {
        recog.start();
        setIsRecording(true);
        setTimeLeft(MAX_RECORD_SECONDS);

        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev === null || prev <= 1) return null;
            return prev - 1;
          });
        }, 1000);

        autoStopTimerRef.current = setTimeout(() => {
          stopRecording();
        }, MAX_RECORD_SECONDS * 1000);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (sendBufferRef.current) clearTimeout(sendBufferRef.current);
    };
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const [isSendBuffering, setIsSendBuffering] = useState(false);
  const sendBufferRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRef = useRef(message);
  const interimRef = useRef(interimText);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);
  useEffect(() => {
    interimRef.current = interimText;
  }, [interimText]);

  const handleSend = () => {
    if (isSendBuffering || disabled) return;

    const wasRecording = isRecording;
    if (wasRecording) {
      stopRecording();
    }

    if (wasRecording) {
      setIsSendBuffering(true);
      sendBufferRef.current = setTimeout(() => {
        const text = (messageRef.current + (interimRef.current ? " " + interimRef.current : "")).trim();
        setInterimText("");
        setIsSendBuffering(false);
        if (text) {
          onSend(text);
          setMessage("");
        } else {
          showToast("No spoken text captured yet.");
        }
      }, 1800);
    } else {
      const text = (message + (interimText ? " " + interimText : "")).trim();
      setInterimText("");
      if (text) {
        onSend(text);
        setMessage("");
      } else {
        showToast("Please enter or speak a response first.");
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full relative">
      {toastMessage && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono shadow-md animate-in fade-in duration-150 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {isSendBuffering && (
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-blue-950/40 border border-blue-900/60 text-blue-400 text-xs animate-pulse font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Finalizing audio transcript & sending...</span>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <button
          type="button"
          disabled={disabled}
          onClick={toggleRecording}
          title={isRecording ? `Click to stop recording (${timeLeft}s left)` : "Toggle voice mic"}
          className={`inline-flex items-center justify-center h-8 w-8 rounded flex-shrink-0 text-zinc-200 border transition-all text-xs focus:outline-none ${
            isRecording
              ? "bg-red-950/80 border-red-800 text-red-300 animate-pulse"
              : "bg-[#18181b] hover:bg-zinc-800 border-zinc-800"
          }`}
        >
          {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </button>

        {TEXT_INPUT_ENABLED ? (
          <>
            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setInterimText("");
              }}
              placeholder={disabled ? "Processing AI response…" : isRecording ? "Listening to voice input…" : "Type your response or question..."}
              onKeyDown={handleKeyPress}
              disabled={disabled}
              className="flex-1 min-w-0 rounded h-8 border px-3 text-xs bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />

            <button
              onClick={handleSend}
              disabled={disabled || isSendBuffering || (!message.trim() && !interimText.trim())}
              title="Send message"
              className="inline-flex items-center justify-center h-8 px-3 rounded flex-shrink-0 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <div
              className={`flex-1 flex items-center gap-2 px-3 h-8 rounded border text-xs transition-all ${
                isRecording
                  ? "bg-red-950/30 border-red-900/50 text-red-300 animate-pulse"
                  : "bg-[#18181b] border-zinc-800 text-zinc-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? "bg-red-500" : "bg-zinc-600"}`} />
              <span className="truncate flex-1 font-mono text-[11px]">
                {isRecording ? "Recording active — speak your answer clearly" : "Click microphone icon to begin voice input"}
              </span>
              {isRecording && timeLeft !== null && (
                <span className="text-[10px] text-red-400 font-mono">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={disabled || isSendBuffering || (!message.trim() && !interimText.trim())}
              title="Send spoken answer"
              className="inline-flex items-center gap-1 px-3 h-8 rounded flex-shrink-0 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              <span>Send</span>
            </button>
          </>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 text-center font-mono">
        {isRecording
          ? "Voice active — click mic to stop, or click Send to finalize"
          : TEXT_INPUT_ENABLED
          ? "Press Enter to submit response"
          : "Voice input active"}
      </p>
    </div>
  );
}