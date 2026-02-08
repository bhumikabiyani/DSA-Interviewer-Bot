import { StartInterviewWithFormResponse, InteractResponse, ResumeInterviewResponse, RecentInterviewsResponse, UserProfile, EvaluationResponse } from "./types";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getBackgroundMessages(sessionId: string): Promise<ResumeInterviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/resume_interview/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    } else {
      throw new Error(`Failed to get background messages: ${response.statusText}`);
    }
  }

  return response.json();
}

export async function startInterviewWithForm(candidateInfo: {
  type: string;
  currentRole: string;
  organization: string;
  expectations: string;
  difficulty: string;
}): Promise<StartInterviewWithFormResponse> {
  const response = await fetch(`${API_BASE_URL}/api/start_interview_with_form`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ candidate_info: candidateInfo }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to start interview: ${response.statusText}`);
  }

  return response.json();
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<InteractResponse> {
  const response = await fetch(`${API_BASE_URL}/api/interact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

export async function speakInterviewerText(text: string): Promise<HTMLAudioElement> {
  const response = await fetch(`${API_BASE_URL}/api/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Audio(audioUrl);
}

export async function getRecentInterviews(page: number = 1, pageSize: number = 10): Promise<RecentInterviewsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/getInterviewSession?page=${page}&page_size=${pageSize}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch recent interviews: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

export async function getLastInterviewInfo(): Promise<{
  candidate_info: {
    type: string;
    current_role: string;
    organization: string;
    expectations: string;
    difficulty: string;
  } | null;
}> {
  const response = await fetch(`${API_BASE_URL}/api/last_interview_info`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch last candidate info: ${response.statusText}`);
  }

  return response.json();
}

export async function evaluateInterview(sessionId: string): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to evaluate interview: ${response.statusText}`);
  }

  return response.json();
}

export async function getEvaluation(sessionId: string): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluation/${sessionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Evaluation not found, trigger evaluation first
      return evaluateInterview(sessionId);
    }
    throw new Error(`Failed to get evaluation: ${response.statusText}`);
  }

  return response.json();
}

