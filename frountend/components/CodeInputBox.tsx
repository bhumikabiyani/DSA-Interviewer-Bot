"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CodeInputBoxProps {
  onSend: (code: string, lang: string) => void;
  disabled?: boolean;
}

export function CodeInputBox({ onSend, disabled }: CodeInputBoxProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const { theme, setTheme } = useTheme();

  const handleSend = () => {
    if (!code.trim()) return;
    onSend(code, language);
    setCode("");
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-900">

      {/* HEADER */}
      <div className="px-4 py-2 bg-gray-800 flex items-center justify-between border-b border-gray-700">
        <p className="text-gray-300 text-sm font-mono">Code Editor</p>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm px-2 py-1 rounded"
        >
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>
      </div>

      {/* EDITOR */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value: string | undefined) => setCode(value || "")}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
          }}
        />
      </div>

      {/* BUTTONS */}
      <div className="p-3 border-t border-gray-700 bg-gray-800 flex gap-2">

        <button
          onClick={handleSend}
          disabled={disabled}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Add to Chat
        </button>
      </div>
    </div>
  );
}
