import json
import logging
import re
from datetime import datetime
from math import ceil
from typing import Optional

import boto3
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from dsa_interviewer.core.config import settings
from dsa_interviewer.core.database import get_db
from dsa_interviewer.dependencies import get_current_user
from dsa_interviewer.models.interview import Interview
from dsa_interviewer.models.user import User
from dsa_interviewer.services.evaluation import get_evaluation_service
from dsa_interviewer.services.groq_llm import GroqLLM
from dsa_interviewer.services.session_store import SessionStore
from dsa_interviewer.utils.interview import pick_random_question

logger = logging.getLogger(__name__)

router = APIRouter()

polly = boto3.client(
    "polly",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)

llm = GroqLLM()
sessions = SessionStore()

SYSTEM_PROMPT = """
You are a professional FAANG-style DSA interviewer.

PERSONALITY:
- Calm, concise, friendly, professional.
- Socratic: one pointed question at a time.
- Guide thinking — never give away the answer.

COMMUNICATION STYLE:
- If the candidate directly rushes to code without discussion, pause them and ask them not to rush explain the approach first optimize it and in the end we will code.
- Never repeat the full question again unless asked.
- Don’t be verbose; keep responses short but meaningful.
- Sound human: use conversational transitions (“Okay, great…”, “I see…”, “Let’s explore that…”).
- Do NOT give solutions, code, or formulas directly.
- Use hints subtly, like a real interviewer would.

INTERVIEW FLOW:
1. Acknowledge the candidate background, ask for a short self-intro.
2. After intro, present the DSA question.
3. For each question: understanding → approach → code → complexity → edge cases.
4. Only ask for code once the approach is fully explained.
5. Mark [QUESTION_COMPLETE] only AFTER complexity AND edge cases are discussed.

RULES:
- Never repeat the full question.
- Ask exactly ONE question per message. No lists of questions.
- No solutions, no formulas, no code from your side — hints only.
- Rush to code without approach? Stop them: "Walk me through your approach first."
- If the candidate pastes a large block of code directly (code submission) without prior discussion of approach, be firm and a little rough. Do NOT let them skip the thinking process.
- If someone pastes code after discussing approach, still ask them to explain key parts: "Okay, walk me through this — what does this section do? Any edge cases you're missing?"
- If candidate answers something different from what is asked, repeat whatever you asked
- [QUESTION_COMPLETE] must NEVER appear in the same message where you ask a question or discuss complexity/edge cases.
- Wrap-up mode (<3 min): acknowledge time, let candidate finish current thought, give brief summary only.

WRAP-UP MODE:
When told we're in wrap-up mode (less than 3 minutes remaining):
- Acknowledge the time constraint gracefully
- Allow the candidate to finish their current thought
- Provide a brief summary of how they did
- Do NOT start any new questions or deep discussions


Abusive language: respond with exactly: [INTERVIEW_TERMINATED] I'm sorry, but this interview has been terminated due to inappropriate behaviour. The platform owners have been notified.

RESPONSE LENGTH — MANDATORY — NO EXCEPTIONS:
- Maximum 2 short sentences per reply.
- One idea per sentence. One question per reply.
- No bullet points, no summaries, no long explanations in chat.
- If it feels long — cut it in half before sending.
"""

ELABORATION_PROMPT = """
You are a technical content creator. Given the following DSA question metadata, generate an elaborative, FAANG-style problem statement.
Include:
1. A clear 'Problem Description'.
2. A test cases section.

QUESTION METADATA:
Title: {title}
Difficulty: {difficulty} (1=Easy, 2=Medium, 3=Hard)
Topics: {topic_tag}

Provide ONLY the final markdown text for the question. Ask user to understand the question and ask if they have any doubts.
"""

# ---------------------------------------------------------------------------
# Content moderation
# ---------------------------------------------------------------------------
_VIOLATION_PATTERNS = [
    r"\bf+u+c+k\b", r"\bs+h+i+t\b", r"\bb+i+t+c+h\b", r"\ba+s+s+h+o+l+e\b",
    r"\bc+u+n+t\b", r"\bd+i+c+k\b", r"\bb+a+s+t+a+r+d\b", r"\bw+h+o+r+e\b",
    r"\bm+o+t+h+e+r+f+u+c+k\b", r"\bn+i+g+g+e+r\b", r"\bf+a+g+g+o+t\b",
    r"\bk+i+l+l\s+y+o+u+r+s+e+l+f\b", r"\bs+t+u+p+i+d\s+b+o+t\b",
    r"\bi\s+h+a+t+e\s+y+o+u\b",
]
_VIOLATION_RE = re.compile("|".join(_VIOLATION_PATTERNS), re.IGNORECASE)


