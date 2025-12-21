"use client";

import { Mic, Send } from "lucide-react";
import { useState, KeyboardEvent, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recog: SpeechRecognition = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    setRecognition(recog);
  }, []);

  // Start recording
  const startListening = () => {
    if (!recognition || disabled) return;
    setIsRecording(true);
    recognition.start();
  };

  // Stop recording
  const stopListening = () => {
    if (!recognition) return;
    recognition.stop();
    setIsRecording(false);
  };

  // Handle final speech result
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSend(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };
  }, [recognition, onSend]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end max-w-4xl mx-auto">

      {/* Mic Button */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={isRecording ? stopListening : undefined}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className={`
          inline-flex items-center justify-center
          h-12 w-12 rounded-md
          text-white
          shadow-md
          transition-all duration-200
          hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-emerald-500/40
          disabled:cursor-not-allowed
          ${isRecording ? "animate-pulse bg-red-500 hover:bg-red-600 from-red-500 to-red-600" : "bg-gradient-to-r from-emerald-600 to-teal-600"}
          `}
      >
        {/* className={`p-3 rounded-full transition 
          ${isRecording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
      > */}
        <Mic className="h-5 w-5" />
      </button>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "Waiting for response..." : "Type your answer..."}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        data-slot="input"
        className="
          placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
          focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
          aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
          flex-1 leading-7 py-2 transition-colors dark:bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="
          inline-flex items-center justify-center
          h-12 w-12 rounded-md
          bg-gradient-to-r from-emerald-600 to-teal-600
          text-white
          shadow-md
          transition-all duration-200
          hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-emerald-500/40
          disabled:cursor-not-allowed
          "
      >
        <Send className="h-5 w-5" />
      </button>

    </div>
  );
}