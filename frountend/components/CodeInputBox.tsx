"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Code, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface CodeInputBoxProps {
  onSend: (code: string, lang: string) => void;
  disabled?: boolean;
}

export function CodeInputBox({ onSend, disabled }: CodeInputBoxProps) {
  const [code, setCode] = useState(languageTemplates.python);
  const [language, setLanguage] = useState<keyof typeof languageTemplates>('python');
  const { theme, setTheme } = useTheme();
  const handleLanguageChange = (value: string) => {
    const lang = value as keyof typeof languageTemplates;
    setLanguage(lang);
    setCode(languageTemplates[lang]);
  };

  const handleSend = () => {
    if (!code.trim()) return;
    onSend(code, language);
    setCode("");
  };
  const handleReset = () => {
    setCode(languageTemplates[language]);
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">

      {/* HEADER */}
      <div className="p-5 backdrop-blur-sm border-b flex items-center justify-between transition-colors dark:bg-gray-900/50 border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-600 to-teal-600">
            <Code className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Code Editor
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Write and test your solution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">

          <Select value={language} onValueChange={handleLanguageChange}>
            {/* Trigger */}
            <SelectTrigger
              className={`
      w-[160px] transition-colors
      ${theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white data-[state=open]:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-900 data-[state=open]:bg-gray-50"
                }
    `}
            >
              <SelectValue placeholder="Language" />
            </SelectTrigger>

            {/* Dropdown */}
            <SelectContent
              className={`
      ${theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-200 text-gray-900"
                }
    `}
            >
              {/* JavaScript */}
              <SelectItem
                value="javascript"
                className={`
        ${theme === "dark"
                    ? "data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                    : "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                  }
      `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
                  JavaScript
                </div>
              </SelectItem>

              {/* Python */}
              <SelectItem
                value="python"
                className={`
        ${theme === "dark"
                    ? "data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                    : "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                  }
      `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                  Python
                </div>
              </SelectItem>

              {/* Java */}
              <SelectItem
                value="java"
                className={`
        ${theme === "dark"
                    ? "data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                    : "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                  }
      `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                  Java
                </div>
              </SelectItem>

              {/* C++ */}
              <SelectItem
                value="cpp"
                className={`
        ${theme === "dark"
                    ? "data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
                    : "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                  }
      `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  C++
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={handleReset}
            className="
              inline-flex items-center gap-2
              h-8 px-3 rounded-md
              border border-gray-700
              dark:bg-gray-800 dark:text-white
              text-sm font-medium
              transition-all
              hover:bg-gray-700
              disabled:pointer-events-none disabled:opacity-50
              focus:outline-none focus:ring-2 focus:ring-emerald-500
            "
          >
            <RotateCcw className="h-4 w-4" />
            Reset
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

const languageTemplates = {
  javascript: `// Write your solution here
function solution(input) {
  // Your code here
  
  return result;
}

// Test your solution
console.log(solution([1, 2, 3]));`,
  python: `# Write your solution here
def solution(input):
    # Your code here
    
    return result

# Test your solution
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