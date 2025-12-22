import { create } from "zustand";
import { Message } from "./types";

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  initialized: boolean;
  initialQuestion: string | null;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setInitialQuestion: (question: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  initialized: false,
  initialQuestion: null,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ initialized }),
  setInitialQuestion: (question) => set({ initialQuestion: question }),
  reset: () => set({ messages: [], isLoading: false, initialized: false, initialQuestion: null }),
}));