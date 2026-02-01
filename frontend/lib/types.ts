export interface Message {
  role: "interviewer" | "candidate";
  message: string;
  timestamp?: Date;
}

export interface StartBackgroundResponse {
  session_id: string;
  message: string;
}

export interface BackgroundChatResponse {
  response: string;
  message_timestamp: number;
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

export interface Interview {
  interview_id: number;
  session_id: string;
}

export interface RecentInterviewsResponse {
  interviews: Interview[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ResumeInterviewResponse {
  history: Message[];
  time_spent: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}