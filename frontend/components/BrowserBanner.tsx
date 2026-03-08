"use client";

import { useState, useEffect } from "react";
import { Chrome, AlertTriangle, X } from "lucide-react";

export function BrowserBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const isDismissed = localStorage.getItem("browser-warning-dismissed");
    if (isDismissed) return;

    // Detect browser
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isOpera = /OPR/.test(navigator.userAgent);

    const detectBrave = async () => {
      const brave = (navigator as any).brave;
      if (brave && typeof brave.isBrave === "function") {
        const result = await brave.isBrave();
        if (result) {
          setIsBrave(true);
          setShowBanner(true);
          return true;
        }
      }
      return false;
    };

    detectBrave().then((detected) => {
      if (!detected) {
        // We specifically want to recommend "Google Chrome" for the best experience with the mic
        // and speech synthesis/recognition features which are often most stable there.
        if (!isChrome || isEdge || isOpera) {
          setShowBanner(true);
        }
      }
    });
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("browser-warning-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="sticky top-0 z-[100] w-full bg-indigo-600/90 backdrop-blur-md border-b border-white/20 px-4 py-2.5 shadow-lg animate-in slide-in-from-top duration-500">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="text-white text-sm font-medium">
              {isBrave ? (
                <>
                  Brave user? Please enable <span className="font-bold underline">"Google Services for Push Messaging and Speech"</span> in settings.
                </>
              ) : (
                <>
                  For the best experience, please use <span className="font-bold underline decoration-white/30 decoration-2 underline-offset-2">Google Chrome</span>.
                </>
              )}
            </p>
            <p className="text-indigo-100 text-xs sm:text-sm">
              {isBrave
                ? "The microphone requires this to work in Brave."
                : "The microphone might not work correctly in other browsers."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <Chrome className="h-3.5 w-3.5" />
            Get Chrome
          </a>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
