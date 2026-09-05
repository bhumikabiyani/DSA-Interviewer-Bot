"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { Bot, Check, Code2, Copy, SquareX, User, Volume2 } from "lucide-react";
import { speakInterviewerText } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

const LANG_META: Record<string, { label: string }> = {
  python: { label: "Python" },
  javascript: { label: "JavaScript" },
  java: { label: "Java" },
  cpp: { label: "C++" },
};

function parseCodeFence(text: string): { lang: string; code: string } | null {
  const fence = text.match(/^```(\w+)\n([\s\S]*?)\n?```\s*$/);
  if (fence) {
    return { lang: fence[1], code: fence[2] };
  }

  const custom = text.match(/^\[CODE SUBMISSION - (\w+)\]:\s*([\s\S]*)$/);
  if (custom) {
    return { lang: custom[1].toLowerCase(), code: custom[2] };
  }

  return null;
}

function CodeSubmissionBubble({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const meta = LANG_META[lang] ?? { label: lang.toUpperCase() };
  const lineCount = code.split("\n").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="rounded-md border border-zinc-800 bg-[#09090b] overflow-hidden max-w-full w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121215] border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-200">{meta.label}</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Copy code"
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto text-xs p-3 font-mono text-zinc-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {`\`\`\`${lang}\n${code}\n\`\`\``}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const isInterviewer = message.role === "interviewer";
  const isCandidate = message.role === "candidate";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const setGlobalSpeaking = useChatStore((state) => state.setIsSpeaking);

  const ttsEnabled = process.env.NEXT_PUBLIC_ENABLE_TTS === "true";

  useEffect(() => {
    if (!isInterviewer || !isLast || !ttsEnabled) {
      if (isLast && isInterviewer) setGlobalSpeaking(false);
      return;
    }

    let cancelled = false;

    async function playVoice() {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = await speakInterviewerText(message.message);
        if (cancelled) return;

        audioRef.current = audio;
        setIsSpeaking(true);
        setGlobalSpeaking(true);

        audio.onended = () => {
          setIsSpeaking(false);
          setGlobalSpeaking(false);
        };
        audio.onpause = () => {
          setIsSpeaking(false);
          setGlobalSpeaking(false);
        };
        await audio.play();
      } catch (err) {
        console.error("Interviewer TTS failed:", err);
        setIsSpeaking(false);
        setGlobalSpeaking(false);
      }
    }

    playVoice();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      setGlobalSpeaking(false);
    };
  }, [message.message, isInterviewer, isLast, ttsEnabled, setGlobalSpeaking]);

  const handleSkipAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setGlobalSpeaking(false);
  };

  const codeBlock = isCandidate ? parseCodeFence(message.message) : null;

  return (
    <div
      className={`flex gap-2.5 ${isCandidate ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}
    >
      <div
        className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0 text-zinc-300"
      >
        {isCandidate ? (
          <User className="h-3.5 w-3.5 text-zinc-300" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-zinc-300" />
        )}
      </div>

      <div className={`flex flex-col ${isCandidate ? "items-end" : "items-start"} max-w-[85%]`}>
        {codeBlock ? (
          <>
            <span className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              Editor Code Submission
            </span>
            <CodeSubmissionBubble lang={codeBlock.lang} code={codeBlock.code} />
          </>
        ) : isCandidate ? (
          <div className="rounded-md px-3.5 py-2.5 bg-[#18181b] border border-zinc-800 text-zinc-100 text-xs leading-relaxed">
            <p>{message.message}</p>
          </div>
        ) : (
          <div className="rounded-md px-3.5 py-2.5 bg-[#121215] border border-zinc-800/80 text-zinc-200 text-xs leading-relaxed">
            <div className="prose prose-sm prose-invert max-w-none text-xs text-zinc-200 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.message}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 px-1 ${isCandidate ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] font-mono text-zinc-500">
            {message.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isInterviewer && ttsEnabled && isSpeaking && (
            <button
              onClick={handleSkipAudio}
              title="Stop speaking"
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900"
            >
              <SquareX className="h-3 w-3" />
              Skip Audio
            </button>
          )}
          {isInterviewer && ttsEnabled && !isSpeaking && isLast && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Volume2 className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}