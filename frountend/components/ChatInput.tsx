"use client";

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
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        placeholder={disabled ? "Waiting for response..." : "Type your answer..."}
        className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[52px] max-h-32"
        rows={1}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, 128) + "px";
        }}
      />

      {/* Mic Button */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={isRecording ? stopListening : undefined}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className={`p-3 rounded-full transition 
          ${
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
          <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0011 5.91V21h-4a1 1 0 100 2h6a1 1 0 100-2h-2v-4.09A7 7 0 0019 11z" />
        </svg>
      </button>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 
          dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-all 
          duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md 
          disabled:shadow-none flex items-center gap-2"
      >
        <span>Send</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}