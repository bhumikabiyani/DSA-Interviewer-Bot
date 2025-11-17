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

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}
export interface UserLogin {
  username: string;
  password: string;
}
export interface UserResponse {
  id: number;
  username: string;
  email: string;
}
export interface Token {
  access_token: string;
  token_type: string;
}
