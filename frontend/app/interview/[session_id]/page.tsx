"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { InterviewTimer } from "@/components/InterviewTimer";
import { useChatStore } from "@/lib/store";
import { sendMessage, getBackgroundMessages, evaluateInterview } from "@/lib/api";
import { CodeInputBox } from "@/components/CodeInputBox";
import { Code2, User, Bot, Loader2 } from 'lucide-react';
import { Evaluation } from "@/lib/types";
import { EvaluationViewer } from "@/components/EvaluationViewer";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    initialized,
    setInitialized,
    currentQuestion,
    totalQuestions,
    timeRemaining,
    phase,
    setInterviewState,
    updateTimeRemaining,
  } = useChatStore();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  const fetchingRef = useRef(false);

  const loadSession = useCallback(async () => {
    try {
      const data = await getBackgroundMessages(sessionId);

      // Update phase and interview state from server
      setInterviewState({
        phase: data.phase as any || "intro",
        currentQuestion: data.current_question || 1,
        timeRemaining: data.time_remaining || 3000,
      });

      // Add history messages
      data.history.forEach((msg: any) => {
        addMessage({
          role: msg.role,
          message: msg.message,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        });
      });

      // Set evaluation if present (optimization)
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }

      setInitialized(true);
    } catch (error) {
      console.error("Failed to load session:", error);
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, router]);

  // Load session on mount
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    if (!initialized && !fetchingRef.current) {
      fetchingRef.current = true;
      loadSession();
    }
  }, [sessionId, initialized, router, loadSession]);

  useEffect(() => {
    if (phase === "ended" && !evaluation) {
      setLoadingEvaluation(true);
      evaluateInterview(sessionId)
        .then(data => setEvaluation(data.evaluation))
        .catch(err => console.error("Failed to load evaluation", err))
        .finally(() => setLoadingEvaluation(false));
    }
  }, [phase, sessionId, evaluation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (message: string) => {
    addMessage({
      role: "candidate",
      message: message,
      timestamp: new Date(),
    });

    setLoading(true);

    try {
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
          // Update phase if server indicates Q1 started
          if (response.question_text && phase === "intro") {
            setInterviewState({ phase: "q1" });
          }
          break;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({
        role: "interviewer",
        message: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  const isInTechnicalPhase = phase !== "intro" && phase !== "background";

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-300 hover:text-white transition-colors"
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
              <h1 className="text-xl font-bold text-white">DSA Interview</h1>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border border-gray-600
              ${phase === "ended"
                ? "bg-gray-700 text-gray-400"
                : isInTechnicalPhase
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
              <span className={`h-2 w-2 rounded-full ${phase === "ended" ? "bg-gray-500" : "animate-pulse " + (isInTechnicalPhase ? "bg-blue-400" : "bg-amber-400")}`}></span>
              {phase === "intro" ? "Introduction" :
                phase === "q1" ? "Question 1" :
                  phase === "q2" ? "Question 2" :
                    phase === "wrap_up" ? "Wrapping Up" :
                      phase === "ended" ? "Interview Ended" : "Interview"}
            </span>
          </div>

          <div className="flex items-center gap-3">


            <InterviewTimer
              timeRemaining={timeRemaining}
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              phase={phase}
              isWrapUp={phase === "wrap_up"}
            />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800">
              <User className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-medium text-gray-100">Candidate</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel */}
          <Panel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col bg-gray-900">
              <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">AI Interviewer</h2>
                    <p className="text-sm text-emerald-400">Online • Guiding your interview</p>
                  </div>
                </div>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
              >
                {messages.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Loading interview...</p>
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

              {phase !== "ended" && (
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500 cursor-col-resize transition-colors" />

          {/* Code Panel */}
          <Panel defaultSize={45} minSize={25}>
            <div className={`h-full border-l border-gray-700 ${phase === "ended" ? "bg-white dark:bg-gray-900 overflow-y-auto" : ""}`}>
              {phase === "ended" ? (
                <div className="p-6 h-full min-h-0">
                  {loadingEvaluation ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                  ) : evaluation ? (
                    <EvaluationViewer evaluation={evaluation} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Failed to load evaluation.
                    </div>
                  )}
                </div>
              ) : (
                <CodeInputBox onSend={handleSendMessage} />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}