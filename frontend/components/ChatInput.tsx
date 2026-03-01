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
  const [interimText, setInterimText] = useState(""); // live transcript shown while recording
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // countdown in seconds
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_RECORD_SECONDS = 240; // 4 minutes

  // Initialize speech recognition once (done lazily on first toggle)
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
    recog.interimResults = true;   // show live transcription
    recog.maxAlternatives = 1;
    recog.continuous = true;       // keep recording until user clicks Stop

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
    };

    recog.onend = () => {
      // If recording was still marked as active (e.g., silence timeout), restart
      setIsRecording((prev) => {
        if (prev) {
          // Browser auto-stopped; restart to keep continuous feel
          try { recog.start(); } catch { }
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
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  };

  const toggleRecording = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      // Start recording
      const recog = getRecognition();
      if (!recog) return;
      try {
        recog.start();
        setIsRecording(true);
        setTimeLeft(MAX_RECORD_SECONDS);

        // Countdown display
        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev === null || prev <= 1) return null;
            return prev - 1;
          });
        }, 1000);

        // Auto-stop after 4 minutes
        autoStopTimerRef.current = setTimeout(() => {
          stopRecording();
        }, MAX_RECORD_SECONDS * 1000);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleSend = () => {
    // If mic is recording, stop it and send whatever we have
    if (isRecording) {
      stopRecording();
    }
    const text = message.trim();
    if (text && !disabled) {
      onSend(text);
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full">
      {TEXT_INPUT_ENABLED && isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="italic truncate">
            {interimText || "Listening, press send when you are done…"}
          </span>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <button
          type="button"
          disabled={disabled}
          onClick={toggleRecording}
          title={isRecording ? `Click to stop recording (${timeLeft}s left)` : "Click to start recording"}
          className={`
            inline-flex items-center justify-center
            h-10 w-10 rounded-md flex-shrink-0
            text-white shadow-md
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-emerald-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 ring-2 ring-red-400/40"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            }
          `}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Text input — only rendered when env flag is true */}
        {TEXT_INPUT_ENABLED && (
          <>
            <input
              value={message + (interimText ? " " + interimText : "")}
              onChange={(e) => {
                setMessage(e.target.value);
                setInterimText("");
              }}
              placeholder={disabled ? "Waiting for response…" : isRecording ? "Speak now — or type…" : "Type your answer…"}
              onKeyDown={handleKeyPress}
              disabled={disabled}
              className="
                flex-1 min-w-0 rounded-md border px-3 py-2 text-sm
                bg-gray-800 border-gray-700 text-white placeholder:text-gray-500
                transition-colors focus:outline-none
                focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />

            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && !interimText.trim())}
              title="Send message"
              className="
                inline-flex items-center justify-center
                h-10 w-10 rounded-md flex-shrink-0
                bg-gradient-to-r from-emerald-600 to-teal-600
                text-white shadow-md
                transition-all duration-200
                hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        )}

        {/* When text input is hidden: inline listening indicator + Send button */}
        {!TEXT_INPUT_ENABLED && (
          <>
            {/* Inline listening indicator — lives between mic and send */}
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${isRecording
              ? "bg-red-500/10 border-red-500/30 text-red-300 animate-pulse"
              : "bg-gray-800/40 border-gray-700/50 text-gray-600"
              }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecording ? "bg-red-500" : "bg-gray-600"
                }`} />
              <span className="italic truncate flex-1">
                {isRecording
                  ? (interimText || "Listening... Press send when you are done")
                  : "Click mic to speak…"}
              </span>
              {isRecording && timeLeft !== null && (
                <span className="text-[11px] text-red-400/70 font-mono flex-shrink-0">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && !interimText.trim())}
              title="Send spoken answer"
              className="
                inline-flex items-center gap-2 px-4 h-10 rounded-md flex-shrink-0
                bg-gradient-to-r from-emerald-600 to-teal-600
                text-white text-sm font-medium shadow-md
                transition-all duration-200
                hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </>
        )}
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        {isRecording
          ? "🔴 Recording — click the mic again to stop & send"
          : TEXT_INPUT_ENABLED
            ? "Click mic to speak, or type your answer and press Enter"
            : "Click mic to start speaking, click again to stop & send"}
      </p>
    </div>
  );
}