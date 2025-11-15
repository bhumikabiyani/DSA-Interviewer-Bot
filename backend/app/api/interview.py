from fastapi import APIRouter
from app.services.rag_service import RagService
from app.services.groq_llm import GroqLLM
from app.services.session_store import SessionStore
from pydantic import BaseModel

router = APIRouter()
rag = RagService()
llm = GroqLLM()
sessions = SessionStore()

SYSTEM_PROMPT = """
You are a professional DSA mock interviewer.
Ask follow-up questions, never reveal full solutions.
Focus on reasoning and edge-case understanding.
"""

class StartInterview(BaseModel):
    question: str

class UserMessage(BaseModel):
    session_id: str
    message: str

@router.post("/start_interview")
def start_interview(payload: StartInterview):
    question = payload.question
    session_id = sessions.create_session(question)
    return {"session_id": session_id, "question": question}

@router.post("/interact")
def interact(payload: UserMessage):
    session = sessions.get_history(payload.session_id)
    question = session["question"]
    user_message = payload.message

    rag_context = rag.retrieve(question + "\n" + user_message)

    prompt = f"""
Question: {question}

Context:
{rag_context}

Candidate said:
{user_message}

Respond as an interviewer.
"""

    reply = llm.generate(SYSTEM_PROMPT, prompt)

    sessions.add_message(payload.session_id, "candidate", user_message)
    sessions.add_message(payload.session_id, "interviewer", reply)

    return {"reply": reply}
