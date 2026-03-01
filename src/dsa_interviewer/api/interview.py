from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from dsa_interviewer.dependencies import get_current_user
from dsa_interviewer.core.database import get_db
from dsa_interviewer.models.user import User
from dsa_interviewer.models.interview import Interview
from pydantic import BaseModel
from typing import Optional, List
import logging
import boto3
import json

from dsa_interviewer.services.groq_llm import GroqLLM
from dsa_interviewer.services.session_store import SessionStore
from dsa_interviewer.services.evaluation import get_evaluation_service
from dsa_interviewer.utils.interview import pick_random_question
from math import ceil
from dsa_interviewer.core.config import settings


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

- If the candidate directly rushes to code without discussion, pause them and ask them not to rush explain the approach first optimize it and in the end we will code.
- Never output the entire question again.
- Ask exactly ONE follow-up question per message.
- Use retrieved context only to enhance your hint quality, not to restate information.
- Maintain continuity and remember important points candidate said earlier.
- If candidate's answer is weak, push gently: "Can you reason about X?"
- If candidate's answer is strong, deepen the discussion: "Nice. Now what about Y?"

INTERVIEW FLOW:
1. When the interview starts, you'll see the candidate's background info (student/professional, org, expectations).
2. Begin by acknowledging their background and asking for a brief verbal introduction.
3. After their introduction, present the DSA Question.
4. For each question, follow this sequence:
   - Problem understanding
   - Approach discussion  
   - Code (if they provide it)
   - Time/Space complexity analysis (REQUIRED before marking complete)
   - Edge cases discussion
5. Only mark [QUESTION_COMPLETE] AFTER they discuss complexity and you are ready to wrap up.

QUESTION COMPLETION DETECTION:
A question is COMPLETE ONLY when ALL of these are satisfied:
1. The candidate provides working or near-working code OR a correct verbal approach
2. The candidate has discussed time AND space complexity
3. You have asked about edge cases

CRITICAL RULES FOR marking [QUESTION_COMPLETE]:
- NEVER include [QUESTION_COMPLETE] if you are asking the candidate a question (e.g. "What is the time complexity?", "Can you explain edge cases?").
- NEVER include [QUESTION_COMPLETE] in the same response where you ask for complexity or optimizations.
- ONLY include [QUESTION_COMPLETE] when the candidate has *answered* your complexity/edge-case questions and you are ready to move on.
- If you are saying "Now let's discuss complexity", you must NOT mark completion yet. Wait for their answer.

When you detect completion (and are NOT asking a new question), include the special marker [QUESTION_COMPLETE] at the END of your response.

WRAP-UP MODE:
When told we're in wrap-up mode (less than 3 minutes remaining):
- Acknowledge the time constraint gracefully
- Allow the candidate to finish their current thought
- Provide a brief summary of how they did
- Do NOT start any new questions or deep discussions

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

class UserMessage(BaseModel):
    session_id: str
    message: str

class TTSRequest(BaseModel):
    text: str

class CandidateInfo(BaseModel):
    type: str  # 'student' or 'professional'
    currentRole: str  # Degree for student, Position for professional
    organization: str  # University for student, Company for professional
    expectations: str = ""
    difficulty: str

class StartInterviewWithFormRequest(BaseModel):
    candidate_info: CandidateInfo

class StartInterviewRequest(BaseModel):
    session_id: str

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