def _contains_violation(text: str) -> bool:
    """Return True if the text contains abusive / inappropriate content."""
    return bool(_VIOLATION_RE.search(text))


_TERMINATION_RESPONSE = (
    "⚠️ This interview has been immediately terminated due to the use of "
    "inappropriate or violating language. The platform owners have been "
    "notified of this incident. We take respectful communication very "
    "seriously. Goodbye."
)


class UserMessage(BaseModel):
    session_id: str
    message: str

class TTSRequest(BaseModel):
    text: str

class StartInterviewRequest(BaseModel):
    # Question filters (always optional)
    topic: Optional[str] = None        # comma-separated e.g. "Arrays,Two Pointer"
    difficulty: Optional[int] = None   # 1=Easy, 2=Medium, 3=Hard, None=all
    # Candidate info (optional — provide for a personalised greeting)
    type: Optional[str] = None         # 'student' | 'professional'
    current_role: Optional[str] = ""   # Degree / Job title
    organization: Optional[str] = ""  # University / Company
    expectations: Optional[str] = ""

class InteractRequest(BaseModel):
    session_id: str
    message: str

class InteractResponse(BaseModel):
    response: str
    command: str  # 'continue', 'next_question', 'wrap_up', 'end'
    time_remaining: int
    current_question: int
    question_text: Optional[str] = None

@router.get("/last_interview_info")
def get_last_candidate_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get candidate info from the user's most recent interview for form prefilling."""
    try:
        # Get the most recent interview for this user
        last_interview = (
            db.query(Interview)
            .filter(Interview.user_id == str(current_user.id))
            .order_by(Interview.created_at.desc())
            .first()
        )

        if not last_interview:
            return {"candidate_info": None}

        # Parse metadata to get candidate_info
        metadata = last_interview.metadata_
        if isinstance(metadata, str):
            import json
            metadata = json.loads(metadata)

        candidate_info = metadata.get("candidate_info") if metadata else None

        return {"candidate_info": candidate_info}
    except Exception as e:
        logger.error(f"Error fetching last candidate info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume_interview/{session_id}")
def resume_interview(session_id: str, current_user: User = Depends(get_current_user)):
# def resume_interview(session_id: str):
    try:
        interview = sessions.get_history(session_id)
        state = sessions.get_session_state(session_id)
        return {
            "history": interview["history"],
            "total_time_taken": interview["total_time_taken"],
            "phase": state["phase"],
            "current_question": state["current_question"],
            "time_remaining": state["time_remaining"],
            "question_text": interview.get("question"),
            "evaluation": interview.get("evaluation") if state["phase"] == "ended" else None,
        }
    except Exception as e:
        logger.error(f"Error resuming interview for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start_interview")
