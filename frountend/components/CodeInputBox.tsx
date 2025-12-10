"use client";

import { useState } from "react";

interface CodeInputBoxProps {
  onSend: (code: string) => void;
  disabled?: boolean;
}

export function CodeInputBox({ onSend, disabled }: CodeInputBoxProps) {
  const [code, setCode] = useState("");

  const handleSend = () => {
    if (!code.trim()) return;
    onSend(code);
    setCode("");
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-900">

      {/* Editor Header */}
      <div className="px-4 py-2 bg-gray-800 flex items-center justify-between border-b border-gray-700">
        <p className="text-gray-300 text-sm font-mono">Code Editor</p>

        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
      </div>

      {/* Code Editor Area */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your solution here..."
        className="
          flex-1 w-full p-4 font-mono text-sm
          bg-gray-900 text-gray-100
          border-none resize-none outline-none
          leading-6
        "
      />

      {/* Bottom Button */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <button
          onClick={handleSend}
          disabled={disabled}
          className="
            w-full py-2 rounded-lg
            bg-blue-600 hover:bg-blue-700
            disabled:bg-blue-400
            text-white font-medium
            transition
          "
        >
          Add to Chat
        </button>
      </div>
    </div>
  );
}
