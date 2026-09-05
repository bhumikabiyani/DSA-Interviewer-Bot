"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface InterviewTimerProps {
  timeRemaining: number;
  currentQuestion: number;
  totalQuestions: number;
  phase: "background" | "intro" | "q1" | "q2" | "wrap_up" | "ended";
  isWrapUp?: boolean;
}

export function InterviewTimer({
  timeRemaining,
  phase,
  isWrapUp = false,
}: InterviewTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (phase === "ended" || phase === "background") return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = displayTime <= 180;
  const isCritical = displayTime <= 60;

  if (phase === "background") {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border font-mono text-xs transition-colors ${
        phase === "ended"
          ? "bg-zinc-900 border-zinc-800 text-emerald-400"
          : isCritical
          ? "bg-red-950/50 border-red-900/80 text-red-400 animate-pulse"
          : isLowTime
          ? "bg-amber-950/40 border-amber-900/60 text-amber-400"
          : "bg-zinc-900 border-zinc-800 text-zinc-300"
      }`}
    >
      {phase === "ended" ? (
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
      ) : isLowTime ? (
        <AlertTriangle className={`w-3.5 h-3.5 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
      ) : (
        <Clock className="w-3.5 h-3.5 text-zinc-400" />
      )}
      <span className="font-semibold tracking-tight">
        {phase === "ended" ? `${formatTime(displayTime)} elapsed` : formatTime(displayTime)}
      </span>

      {isWrapUp && (
        <span className="text-[10px] text-amber-400 ml-1">
          (Finalizing)
        </span>
      )}
    </div>
  );
}

