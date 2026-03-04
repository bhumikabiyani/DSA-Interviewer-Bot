import { create } from "zustand";
import { Message } from "./types";

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  initialized: boolean;
  initialQuestion: string | null;
  questionText: string | null;
  // Interview state
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  phase: "background" | "intro" | "q1" | "q2" | "wrap_up" | "ended";
  isSpeaking: boolean;
  // Actions
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setInitialQuestion: (question: string) => void;
  setQuestionText: (text: string | null) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setInterviewState: (state: {
    currentQuestion?: number;
    totalQuestions?: number;
    timeRemaining?: number;
    phase?: "background" | "intro" | "q1" | "q2" | "wrap_up" | "ended";
  }) => void;
  updateTimeRemaining: (seconds: number) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  initialized: false,
  initialQuestion: null,
  questionText: null,
  currentQuestion: 1,
  totalQuestions: 2,
  timeRemaining: 3000, // 50 minutes in seconds
  phase: "background",
  isSpeaking: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ initialized }),
  setInitialQuestion: (question) => set({ initialQuestion: question }),
  setQuestionText: (text) => set({ questionText: text }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setInterviewState: (newState) =>
    set((state) => ({
      currentQuestion: newState.currentQuestion ?? state.currentQuestion,
      totalQuestions: newState.totalQuestions ?? state.totalQuestions,
      timeRemaining: newState.timeRemaining ?? state.timeRemaining,
      phase: newState.phase ?? state.phase,
    })),
  updateTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  reset: () =>
    set({
      messages: [],
      isLoading: false,
      initialized: false,
      initialQuestion: null,
      questionText: null,
      currentQuestion: 1,
      totalQuestions: 2,
      timeRemaining: 3000,
      phase: "background",
      isSpeaking: false,
    }),
}));