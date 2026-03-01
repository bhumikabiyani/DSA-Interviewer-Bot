"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { Bot, Check, Code2, Copy, User } from "lucide-react";
import { speakInterviewerText } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

const LANG_META: Record<string, { label: string; dot: string }> = {
  python: { label: "Python", dot: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  javascript: { label: "JavaScript", dot: "bg-gradient-to-r from-yellow-400 to-orange-500" },
  java: { label: "Java", dot: "bg-gradient-to-r from-red-500 to-orange-500" },
  cpp: { label: "C++", dot: "bg-gradient-to-r from-purple-500 to-pink-500" },
};


function parseCodeFence(text: string): { lang: string; code: string } | null {
  const m = text.match(/^```(\w+)\n([\s\S]*?)\n?```\s*$/);
  if (!m) return null;
  return { lang: m[1], code: m[2] };
}

function CodeSubmissionBubble({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const meta = LANG_META[lang] ?? { label: lang.toUpperCase(), dot: "bg-gray-400" };
  const lineCount = code.split("\n").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  return (
    <div className="rounded-2xl rounded-tr-sm overflow-hidden shadow-lg border border-gray-600/60 bg-gray-850 max-w-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-800/80 border-b border-gray-700/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600">
            <Code2 className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className="text-sm font-semibold text-white">{meta.label}</span>
          </div>
          <span className="text-xs text-gray-500 border-l border-gray-700 pl-2.5 ml-0.5">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Copy code"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-gray-700/60"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body — rendered via ReactMarkdown so prism/highlight kicks in */}
      <div
        className="
          overflow-x-auto text-sm
          prose prose-sm prose-invert max-w-none
          prose-pre:m-0 prose-pre:p-0 prose-pre:rounded-none prose-pre:bg-transparent prose-pre:border-0
          prose-code:text-emerald-300 prose-code:bg-transparent prose-code:text-xs prose-code:font-mono
        "
      >
        <div className="bg-gray-900/80 px-4 py-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {`\`\`\`${lang}\n${code}\n\`\`\``}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const isInterviewer = message.role === "interviewer";
  const isCandidate = message.role === "candidate";
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

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [message.message, isInterviewer, isLast]);

  const codeBlock = isCandidate ? parseCodeFence(message.message) : null;

  return (
    <div
      className={`flex gap-3 ${isCandidate ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isCandidate
          ? "bg-gradient-to-br from-blue-600 to-cyan-600"
          : "bg-gradient-to-br from-emerald-600 to-teal-600"
          }`}
      >
        {isCandidate ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col ${isCandidate ? "items-end" : "items-start"} max-w-[80%]`}>
        {codeBlock ? (
          <>
            <span className="text-[11px] font-medium text-blue-400 mb-1.5 flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              Code submitted from editor
            </span>
            <CodeSubmissionBubble lang={codeBlock.lang} code={codeBlock.code} />
          </>
        ) : isCandidate ? (
          <div className="rounded-2xl p-4 shadow-sm transition-all hover:shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm">
            <p className="text-sm leading-relaxed">{message.message}</p>
          </div>
        ) : (
          <div className="rounded-2xl p-4 shadow-sm transition-all hover:shadow-md bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm">
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
          </div>
        )}
        <span className={`text-xs mt-1 px-2 ${isCandidate ? "text-blue-400" : "text-gray-500"}`}>
          {message.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}