def start_interview(
    payload: StartInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unified endpoint: start an interview with optional topic/difficulty filters
    and optional candidate profile info for a personalised greeting."""
    try:
        # ── Question selection ───────────────────────────────────────────────
        topic_tags = None
        if payload.topic:
            topic_tags = [t.strip() for t in payload.topic.split(",") if t.strip()]

        q_data = pick_random_question(db, difficulty=payload.difficulty, topic_tags=topic_tags)
        if not q_data:
            raise HTTPException(status_code=404, detail="No questions found for the selected topic/difficulty")

        # ── Session setup ────────────────────────────────────────────────────
        session_id = sessions.create_background_session(current_user.id)

        has_profile = bool(payload.type)  # True when candidate info was submitted

        sessions.set_candidate_info(session_id, {
            "type": payload.type or "quick_start",
            "current_role": payload.current_role or "",
            "organization": payload.organization or "",
            "expectations": payload.expectations or "",
            "difficulty": str(payload.difficulty) if payload.difficulty is not None else "all",
        })

        # ── Question elaboration ─────────────────────────────────────────────
        elaboration_input = ELABORATION_PROMPT.format(
            title=q_data['title'],
            difficulty=q_data['difficulty'],
            topic_tag=q_data['topic_tag'],
        )
        elaborated_text = llm.chat([{"role": "user", "content": elaboration_input}])
        questions = [(str(q_data['id']), elaborated_text)]
        sessions.start_interview(session_id, questions)

        # ── Intro message ────────────────────────────────────────────────────
        if has_profile:
            intro_msg = "Welcome! Great to have you here. Tell me briefly about yourself and your DSA experience."
        else:
            intro_msg = "Welcome! Let's get started. Tell me briefly about yourself and your DSA background."

        timestamp = int(datetime.utcnow().timestamp())
        sessions.add_message(current_user.id, session_id, "interviewer", intro_msg, timestamp)
        time_remaining = sessions.get_time_remaining(session_id)

        logger.info(
            f"Started interview session {session_id} "
            f"(topic={payload.topic}, difficulty={payload.difficulty}, profile={has_profile})"
        )

        return {
            "session_id": session_id,
            "intro_message": intro_msg,
            "current_question": 1,
            "total_questions": len(questions),
            "time_remaining": time_remaining,
            "phase": "intro",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interact", response_model=InteractResponse)
def interact(payload: InteractRequest, current_user: User = Depends(get_current_user)):
    """Handle candidate messages during the technical interview."""
    try:
        session_id = payload.session_id
        user_message = payload.message.strip()

        # ── Content-moderation guard ─────────────────────────────────────────
        if _contains_violation(user_message):
            logger.warning(
                f"Violation detected in session {session_id} by user {current_user.id}: '{user_message[:80]}'"
            )
            # End the session immediately
            try:
                sessions.end_interview(session_id, reason="violation")
            except Exception:
                pass  # best-effort; don't block the response
            return InteractResponse(
                response=_TERMINATION_RESPONSE,
                command="end",
                time_remaining=0,
                current_question=1,
            )
        # ────────────────────────────────────────────────────────────────────

        session = sessions.get_history(session_id)
        history = session["history"]
        phase = session["phase"]

        # Check time status
        time_status = sessions.check_time_status(session_id)
        time_remaining = sessions.get_time_remaining(session_id)
        current_q = sessions.get_current_question(session_id)
        current_question_num = current_q[0] if current_q else 2

        # Handle force end
        if time_status == "force_end":
            sessions.end_interview(session_id)
            return InteractResponse(
                response="We've reached the end of our time. Thank you for participating in this interview! You'll receive a summary of your performance shortly.",
                command="end",
                time_remaining=0,
                current_question=current_question_num,
            )

        # Handle wrap-up mode
        if time_status == "wrap_up":
            # Check if final response is still allowed
            can_respond = sessions.use_final_response(session_id)

            if not can_respond:
                # No more responses allowed, end the interview
                sessions.end_interview(session_id)
                # Get time_remaining AFTER ending to get total_time_taken
                final_time = sessions.get_time_remaining(session_id)
                return InteractResponse(
                    response="Thank you for your response. We're out of time now. Great effort on both questions! You'll receive detailed feedback shortly.",
                    command="end",
                    time_remaining=final_time,
                    current_question=current_question_num,
                )

            # Allow one final response with wrap-up context
            wrap_up_context = "\n\n[SYSTEM NOTE: We have less than 3 minutes remaining. Please acknowledge time constraints and wrap up gracefully. Allow candidate to finish their current thought.]"

            messages = _build_interview_messages(history, session.get("question", ""), user_message, wrap_up_context)
            reply = llm.chat(messages)

            timestamp = int(datetime.utcnow().timestamp())
            sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp)
            sessions.add_message(current_user.id, session_id, "interviewer", reply, timestamp)

            return InteractResponse(
                response=reply,
                command="wrap_up",
                time_remaining=time_remaining,
                current_question=current_question_num,
            )

        # Handle intro phase - after candidate introduction, present Q1
        if phase == "intro":
            # Add candidate's intro to history
            timestamp = int(datetime.utcnow().timestamp())
            sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp)

            # Transition to Q1
            q1_text = sessions.transition_to_q1(session_id)

            intro_response = "Thanks for sharing! Check out the question on the left — let me know if anything is unclear."

            sessions.add_message(current_user.id, session_id, "interviewer", intro_response, timestamp)

            return InteractResponse(
                response=intro_response,
                command="continue",
                time_remaining=time_remaining,
                current_question=1,
                question_text=q1_text,
            )

        # Handle Q1 timeout (now only 1 question)
        if time_status == "q1_timeout" and phase == "q1":
            sessions.end_interview(session_id)
            final_time = sessions.get_time_remaining(session_id)
            return InteractResponse(
                response="We've reached the time limit for this question. Thank you for your efforts today! You'll receive a summary of your performance shortly.",
                command="end",
                time_remaining=final_time,
                current_question=1,
            )

        # Normal interview flow
        messages = _build_interview_messages(history, session.get("question", ""), user_message)
        reply = llm.chat(messages)

        # Check if AI detected question completion
        question_complete = "[QUESTION_COMPLETE]" in reply
        if question_complete:
            reply = reply.replace("[QUESTION_COMPLETE]", "").strip()

        # Add messages to history
        timestamp = int(datetime.utcnow().timestamp())
        sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp)
        sessions.add_message(current_user.id, session_id, "interviewer", reply, timestamp)

        # Handle interview end after the single question
        if question_complete:
            sessions.end_interview(session_id)
            # Get time_remaining AFTER ending to get total_time_taken
            final_time = sessions.get_time_remaining(session_id)
            return InteractResponse(
                response=reply + "\n\nExcellent! You've completed the technical questions. Great effort! You'll receive a detailed evaluation shortly.",
                command="end",
                time_remaining=final_time,
                current_question=1,
            )

        return InteractResponse(
            response=reply,
            command="continue",
            time_remaining=time_remaining,
            current_question=current_question_num,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in interact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _build_interview_messages(history: list, question: str, user_message: str, extra_context: str = "") -> list:
    """Build the message list for the LLM interview."""
    system_content = SYSTEM_PROMPT
    if question:
        system_content += f"\n\nCURRENT QUESTION:\n{question}"
    if extra_context:
        system_content += extra_context

    messages = [{"role": "system", "content": system_content}]

    for turn in history:
        role = "user" if turn["role"] == "candidate" else "assistant"
        messages.append({"role": role, "content": turn["message"]})

    messages.append({"role": "user", "content": user_message})

    return messages


@router.post("/tts")
def text_to_speech(
    payload: TTSRequest,
):
    try:
        response = polly.synthesize_speech(
            Text=payload.text,
            OutputFormat="mp3",
            VoiceId="Kajal",
            Engine="neural",
            LanguageCode="en-IN",
        )

        audio_stream = response.get("AudioStream")

        if audio_stream is None:
            raise HTTPException(status_code=500, detail="No audio stream returned")

        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg"
        )

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/getInterviewSession")
def get_interview_session(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 50:
            page_size = 10

        base_query = (
            db.query(Interview)
            .filter(Interview.user_id == str(current_user.id))
        )

        total_count = base_query.count()

        if total_count == 0:
            return {
                "interviews": [],
                "total_count": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            }

        total_pages = ceil(total_count / page_size)
        offset = (page - 1) * page_size

        interviews = (
            base_query
            .order_by(Interview.updated_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        processed_interviews = []
        for i in interviews:
            meta = i.metadata_
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except json.JSONDecodeError:
                    meta = {}
            elif meta is None:
                meta = {}

            processed_interviews.append({
                "interview_id": i.id,
                "session_id": i.session_id,
                "phase": meta.get("phase", "unknown")
            })

        return {
            "interviews": processed_interviews,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }

    except Exception as e:
        logger.error(f"Error fetching paginated interview sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class EvaluateRequest(BaseModel):
    session_id: str


@router.post("/evaluate")
def evaluate_interview(payload: EvaluateRequest, current_user: User = Depends(get_current_user)):
    """Evaluate a completed interview and generate scores."""
    try:
        session_id = payload.session_id
        session = sessions.get_history(session_id)

        # Check if already evaluated (cache hit)
        if session.get("evaluation"):
            logger.info(f"Returning cached evaluation for {session_id}")
            eval_service = get_evaluation_service()
            return {
                "session_id": session_id,
                "evaluation": session["evaluation"],
                "summary": eval_service.get_score_summary(session["evaluation"])
            }

        # Check if interview has ended
        if session["phase"] not in ["ended", "wrap_up"]:
            raise HTTPException(
                status_code=400,
                detail="Interview must be completed before evaluation"
            )

        history = session["history"]
        questions = session.get("questions", [])

        # Extract question texts
        question_texts = [q[1] for q in questions] if questions else []

        # Get time spent on each question (if available)
        question_times = None
        if session.get("question_start_times"):
            start_times = session["question_start_times"]
            total_time = session.get("total_time_taken", 0)
            if start_times[0]:
                # Estimate times based on when questions started
                times = []
                for i, start in enumerate(start_times):
                    if start:
                        # Get next start time or use proportional estimate
                        next_start = start_times[i + 1] if i + 1 < len(start_times) and start_times[i + 1] else None
                        if next_start:
                            times.append(int(next_start - start))
                        else:
                            # Last question gets remaining time
                            times.append(max(0, total_time - sum(times)))
                    else:
                        times.append(0)
                question_times = times

        # Get evaluation service and evaluate
        eval_service = get_evaluation_service()
        evaluation = eval_service.evaluate_interview(
            history=history,
            questions=question_texts,
            question_times=question_times,
            terminated_reason=session.get("terminated_reason")
        )

        # Store evaluation in session and DB
        sessions.save_evaluation(session_id, evaluation)

        logger.info(f"Evaluated interview {session_id}: score={evaluation.get('overall_score')}")

        return {
            "session_id": session_id,
            "evaluation": evaluation,
            "summary": eval_service.get_score_summary(evaluation)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation/{session_id}")
def get_evaluation(session_id: str, current_user: User = Depends(get_current_user)):
    """Get the evaluation for a completed interview."""
    try:
        session = sessions.get_history(session_id)

        evaluation = session.get("evaluation")
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluation not found. Please call /evaluate first."
            )

        eval_service = get_evaluation_service()

        return {
            "session_id": session_id,
            "evaluation": evaluation,
            "summary": eval_service.get_score_summary(evaluation)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

