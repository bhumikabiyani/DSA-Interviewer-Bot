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
    currentQuestion,
    totalQuestions,
    phase,
    isWrapUp = false,
}: InterviewTimerProps) {
    const [displayTime, setDisplayTime] = useState(timeRemaining);

    useEffect(() => {
        setDisplayTime(timeRemaining);
    }, [timeRemaining]);

    // Client-side countdown (synced with server on each message)
    useEffect(() => {
        if (phase === "ended" || phase === "background" || phase === "intro") return;

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

    const getPhaseLabel = (): string => {
        switch (phase) {
            case "background":
                return "Background";
            case "intro":
                return "Introduction";
            case "q1":
                return "Question 1";
            case "q2":
                return "Question 2";
            case "wrap_up":
                return "Wrapping Up";
            case "ended":
                return "Interview Ended";
            default:
                return "";
        }
    };

    const isLowTime = displayTime <= 180; // 3 minutes
    const isCritical = displayTime <= 60; // 1 minute

    if (phase === "background") {
        return null;
    }

    return (
        <div
            className={`
        flex items-center gap-4 px-4 py-2 rounded-lg backdrop-blur-sm
        ${isCritical
                    ? "bg-red-500/20 border border-red-500/50 animate-pulse"
                    : isLowTime
                        ? "bg-amber-500/20 border border-amber-500/50"
                        : "bg-white/10 border border-white/20"
                }
      `}
        >
            {/* Timer */}
            <div className="flex items-center gap-2">
                {isLowTime ? (
                    <AlertTriangle className={`w-5 h-5 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
                ) : (
                    <Clock className="w-5 h-5 text-gray-300" />
                )}
                <span
                    className={`text-lg font-mono font-semibold ${isCritical
                        ? "text-red-400"
                        : isLowTime
                            ? "text-amber-400"
                            : "text-white"
                        }`}
                >
                    {formatTime(displayTime)}
                </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/20" />

            {/* Question indicator */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                    {getPhaseLabel()}
                </span>
                {phase !== "wrap_up" && phase !== "ended" && (
                    <span className="text-xs text-gray-400">
                        ({currentQuestion}/{totalQuestions})
                    </span>
                )}
            </div>

            {/* Wrap-up indicator */}
            {isWrapUp && (
                <>
                    <div className="w-px h-6 bg-white/20" />
                    <span className="text-sm font-medium text-amber-400 animate-pulse">
                        ⏱️ Wrapping up...
                    </span>
                </>
            )}
        </div>
    );
}
