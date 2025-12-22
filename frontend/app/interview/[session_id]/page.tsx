"use client";
import Split from "react-split";
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
    if (initialQuestion) {
      addMessage({
        role: "interviewer",
        message: initialQuestion,
        timestamp: new Date(),
      });
      setInitialized(true);
    } else {
      router.push("/");
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

      // Check if the interview should end
      if (response.command === "end") {
        // Add final message if there is one
        if (response.response) {
          addMessage({
            role: "interviewer",
            message: response.response,
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
          message: response.response,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      addMessage({
        role: "interviewer",
        message: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex-1">
          <Split
            sizes={[50, 50]}
            minSize={200}
            gutterSize={8}
            direction="horizontal"
            className="flex h-full"
          >
            {/* LEFT SIDE — CHAT */}
            <div
              ref={chatContainerRef}
              className="overflow-y-auto px-4 py-4 space-y-4 border-r border-gray-300 dark:border-gray-700 h-full"
            >
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    Initializing interview...
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

            {/* RIGHT SIDE — CODE EDITOR */}
            <div className="bg-white dark:bg-gray-800 p-4 flex flex-col h-full">
              <textarea
                id="code-box"
                className="flex-1 w-full p-3 font-mono text-sm rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
                placeholder="Write your solution here..."
              />

              <button
                onClick={() => {
                  const code = (document.getElementById("code-box") as HTMLTextAreaElement).value;
                  handleSendMessage(code);
                }}
                disabled={isLoading}
                className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                Send Code
              </button>
            </div>
          </Split>
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
          <ChatMessage 
            key={index} 
            message={message} 
            isLast={index === messages.length - 1}
          />
        ))}

        {isLoading && <LoadingIndicator />}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}