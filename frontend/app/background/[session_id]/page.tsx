"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { InterviewTimer } from "@/components/InterviewTimer";
import { useChatStore } from "@/lib/store";
import { getBackgroundMessages, sendBackgroundMessage, sendMessage } from "@/lib/api";
import { CodeInputBox } from "@/components/CodeInputBox";
import { Clock, User, Code2, Bot } from 'lucide-react';

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useTheme } from "next-themes";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { theme } = useTheme();

  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    initialized,
    setInitialized,
    initialQuestion,
    reset,
    currentQuestion,
    totalQuestions,
    timeRemaining,
    phase,
    setInterviewState,
    updateTimeRemaining,
  } = useChatStore();

  const setHistory = async () => {
    if (messages.length > 0) return; // Prevent duplicate loading if already loaded

    try {
      let interview = await getBackgroundMessages(sessionId);

      setElapsedTime(interview.time_spent);

      // Set phase if it was saved
      if (interview.phase && interview.phase !== "background") {
        setInterviewState({ phase: interview.phase as any });
      }

      // Check if we need to redirect to technical interview page
      if (interview.phase && interview.phase !== "background" && interview.phase !== "intro") {
        router.push(`/interview/${sessionId}`);
        return;
      }

      interview.history.forEach((msg) => {
        addMessage({
          role: msg.role,
          message: msg.message,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        });
      });
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        console.error("Session expired. Redirecting to home.");
        router.push("/");
      } else {
        console.error("Failed to fetch background messages:", error);
      }
    }
  };

  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!fetchingRef.current) {
      fetchingRef.current = true;
      setHistory();
    }
  }, [sessionId]); // Only run on mount/session change

  useEffect(() => {
    const interval = setInterval(() => {
      if (phase === "background") {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    if (!initialized && initialQuestion) {
      addMessage({
        role: "interviewer",
        message: initialQuestion,
        timestamp: new Date(),
      });
      setInitialized(true);
    }
  }, [sessionId, initialized, initialQuestion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleBack = () => {
    router.push("/");
    reset();
  };

  const handleSendMessage = async (message: string) => {
    addMessage({
      role: "candidate",
      message: message,
      timestamp: new Date(),
    });

    setLoading(true);

    try {
      // Use different endpoint based on phase
      if (phase === "background") {
        const messageTimeStamp = Date.now();
        const response = await sendBackgroundMessage(sessionId, message, messageTimeStamp, elapsedTime);

        // Check if we're transitioning to technical portion
        if (response.command === "start_technical") {
          addMessage({
            role: "interviewer",
            message: response.response,
            timestamp: new Date(response.message_timestamp),
          });

          // Update state for technical interview
          setInterviewState({
            currentQuestion: response.current_question || 1,
            totalQuestions: response.total_questions || 2,
            timeRemaining: response.time_remaining || 3000,
            phase: "q1",
          });
        } else {
          addMessage({
            role: "interviewer",
            message: response.response,
            timestamp: new Date(response.message_timestamp),
          });
        }
      } else {
        // Technical interview phase - use interact endpoint
        const response = await sendMessage(sessionId, message);

        // Update time from server
        if (response.time_remaining !== undefined) {
          updateTimeRemaining(response.time_remaining);
        }

        // Handle different commands
        switch (response.command) {
          case "end":
            if (response.response) {
              addMessage({
                role: "interviewer",
                message: response.response,
                timestamp: new Date(),
              });
            }
            setInterviewState({ phase: "ended" });
            setTimeout(() => {
              router.push(`/thankyou?session_id=${sessionId}`);
            }, 2000);
            break;

          case "next_question":
            addMessage({
              role: "interviewer",
              message: response.response,
              timestamp: new Date(),
            });
            setInterviewState({
              currentQuestion: response.current_question,
              phase: "q2",
            });
            break;

          case "wrap_up":
            addMessage({
              role: "interviewer",
              message: response.response,
              timestamp: new Date(),
            });
            setInterviewState({ phase: "wrap_up" });
            break;

          case "continue":
          default:
            addMessage({
              role: "interviewer",
              message: response.response,
              timestamp: new Date(),
            });
            break;
        }
      }
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        console.error("Session expired. Redirecting to home.");
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      addMessage({
        role: "interviewer",
        message: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isInTechnicalPhase = phase !== "background";

  return (
    <div className="flex flex-col h-screen bg-gray">
      <header className="p-5 border-b transition-colors dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-gray-700 dark:text-white">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  DSA Mock Interview
                </h1>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border border-gray-700
              ${isInTechnicalPhase
                ? "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-gray-800 dark:text-emerald-400"
              }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${isInTechnicalPhase ? "bg-blue-400" : "bg-emerald-400"}`}></span>
              {isInTechnicalPhase ? "Technical Interview" : "Background"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Show Timer for technical phase, or elapsed time for background */}
            {isInTechnicalPhase ? (
              <InterviewTimer
                timeRemaining={timeRemaining}
                currentQuestion={currentQuestion}
                totalQuestions={totalQuestions}
                phase={phase}
                isWrapUp={phase === "wrap_up"}
              />
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:bg-gray-800 border-gray-700 transition-colors">
                <Clock className="h-5 w-5 dark:text-gray-300" />
                <span className="font-mono text-lg font-semibold dark:text-gray-100">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}

            {/* User */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:bg-gray-800 border-gray-700 transition-colors">
              <User className="h-5 w-5 dark:text-gray-300" />
              <span className="font-medium dark:text-gray-100">
                Candidate
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">

          {/* LEFT: CHAT PANEL */}
          <Panel defaultSize={55} minSize={30}>
            <div className="p-5 backdrop-blur-sm border-b shadow-sm transition-colors dark:bg-gray-900/80 border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-600 to-teal-600" >
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold dark:text-white">
                    AI Interviewer
                  </h2>
                  <p className="text-sm text-emerald-400">
                    Online • Ready to help
                  </p>
                </div>
              </div>
            </div>
            <div className="h-full flex flex-col border-t border-gray-200 dark:border-gray-700">
              <div
                ref={chatContainerRef}
                className="h-[80%] overflow-y-auto px-4 pt-6 space-y-4 chat-container no-scrollbar dark:bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
              >
                {messages.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">
                      Initializing session...
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    isLast={index === messages.length - 1}
                  />
                ))}

                {isLoading && <LoadingIndicator />}
              </div>

              <div className="p-4 backdrop-blur-sm border-t transition-colors dark:bg-gray-900/80 border-gray-800">
                <ChatInput onSend={handleSendMessage} disabled={isLoading || phase === "ended"} />
              </div>
            </div>
          </Panel>

          {/* RESIZE HANDLE */}
          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-col-resize transition-colors" />

          {/* RIGHT: CODE PANEL */}
          <Panel defaultSize={45} minSize={25}>
            <div className="h-full border-l border-gray-200 dark:border-gray-700">
              <CodeInputBox onSend={handleSendMessage} />
            </div>
          </Panel>

        </PanelGroup>
      </div>

    </div>
  );
}