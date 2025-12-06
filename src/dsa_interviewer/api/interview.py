from fastapi import APIRouter, HTTPException, Depends
from dsa_interviewer.dependencies import get_current_user
from dsa_interviewer.models.user import User
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
You are a professional FAANG-style DSA interviewer with the following traits:

INTERVIEWER PERSONALITY:
- Calm, concise, friendly but professional.
- Encouraging: you guide the candidate, not intimidate.
- Analytical: you evaluate thinking, not just answers.
- Adaptive: if the candidate struggles, slow down.
- Socratic: ask one pointed question at a time.
- Likes to understand candidate's thought process. Not just final answers.

COMMUNICATION STYLE:
- If the candidate directly rushes to code without discussion, pause them and ask them not to rush explain the approach first optimize it and in the end we will code.
- Never repeat the full question again unless asked.
- Don’t be verbose; keep responses short but meaningful.
- Sound human: use conversational transitions (“Okay, great…”, “I see…”, “Let’s explore that…”).
- Do NOT give solutions, code, or formulas directly.
- Use hints subtly, like a real interviewer would.

WHAT TO FOCUS ON:
- With question ask the candidate to first explain their understanding of the problem.
- Guide them to outline an approach before coding.
- Encourage optimization before implementation.
- After coding, discuss test cases and edge cases.
- Evaluate their problem-solving process over just the final answer.
- Clarify problem understanding.
- Ask about edge cases.
- Ask about algorithm choice.
- Ask about time/space complexity.
- Ask for tradeoffs.
- Ask follow-up questions to test depth.

RULES:
- If the candidate directly rushes to code without discussion, pause them and ask them not to rush explain the approach first optimize it and in the end we will code.
- Never output the entire question again.
- Ask exactly ONE follow-up question per message.
- Use retrieved context only to enhance your hint quality, not to restate information.
- Maintain continuity and remember important points candidate said earlier.
- If candidate’s answer is weak, push gently: “Can you reason about X?”
- If candidate’s answer is strong, deepen the discussion: “Nice. Now what about Y?
- If you feel that the candidate has tried hard enough and reached a good solution then stop and ask new question”

"""

BACKGROUND_SYSTEM_PROMPT = """
You are a friendly technical interviewer conducting the initial background assessment.
Your goal is to understand the candidate's:
- Educational background and current role
- Programming experience and preferred languages
- DSA knowledge level and areas of strength/weakness
- Previous interview experiences
- Goals for this mock interview

Ask 3-5 short conversational questions to gather this information.
Be warm, encouraging, and professional.
Once you have enough background,  ask if they're ready to proceed to the technical questions.
"""

INTERVIEWER_INTRODUCTION = """Hello! I'm your DSA mock interviewer today. I'll be guiding you through a coding problem and asking follow-up questions to understand your thought process.

Feel free to think out loud, ask clarifying questions, and discuss your approach before coding. Let's begin!

"""

class UserMessage(BaseModel):
    session_id: str
    message: str

class BackgroundMessage(BaseModel):
    session_id: str
    message: str

@router.post("/start_background")
def start_background(current_user: User = Depends(get_current_user)):
# def start_background():
    try:
        session_id = sessions.create_background_session(current_user.id)
        
        intro_msg = """Hello! Welcome to your DSA mock interview. Before we dive into the technical questions, I'd like to learn a bit about your background.

Could you start by telling me about your educational background and current role?"""
        
        sessions.add_message(session_id, "interviewer", intro_msg)
        
        logger.info(f"Started background session {session_id}")
        return {
            "session_id": session_id,
            "message": intro_msg
        }
    except Exception as e:
        logger.error(f"Error starting background session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/background_chat")
def background_chat(payload: BackgroundMessage, current_user: User = Depends(get_current_user)):
# def background_chat(payload: BackgroundMessage):
    try:
        if not sessions.session_exists(payload.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions.get_history(payload.session_id)
        
        if session.get("phase") != "background":
            raise HTTPException(status_code=400, detail="Session is not in background phase")
        
        user_message = payload.message.strip()
        history = session["history"]
        
        messages = [{"role": "system", "content": BACKGROUND_SYSTEM_PROMPT}]
        
        for turn in history:
            role = "user" if turn["role"] == "candidate" else "assistant"
            messages.append({"role": role, "content": turn["message"]})
        
        messages.append({"role": "user", "content": user_message})
        
        reply = llm.chat(messages)
        
        sessions.add_message(payload.session_id, "candidate", user_message)
        sessions.add_message(payload.session_id, "interviewer", reply)
        
        return {"response": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in background chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start_interview")
def start_interview(payload: UserMessage, current_user: User = Depends(get_current_user)):
# def start_interview(payload: UserMessage):
    try:
        if not sessions.session_exists(payload.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions.get_history(payload.session_id)
        
        if session.get("phase") != "background":
            raise HTTPException(status_code=400, detail="Must complete background phase first")
        
        q_path, question_text = pick_random_question()
        
        if not question_text:
            raise HTTPException(status_code=500, detail="No questions available in knowledge base")
        
        sessions.transition_to_interview(payload.session_id, question_text)

        intro_msg = INTERVIEWER_INTRODUCTION + "\nAre you ready to begin?"
        sessions.add_message(payload.session_id, "interviewer", intro_msg)

        logger.info(f"Transitioned session {payload.session_id} to interview with question from {q_path}")
        return {
            "session_id": payload.session_id,
            "intro": intro_msg
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interact")
def interact(payload: UserMessage, current_user: User = Depends(get_current_user)):
# def interact(payload: UserMessage):
    try:
        if not sessions.session_exists(payload.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions.get_history(payload.session_id)
        question = session["question"]
        phase = session["phase"]
        user_message = payload.message.strip()

        # END keyword
        if user_message.lower() == "babi":
            sessions.delete_session(payload.session_id)
            return {"response": "Thanks for the Interview Babi!", "command": "end"}

        # ──────────────── PHASE 1 → INTRO ────────────────
        if phase == "introduction":
            # send the actual DSA question
            rag_context = rag.retrieve(question)
            context_str = "\n".join(rag_context) if rag_context else ""

            question_prompt = f"""
                    Here is your interview question:

                    {question}

                    Before we begin, could you walk me through your initial understanding of the problem?

                    Relevant Context:
                    {context_str} """

            sessions.add_message(payload.session_id, "candidate", user_message)
            sessions.add_message(payload.session_id, "interviewer", question_prompt)

            # move to interview phase
            session["phase"] = "interview"

            return {"response": question_prompt}

        # ──────────────── PHASE 2 → NORMAL INTERVIEW ────────────────
        history = session["history"]
        rag_context = rag.retrieve(question + "\n" + user_message)
        context_str = "\n".join(rag_context) if rag_context else ""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Interview Question: {question}"},
        ]

        # add full history
        for turn in history:
            role = "user" if turn["role"] == "candidate" else "assistant"
            messages.append({"role": role, "content": turn["message"]})

        # new user message
        messages.append({"role": "user", "content": user_message})

        # rag grounding
        messages.append({"role": "system", "content": f"Relevant Context:\n{context_str}"})

        reply = llm.chat(messages)

        sessions.add_message(payload.session_id, "candidate", user_message)
        sessions.add_message(payload.session_id, "interviewer", reply)

        return {"response": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

