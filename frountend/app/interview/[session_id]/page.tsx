"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { useChatStore } from "@/lib/store";
import { sendMessage } from "@/lib/api";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, addMessage, setLoading, initialized, setInitialized, initialQuestion } =
    useChatStore();

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    if (!initialized) {
      initializeInterview();
    }
  }, [sessionId, initialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const initializeInterview = async () => {
    // If we have the initial question from start_interview, display it
    if (initialQuestion) {
      addMessage({
        role: "interviewer",
        content: initialQuestion,
        timestamp: new Date(),
      });
      setInitialized(true);
    } else {
      // Fallback: if somehow we don't have the question, redirect to home
      router.push("/");
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
      const response = await sendMessage(sessionId, message);
      
      // Check if the interview should end
      if (response.command === "end") {
        // Add final message if there is one
        if (response.response) {
          addMessage({
            role: "interviewer",
            content: response.response,
            timestamp: new Date(),
          });
        }
        // Wait a moment for the message to be visible, then redirect
        setTimeout(() => {
          router.push("/thankyou");
        }, 1500);
      } else {
        // Normal message flow
        addMessage({
          role: "interviewer",
          content: response.response,
          timestamp: new Date(),
        });
      }
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
              DSA Interview Session
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Session: {sessionId.slice(0, 8)}...
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
              Initializing interview...
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isLoading && <LoadingIndicator />}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}