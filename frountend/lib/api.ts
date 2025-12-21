import { StartBackgroundResponse, BackgroundChatResponse, StartInterviewResponse, InteractResponse, Message, RecentInterviewsResponse } from "./types";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function startBackground(): Promise<StartBackgroundResponse> {
  const response = await fetch(`${API_BASE_URL}/api/start_background`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    // add an pop to show that your Session has expired and you need to login again
    if (response.status === 401) {
      
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    else {
      throw new Error(`Failed to start background: ${response.statusText}`);
    }
  }

  return response.json();
}

export async function getBackgroundMessages(sessionId: string): Promise<Message[]> {
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

export async function sendBackgroundMessage(
  sessionId: string,
  message: string
): Promise<BackgroundChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/background_chat`, {
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
    throw new Error(`Failed to send background message: ${response.statusText}`);
  }

  return response.json();
}

export async function startInterview(sessionId: string): Promise<StartInterviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/start_interview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
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
