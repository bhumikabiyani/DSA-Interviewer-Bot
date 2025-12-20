"use client";

import { useEffect } from "react";
import { Message } from "@/lib/types";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isInterviewer = message.role === "interviewer";
  const isCandidate = message.role === "candidate";

  // Speak interviewer messages using Chrome TTS
  useEffect(() => {
    if (!isInterviewer) return; // Only speak interviewer messages
    if (!window.speechSynthesis) return; // Safety: not supported

    const utter = new SpeechSynthesisUtterance(message.content);
    utter.rate = 1;   // speaking speed
    utter.pitch = 1;  // normal pitch
    utter.volume = 1; // full volume

    // optional: pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    if (voice) utter.voice = voice;

    // Stop previous speech, then speak
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [message.content, isInterviewer]);

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
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <span className={`text-xs mt-1 px-2 ${isCandidate ? 'text-blue-400' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}