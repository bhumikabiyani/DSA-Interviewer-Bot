"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Code2, RotateCcw, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface CodeInputBoxProps {
  onSend: (code: string, lang: string) => void;
  disabled?: boolean;
}

export function CodeInputBox({ onSend, disabled }: CodeInputBoxProps) {
  const [code, setCode] = useState(languageTemplates.python);
  const [language, setLanguage] = useState<keyof typeof languageTemplates>("python");

  const handleLanguageChange = (value: string) => {
    const lang = value as keyof typeof languageTemplates;
    setLanguage(lang);
    setCode(languageTemplates[lang]);
  };

  const handleSend = () => {
    if (!code.trim()) return;
    onSend(code, language);
  };

  const handleReset = () => {
    setCode(languageTemplates[language]);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* HEADER TOOLBAR */}
      <div className="px-4 py-2 bg-[#121215] border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Code2 className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">Solution Workspace</span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-[120px] bg-[#18181b] border-zinc-800 text-zinc-200 text-xs focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200 text-xs">
              <SelectItem value="python" className="focus:bg-zinc-800 focus:text-zinc-100">
                Python
              </SelectItem>
              <SelectItem value="javascript" className="focus:bg-zinc-800 focus:text-zinc-100">
                JavaScript
              </SelectItem>
              <SelectItem value="java" className="focus:bg-zinc-800 focus:text-zinc-100">
                Java
              </SelectItem>
              <SelectItem value="cpp" className="focus:bg-zinc-800 focus:text-zinc-100">
                C++
              </SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-[#18181b] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-all"
            title="Reset code template"
          >
            <RotateCcw className="h-3 w-3 text-zinc-400" />
            Reset
          </button>

          <button
            onClick={handleSend}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            Submit Code
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value: string | undefined) => setCode(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "JetBrains Mono, Fira Code, Menlo, monospace",
            lineHeight: 20,
            wordWrap: "on",
            padding: { top: 12 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
}

const languageTemplates = {
  javascript: `// Write your solution here
function solution(input) {
    // Your code here
    
    return result;
}

console.log(solution([1, 2, 3]));`,
  python: `# Write your solution here
def solution(input):
    # Your code here
    
    return result

print(solution([1, 2, 3]))`,
  java: `// Write your solution here
class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`,
  cpp: `// Write your solution here
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
};