"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { useChatStore } from "@/lib/store";
import { sendBackgroundMessage, startInterview } from "@/lib/api";

export default function BackgroundPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showTransitionButton, setShowTransitionButton] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const { messages, isLoading, addMessage, setLoading, initialized, setInitialized, initialQuestion } =
    useChatStore();

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    if (!initialized && initialQuestion) {
      addMessage({
        role: "interviewer",
        content: initialQuestion,
        timestamp: new Date(),
      });
      setInitialized(true);
    }
  }, [sessionId, initialized, initialQuestion]);

  useEffect(() => {
    scrollToBottom();
    
    if (messages.length >= 6) {
      setShowTransitionButton(true);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (message: string) => {
    addMessage({
      role: "candidate",
      content: message,
      timestamp: new Date(),
    });

    setLoading(true);

    try {
      const response = await sendBackgroundMessage(sessionId, message);
      
      addMessage({
        role: "interviewer",
        content: response.response,
        timestamp: new Date(),
      });
    } catch (error) {
      addMessage({
        role: "interviewer",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setTransitioning(true);
    
    try {
      const response = await startInterview(sessionId);
      
      addMessage({
        role: "interviewer",
        content: response.intro,
        timestamp: new Date(),
      });
      
      setTimeout(() => {
        router.push(`/interview/${sessionId}`);
      }, 1000);
    } catch (error) {
      addMessage({
        role: "interviewer",
        content: "Sorry, I couldn't start the interview. Please try again.",
        timestamp: new Date(),
      });
      setTransitioning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
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
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI DSA Interviewer
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Getting to know you before the technical interview
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-container"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Initializing background session...
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isLoading && <LoadingIndicator />}

        {transitioning && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Starting technical interview...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ChatInput onSend={handleSendMessage} disabled={isLoading || transitioning} />
      </div>
    </div>
  );
}