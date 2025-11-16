"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

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
        style={{
          height: "auto",
          minHeight: "52px",
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, 128) + "px";
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none flex items-center gap-2"
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