@router.post("/start_interview_with_form")
def start_interview_with_form(payload: StartInterviewWithFormRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Start an interview directly with candidate info from form (no background chat)."""
    try:
        candidate = payload.candidate_info
        
        # Create a new session
        session_id = sessions.create_background_session(current_user.id)
        
        # Store candidate metadata in session
        sessions.set_candidate_info(session_id, {
            "type": candidate.type,
            "current_role": candidate.currentRole,
            "organization": candidate.organization,
            "expectations": candidate.expectations,
            "difficulty": candidate.difficulty,
        })
        
        # Pick 1 question for this interview from DB
        q_data = pick_random_question(db)
        
        if not q_data:
            raise HTTPException(status_code=500, detail="No questions available in database")
        
        # Elaborate the question using Groq
        elaboration_input = ELABORATION_PROMPT.format(
            title=q_data['title'],
            difficulty=q_data['difficulty'],
            topic_tag=q_data['topic_tag']
        )
        elaborated_text = llm.chat([{"role": "user", "content": elaboration_input}])
        
        questions = [(str(q_data['id']), elaborated_text)]
        
        # Start the interview with the selected question
        sessions.start_interview(session_id, questions)
        
        # Create personalized intro message
        role_desc = f"{candidate.currentRole} at {candidate.organization}"
        if candidate.type == "student":
            greeting = f"Welcome! I see you're a {role_desc}. Great to have you here for this DSA practice session."
        else:
            greeting = f"Welcome! I see you're working as {role_desc}. Great to have you here for this DSA practice session."
        
        if candidate.expectations:
            greeting += f"\n\nI understand you're looking to: {candidate.expectations}"
        
        intro_msg = f"""{greeting}

We'll go through 1 DSA question today, with about 50 minutes total. I'll guide you through the problem, so take your time to think.

Before we start, please give me a brief verbal introduction about yourself - your background, experience with DSA, and anything else you'd like to share."""
        
        timestamp = int(datetime.utcnow().timestamp())
        sessions.add_message(current_user.id, session_id, "interviewer", intro_msg, timestamp, 0)
        
        # Get Q1 ready but don't send yet
        current_q = sessions.get_current_question(session_id)
        time_remaining = sessions.get_time_remaining(session_id)
        
        logger.info(f"Started interview with form for session {session_id}")
        
        return {
            "session_id": session_id,
            "intro_message": intro_msg,
            "current_question": 1,
            "total_questions": len(questions),
            "time_remaining": time_remaining,
            "phase": "intro",  # New phase: waiting for intro
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview with form: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume_interview/{session_id}")
def resume_interview(session_id: str, current_user: User = Depends(get_current_user)):
# def resume_interview(session_id: str):
    try:
        interview = sessions.get_history(session_id)
        state = sessions.get_session_state(session_id)
        return {
            "history": interview["history"], 
            "time_spent": interview["time_spent"],
            "phase": state["phase"],
            "current_question": state["current_question"],
            "time_remaining": state["time_remaining"],
            "evaluation": interview.get("evaluation") if state["phase"] == "ended" else None,
        }
    except Exception as e:
        logger.error(f"Error resuming interview for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start_interview")
def start_interview(payload: StartInterviewRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Start the technical interview with 2 questions."""
    try:
        session_id = payload.session_id
        
        # Pick 1 question for this interview from DB
        q_data = pick_random_question(db)
        
        if not q_data:
            raise HTTPException(status_code=500, detail="No questions available in database")
        
        # Elaborate the question using Groq
        elaboration_input = ELABORATION_PROMPT.format(
            title=q_data['title'],
            difficulty=q_data['difficulty'],
            topic_tag=q_data['topic_tag']
        )
        elaborated_text = llm.chat([{"role": "user", "content": elaboration_input}])
        
        questions = [(str(q_data['id']), elaborated_text)]
        
        # Start the interview with the selected question
        sessions.start_interview(session_id, questions)
        
        # Get the first question
        current_q = sessions.get_current_question(session_id)
        if not current_q:
            raise HTTPException(status_code=500, detail="Failed to get question")
        
        q_num, q_text = current_q
        
        # Create introduction message
        intro = f"""Great! Let's begin the technical portion of the interview.

We have about 50 minutes, so take your time to think through the problem.

Here's your question:

{q_text}

Please start by explaining your understanding of the problem. What are the key constraints and edge cases you're thinking about?"""

        # Add the intro message to history
        timestamp = int(datetime.utcnow().timestamp())
        sessions.add_message(current_user.id, session_id, "interviewer", intro, timestamp, 0)
        
        time_remaining = sessions.get_time_remaining(session_id)
        
        logger.info(f"Started interview for session {session_id} with 1 question")
        
        return {
            "intro": intro,
            "current_question": 1,
            "total_questions": 1,
            "time_remaining": time_remaining,
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
            sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp, 0)
            sessions.add_message(current_user.id, session_id, "interviewer", reply, timestamp, 0)
            
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
            sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp, 0)
            
            # Transition to Q1
            q1_text = sessions.transition_to_q1(session_id)
            
            intro_response = f"""Thank you for sharing that! It's great to learn more about your background.

Now let's get started with the technical questions. Here's your first question!

Please review the problem statement carefully. Let me know if anything is unclear or if you have any doubts!

Please start by explaining your understanding of the problem. What are the key constraints and edge cases you're thinking about?"""
            
            sessions.add_message(current_user.id, session_id, "interviewer", intro_response+"\n\n"+q1_text, timestamp, 0)
            
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
        # question_complete = "[QUESTION_COMPLETE]" in reply
        question_complete = True
        if question_complete:
            reply = reply.replace("[QUESTION_COMPLETE]", "").strip()
        
        # Add messages to history
        timestamp = int(datetime.utcnow().timestamp())
        sessions.add_message(current_user.id, session_id, "candidate", user_message, timestamp, 0)
        sessions.add_message(current_user.id, session_id, "interviewer", reply, timestamp, 0)
        
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
            interview_start = session.get("interview_start_time")
            if interview_start and start_times[0]:
                # Estimate times based on when questions started
                import time
                current = time.time()
                times = []
                for i, start in enumerate(start_times):
                    if start:
                        # Get next start time or current time
                        next_start = start_times[i + 1] if i + 1 < len(start_times) and start_times[i + 1] else current
                        times.append(int(next_start - start))
                    else:
                        times.append(0)
                question_times = times
        
        # Get evaluation service and evaluate
        eval_service = get_evaluation_service()
        evaluation = eval_service.evaluate_interview(
            history=history,
            questions=question_texts,
            question_times=question_times
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

