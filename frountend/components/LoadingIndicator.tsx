"use client";
import { Bot } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-emerald-600 to-teal-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm p-4 shadow-sm bg-gray-800 border border-gray-700">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
  );
}