from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts"))

from dsa_interviewer.services.rag_service import RagService
from dsa_interviewer.services.groq_llm import GroqLLM
from dsa_interviewer.services.session_store import SessionStore
from question_selector import pick_random_question

logger = logging.getLogger(__name__)

router = APIRouter()
rag = RagService()
llm = GroqLLM()
sessions = SessionStore()

SYSTEM_PROMPT = """
You are a professional DSA mock interviewer.
Ask follow-up questions, never reveal full solutions.
Focus on reasoning and edge-case understanding.
"""

class UserMessage(BaseModel):
    session_id: str
    message: str

@router.post("/start_interview")
def start_interview():
    try:
        q_path, question_text = pick_random_question()
        
        if not question_text:
            raise HTTPException(status_code=500, detail="No questions available in knowledge base")
        
        session_id = sessions.create_session(question_text)

        # Save introduction message to history
        intro_msg = INTERVIEWER_INTRODUCTION + "\nAre you ready to begin?"
        sessions.add_message(session_id, "interviewer", intro_msg)

        logger.info(f"Started interview session {session_id} with question from {q_path}")
        return {
            "session_id": session_id,
            "question": question_text,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interact")
def interact(payload: UserMessage):
    try:
        if not sessions.session_exists(payload.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions.get_history(payload.session_id)
        question = session["question"]
        user_message = payload.message
        if(user_message.strip().lower() == "babi"):
            # end the session
            sessions.delete_session(payload.session_id)
            return {"response": "Thanks for the Interview Babi!", "command": "end"}
        history = session["history"]

        rag_context = rag.retrieve(question + "\n" + user_message)
        context_str = "\n".join(rag_context) if rag_context else ""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Interview Question: {question}"},
        ]

        for turn in history:
            role = "user" if turn["role"] == "candidate" else "assistant"
            messages.append({"role": role, "content": turn["message"]})

        messages.append({"role": "user", "content": user_message})
        messages.append({"role": "system", "content": f"Relevant Context:\n{context_str}"})

        reply = llm.chat(messages)

        sessions.add_message(payload.session_id, "candidate", user_message)
        sessions.add_message(payload.session_id, "interviewer", reply)

        logger.debug(f"Interaction in session {payload.session_id}")
        return {"response": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

