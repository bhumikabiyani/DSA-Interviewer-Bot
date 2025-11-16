"use client";

import { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isInterviewer = message.role === "interviewer";

  return (
    <div
      className={`flex ${isInterviewer ? "justify-start" : "justify-end"} animate-slide-up`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isInterviewer
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
            : "bg-indigo-600 text-white"
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">
            {isInterviewer ? (
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold mb-1 opacity-70">
              {isInterviewer ? "Interviewer" : "You"}
            </div>
            <div className="text-sm md:text-base whitespace-pre-wrap break-words">
              {message.content}
            </div>
            <div className="text-xs opacity-50 mt-1">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}