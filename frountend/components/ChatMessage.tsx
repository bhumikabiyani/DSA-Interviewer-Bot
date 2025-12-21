"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { Bot, User } from "lucide-react";
import { speakInterviewerText } from "@/lib/api";

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
  
    if (process.env.NEXT_PUBLIC_ENABLE_TTS === "true"){
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
          <p className="text-sm leading-relaxed">{message.message}</p>
        </div>
        <span className={`text-xs mt-1 px-2 ${isCandidate ? 'text-blue-400' : 'text-gray-500'}`}>
          {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}