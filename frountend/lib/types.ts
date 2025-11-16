export interface Message {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: Date;
}

export interface StartBackgroundResponse {
  session_id: string;
  message: string;
}

export interface BackgroundChatResponse {
  response: string;
}

export interface StartInterviewResponse {
  session_id: string;
  intro: string;
}

export interface InteractResponse {
  response: string;
  command?: string;
}