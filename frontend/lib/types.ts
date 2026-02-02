export interface Message {
  role: "interviewer" | "candidate";
  message: string;
  timestamp?: Date;
}

export interface CandidateInfo {
  type: "student" | "professional";
  currentRole: string;
  organization: string;
  expectations: string;
}

export interface StartInterviewWithFormResponse {
  session_id: string;
  intro_message: string;
  current_question: number;
  total_questions: number;
  time_remaining: number;
  phase: string;
}

export interface InteractResponse {
  response: string;
  command: "continue" | "next_question" | "wrap_up" | "end";
  time_remaining: number;
  current_question: number;
  question_text?: string;
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
  phase?: string;
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
  phase?: string;
  current_question?: number;
  time_remaining?: number;
  evaluation?: Evaluation;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Evaluation types
export interface QuestionScore {
  question_title: string;
  score: number;
  completion_method: "code" | "verbal" | "incomplete";
  time_taken_minutes: number;
  criteria_scores: {
    problem_understanding: number;
    approach_algorithm: number;
    code_quality: number | null;
    complexity_analysis: number;
    communication: number;
    code_execution: number | null;
  };
  strengths: string[];
  areas_for_improvement: string[];
}

export interface Evaluation {
  overall_score: number;
  recommendation: string;
  questions: QuestionScore[];
  overall_feedback: string;
  technical_skills_summary?: string;
  communication_skills_summary?: string;
}

export interface EvaluationResponse {
  session_id: string;
  evaluation: Evaluation;
  summary: string;
}