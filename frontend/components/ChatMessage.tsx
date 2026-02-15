"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { Bot, User } from "lucide-react";
import { speakInterviewerText } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const isInterviewer = message.role === "interviewer";
  const isCandidate = message.role === "candidate";

  // Keep reference to currently playing audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isInterviewer || !isLast) return;

    let cancelled = false;

    async function playVoice() {
      try {
        // Stop any previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = await speakInterviewerText(message.message);

        if (cancelled) return;

        audioRef.current = audio;
        await audio.play();
      } catch (err) {
        console.error("Interviewer TTS failed:", err);
      }
    }

    // Only call if the ENV ENABLE_TTS is set to true

    if (process.env.NEXT_PUBLIC_ENABLE_TTS === "true") {
      playVoice();
    }
    // playVoice();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [message.message, isInterviewer, isLast]);

  return (
    <div className={`flex gap-3 ${isCandidate ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isCandidate
        ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
        : 'bg-gradient-to-br from-emerald-600 to-teal-600'
        }`}>
        {isCandidate ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      <div className={`flex flex-col ${isCandidate ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${isCandidate
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
            }`}
        >
          {isCandidate ? (
            <p className="text-sm leading-relaxed">{message.message}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none
              prose-headings:text-emerald-400 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
              prose-h2:text-lg prose-h3:text-base
              prose-p:text-gray-100 prose-p:leading-relaxed prose-p:my-1.5
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-emerald-300 prose-code:bg-gray-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-600 prose-pre:rounded-lg prose-pre:my-3
              prose-ul:my-2 prose-ul:space-y-1 prose-ol:my-2 prose-ol:space-y-1
              prose-li:text-gray-200 prose-li:text-sm
              prose-table:border-collapse prose-table:my-3
              prose-th:bg-gray-700 prose-th:text-gray-200 prose-th:px-3 prose-th:py-1.5 prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-gray-600
              prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:border prose-td:border-gray-600 prose-td:text-gray-300
              prose-a:text-emerald-400 prose-a:underline
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.message}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className={`text-xs mt-1 px-2 ${isCandidate ? 'text-blue-400' : 'text-gray-500'}`}>
          {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}