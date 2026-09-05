"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { InterviewTimer } from "@/components/InterviewTimer";
import { useChatStore } from "@/lib/store";
import { sendMessage, getBackgroundMessages, evaluateInterview } from "@/lib/api";
import { CodeInputBox } from "@/components/CodeInputBox";
import { Code2, User, Bot, Loader2, ArrowLeft } from "lucide-react";
import { Evaluation } from "@/lib/types";
import { EvaluationViewer } from "@/components/EvaluationViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    timeRemaining,
    phase,
    setInterviewState,
    updateTimeRemaining,
    questionText,
    setQuestionText,
    isSpeaking,
    reset,
  } = useChatStore();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  const fetchingRef = useRef(false);

  const loadSession = useCallback(async () => {
    try {
      const data = await getBackgroundMessages(sessionId);

      setInterviewState({
        phase: (data.phase as any) || "intro",
        currentQuestion: data.current_question || 1,
        timeRemaining: data.time_remaining || 3000,
      });

      data.history.forEach((msg: any) => {
        addMessage({
          role: msg.role,
          message: msg.message,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        });
      });

      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }

      const resumedPhase = data.phase || "intro";
      if (data.question_text && resumedPhase !== "intro") {
        setQuestionText(data.question_text);
      }

      setInitialized(true);
    } catch (error) {
      console.error("Failed to load session:", error);
      router.push("/dashboard");
    }
  }, [sessionId, router, setInterviewState, addMessage, setEvaluation, setQuestionText, setInitialized]);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    if (!initialized && !fetchingRef.current) {
      fetchingRef.current = true;
      loadSession();
    }
  }, [sessionId, initialized, loadSession, router]);

  useEffect(() => {
    if (phase === "ended" && !evaluation) {
      setLoadingEvaluation(true);
      evaluateInterview(sessionId)
        .then((data) => setEvaluation(data.evaluation))
        .catch((err) => console.error("Failed to load evaluation", err))
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

      if (response.time_remaining !== undefined) {
        updateTimeRemaining(response.time_remaining);
      }

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
          if (response.question_text && phase === "intro") {
            setQuestionText(response.question_text);
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

  const handleSendCode = async (code: string, lang: string) => {
    const fenced = `\`\`\`${lang}\n${code}\n\`\`\``;
    addMessage({
      role: "candidate",
      message: fenced,
      timestamp: new Date(),
      codeLanguage: lang,
    });

    setLoading(true);
    try {
      const response = await sendMessage(sessionId, `[CODE SUBMISSION - ${lang.toUpperCase()}]:\n${code}`);

      if (response.time_remaining !== undefined) {
        updateTimeRemaining(response.time_remaining);
      }

      switch (response.command) {
        case "end":
          if (response.response) {
            addMessage({ role: "interviewer", message: response.response, timestamp: new Date() });
          }
          setInterviewState({ phase: "ended" });
          break;
        case "next_question":
          addMessage({ role: "interviewer", message: response.response, timestamp: new Date() });
          setInterviewState({ currentQuestion: response.current_question, phase: "q2" });
          break;
        case "wrap_up":
          addMessage({ role: "interviewer", message: response.response, timestamp: new Date() });
          setInterviewState({ phase: "wrap_up" });
          break;
        case "continue":
        default:
          addMessage({ role: "interviewer", message: response.response, timestamp: new Date() });
          if (response.question_text && phase === "intro") {
            setQuestionText(response.question_text);
            setInterviewState({ phase: "q1" });
          }
          break;
      }
    } catch (error) {
      console.error("Error sending code:", error);
      addMessage({ role: "interviewer", message: "Sorry, I encountered an error. Please try again.", timestamp: new Date() });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    reset();
    router.push("/dashboard");
  };

  const isInTechnicalPhase = phase !== "intro" && phase !== "background";

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100">
      {/* Header */}
      <header className="px-4 h-13 py-2.5 border-b border-zinc-800/80 bg-[#09090b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-zinc-100">
              Interview Environment
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono border ${
              phase === "ended"
                ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                : isInTechnicalPhase
                ? "bg-blue-950/40 text-blue-400 border-blue-900/60"
                : "bg-amber-950/40 text-amber-400 border-amber-900/60"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                phase === "ended"
                  ? "bg-zinc-500"
                  : "animate-pulse " + (isInTechnicalPhase ? "bg-blue-400" : "bg-amber-400")
              }`}
            />
            {phase === "intro"
              ? "Introduction"
              : phase === "q1"
              ? "Question 1"
              : phase === "q2"
              ? "Question 2"
              : phase === "wrap_up"
              ? "Wrapping Up"
              : phase === "ended"
              ? "Interview Completed"
              : "Interview"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <InterviewTimer
            timeRemaining={timeRemaining}
            currentQuestion={currentQuestion}
            totalQuestions={1}
            phase={phase}
            isWrapUp={phase === "wrap_up"}
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
            <User className="h-3.5 w-3.5 text-zinc-400" />
            <span>Candidate</span>
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 overflow-hidden">
        {questionText ? (
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left: Question Panel */}
            <Panel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full flex flex-col border-r border-zinc-800/80 bg-[#0c0c0e]">
                <div className="px-3 py-2 bg-[#121215] border-b border-zinc-800/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Question Statement
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 prose prose-sm prose-invert max-w-none text-zinc-300 leading-relaxed text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {questionText}
                  </ReactMarkdown>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-[#18181b] hover:bg-blue-600/50 cursor-col-resize transition-colors" />

            {/* Middle + Right Panels */}
            <Panel defaultSize={75}>
              <PanelGroup direction="horizontal" className="h-full">
                {/* Chat Panel */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full flex flex-col bg-[#09090b]">
                    <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-xs text-zinc-100">AI Technical Interviewer</h2>
                          <p className="text-[10px] text-zinc-400">Evaluating problem approach</p>
                        </div>
                      </div>
                    </div>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
                      {messages.length === 0 && !isLoading && (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs text-zinc-500">Initializing conversation session...</p>
                        </div>
                      )}
                      {messages.map((message, index) => (
                        <ChatMessage key={index} message={message} isLast={index === messages.length - 1} />
                      ))}
                      {isLoading && <LoadingIndicator />}
                    </div>
                    {phase !== "ended" && (
                      <div className="p-3 border-t border-zinc-800/80 bg-[#121215]">
                        <ChatInput onSend={handleSendMessage} disabled={isLoading || isSpeaking} />
                      </div>
                    )}
                  </div>
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#18181b] hover:bg-blue-600/50 cursor-col-resize transition-colors" />

                {/* Right: Code Editor or Evaluation */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full border-l border-zinc-800/80 bg-[#09090b] flex flex-col">
                    {phase === "ended" ? (
                      <div className="p-4 h-full overflow-y-auto">
                        {loadingEvaluation ? (
                          <div className="flex h-full items-center justify-center gap-2 text-xs text-zinc-400">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            Generating rubric evaluation report...
                          </div>
                        ) : evaluation ? (
                          <EvaluationViewer evaluation={evaluation} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                            Failed to generate evaluation scorecard.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full min-h-0">
                        <CodeInputBox onSend={handleSendCode} disabled={isLoading} />
                      </div>
                    )}
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        ) : (
          /* 2-Panel Layout: Chat + Code */
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-[#09090b]">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-xs text-zinc-100">AI Technical Interviewer</h2>
                      <p className="text-[10px] text-zinc-400">Session initialization</p>
                    </div>
                  </div>
                </div>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
                  {messages.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-zinc-500">Starting interview conversation...</p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} isLast={index === messages.length - 1} />
                  ))}
                  {isLoading && <LoadingIndicator />}
                </div>
                {phase !== "ended" && (
                  <div className="p-3 border-t border-zinc-800/80 bg-[#121215]">
                    <ChatInput onSend={handleSendMessage} disabled={isLoading || isSpeaking} />
                  </div>
                )}
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-[#18181b] hover:bg-blue-600/50 cursor-col-resize transition-colors" />

            <Panel defaultSize={50} minSize={30}>
              <div className="h-full border-l border-zinc-800/80 bg-[#09090b] flex flex-col">
                {phase === "ended" ? (
                  <div className="p-4 h-full overflow-y-auto">
                    {loadingEvaluation ? (
                      <div className="flex h-full items-center justify-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        Generating rubric evaluation report...
                      </div>
                    ) : evaluation ? (
                      <EvaluationViewer evaluation={evaluation} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        Failed to generate evaluation scorecard.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-0">
                    <CodeInputBox onSend={handleSendCode} disabled={isLoading} />
                  </div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}