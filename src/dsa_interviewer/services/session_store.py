import uuid
import logging
import json
import time
from typing import Dict, List, Optional, Tuple

from sqlalchemy.exc import IntegrityError

from dsa_interviewer.core.config import settings
from dsa_interviewer.core.database import SessionLocal
from dsa_interviewer.models.interview import Interview

logger = logging.getLogger(__name__)

# Interview time constants (in seconds)
MAX_INTERVIEW_DURATION = 3000  # 50 minutes
WRAP_UP_THRESHOLD = 2820  # 47 minutes - start wrap up
MAX_Q1_DURATION = 1500  # 25 minutes max for Q1


class SessionStore:
    """In-memory session store with optional DB persistence to the `interviews` table.

    Behavior:
    - On session creation we create an Interview row using session_id as `user_id`.
    - On every add_message we update the Interview.interview_data column with
      the serialized conversation history.
    - Supports multi-question interviews with time tracking and phase management.
    """

    def __init__(self):
        self.sessions: Dict[str, Dict] = {}

    def create_background_session(self, user_id: str) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            # Question management
            "questions": [],  # List of (path, question_text) tuples
            "current_question_index": 0,  # 0 = Q1, 1 = Q2
            "question_start_times": [None, None],  # When each question started
            "question_scores": [None, None],  # Scores for each question
            
            # Time management
            "interview_start_time": None,  # When technical interview started
            "max_duration_seconds": MAX_INTERVIEW_DURATION,
            "wrap_up_threshold_seconds": WRAP_UP_THRESHOLD,
            
            # Phase: background -> q1 -> q2 -> wrap_up -> ended
            "phase": "background",
            
            # Legacy fields for compatibility
            "question": None,
            "history": [],
            "background_summary": None,
            "time_spent": 0,
            
            # Wrap-up tracking
            "wrap_up_started": False,
            "final_response_allowed": True,  # Allow one final response in wrap-up
        }

        # Persist Interview row for background session as well
        db = SessionLocal()
        try:
            metadata = {
                "time_spent": 0,
                "phase": "background",
                "current_question_index": 0,
            }
            interview = Interview(
                session_id=session_id, 
                user_id=user_id, 
                interview_data=[],  # Pass list directly
                metadata_=metadata  # Pass dict directly
            )
            db.add(interview)
            db.commit()
            logger.info(f"Created background session {session_id} and persisted Interview id={interview.id}")
        except IntegrityError:
            db.rollback()
            logger.warning(f"Interview row for background session {session_id} already exists")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create Interview row for background session {session_id}: {e}")
        finally:
            db.close()

        return session_id

    def start_interview(self, session_id: str, questions: List[Tuple[str, str]]) -> None:
        """Transition from background to technical interview with 2 questions."""
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")

        session = self.sessions[session_id]
        session["questions"] = questions
        session["current_question_index"] = 0
        session["interview_start_time"] = time.time()
        session["question_start_times"][0] = time.time()
        session["phase"] = "intro"  # Start with intro phase, will transition to q1 after intro
        session["question"] = questions[0][1] if questions else None
        
        logger.info(f"Started interview for session {session_id} with {len(questions)} questions")

    def set_candidate_info(self, session_id: str, info: dict) -> None:
        """Store candidate info from pre-interview form."""
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")

        self.sessions[session_id]["candidate_info"] = info
        logger.info(f"Stored candidate info for session {session_id}")

    def get_candidate_info(self, session_id: str) -> Optional[dict]:
        """Get candidate info from session."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        return self.sessions[session_id].get("candidate_info")

    def transition_to_q1(self, session_id: str) -> str:
        """Transition from intro phase to Q1. Returns Q1 text."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        session["phase"] = "q1"
        session["question_start_times"][0] = time.time()
        
        if session["questions"]:
            return session["questions"][0][1]
        return ""

    def transition_to_interview(self, session_id: str, question: str) -> None:
        """Legacy method for compatibility - transitions to Q1."""
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")

        self.sessions[session_id]["question"] = question
        self.sessions[session_id]["phase"] = "q1"
        self.sessions[session_id]["interview_start_time"] = time.time()
        self.sessions[session_id]["question_start_times"][0] = time.time()
        logger.info(f"Transitioned session {session_id} to interview phase (Q1)")

    def transition_to_next_question(self, session_id: str) -> Optional[str]:
        """Move from Q1 to Q2. Returns Q2 text or None if no more questions."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")

        session = self.sessions[session_id]
        
        if session["current_question_index"] >= len(session["questions"]) - 1:
            # No more questions
            logger.info(f"Session {session_id}: No more questions, moving to wrap-up")
            session["phase"] = "wrap_up"
            session["wrap_up_started"] = True
            return None
        
        # Move to Q2
        session["current_question_index"] = 1
        session["question_start_times"][1] = time.time()
        session["phase"] = "q2"
        session["question"] = session["questions"][1][1] if len(session["questions"]) > 1 else None
        
        logger.info(f"Session {session_id}: Transitioned to Q2")
        return session["question"]

    def get_current_question(self, session_id: str) -> Optional[Tuple[int, str]]:
        """Get current question index (1-based) and text."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        idx = session["current_question_index"]
        
        if idx < len(session["questions"]):
            return (idx + 1, session["questions"][idx][1])
        return None

    def check_time_status(self, session_id: str) -> str:
        """Check interview time status.
        
        Returns:
            - 'ok': Interview can continue normally
            - 'q1_timeout': Q1 has exceeded max time, should transition to Q2
            - 'wrap_up': Interview should start wrapping up (< 3 min left)
            - 'force_end': Interview must end immediately
        """
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        if session["interview_start_time"] is None:
            return "ok"  # Interview hasn't started yet
        
        elapsed = time.time() - session["interview_start_time"]
        remaining = session["max_duration_seconds"] - elapsed
        
        if remaining <= 0:
            return "force_end"
        
        if remaining <= 180:  # < 3 minutes
            if not session["wrap_up_started"]:
                session["wrap_up_started"] = True
                session["phase"] = "wrap_up"
            return "wrap_up"
        
        # Check Q1 timeout
        if session["phase"] == "q1" and session["question_start_times"][0]:
            q1_elapsed = time.time() - session["question_start_times"][0]
            if q1_elapsed >= MAX_Q1_DURATION:
                return "q1_timeout"
        
        return "ok"

    def get_time_remaining(self, session_id: str) -> int:
        """Get remaining interview time in seconds."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        if session["interview_start_time"] is None:
            return session["max_duration_seconds"]
        
        elapsed = time.time() - session["interview_start_time"]
        remaining = session["max_duration_seconds"] - elapsed
        return max(0, int(remaining))

    def use_final_response(self, session_id: str) -> bool:
        """Mark that the final response has been used during wrap-up.
        
        Returns True if final response was available and is now used.
        Returns False if already used.
        """
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        if session["final_response_allowed"]:
            session["final_response_allowed"] = False
            return True
        return False

    def end_interview(self, session_id: str) -> None:
        """Mark interview as ended."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        self.sessions[session_id]["phase"] = "ended"
        logger.info(f"Session {session_id}: Interview ended")

    def set_question_score(self, session_id: str, question_index: int, score: dict) -> None:
        """Set the score for a specific question."""
        if session_id not in self.sessions:
            raise KeyError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        if 0 <= question_index < len(session["question_scores"]):
            session["question_scores"][question_index] = score
            logger.info(f"Session {session_id}: Set score for Q{question_index + 1}")

    def add_message(self, user_id: int, session_id: str, role: str, message: str, message_timestamp: int, time_spent: int) -> None:
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")

        self.sessions[session_id]["history"].append({
            "role": role,
            "message": message,
            "timestamp": message_timestamp,
        })

        history = self.sessions[session_id]["history"]
        # Trim history to the last N turns (N from settings, multiplied by 2 since each turn has two entries)
        if len(history) > settings.MAX_CONVERSATION_HISTORY * 2:
            self.sessions[session_id]["history"] = history[-(settings.MAX_CONVERSATION_HISTORY * 2) :]
            logger.debug(f"Trimmed history for session {session_id}")

        # Persist updated history to Interview.interview_data
        self._persist_session(session_id, time_spent)

    def _persist_session(self, session_id: str, time_spent: int) -> None:
        """Persist session state to database."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            session = self.sessions[session_id]
            
            if interview:
                interview.interview_data = json.dumps(session["history"])
                metadata = json.loads(interview.metadata_ or "{}")
                metadata["time_spent"] = time_spent
                metadata["phase"] = session["phase"]
                metadata["current_question_index"] = session["current_question_index"]
                metadata["question_scores"] = session["question_scores"]
                interview.metadata_ = json.dumps(metadata)
                db.add(interview)
                db.commit()
                logger.debug(f"Updated Interview (session_id={session_id}) with {len(session['history'])} messages")
            else:
                # If not found, create a new Interview row (defensive)
                metadata = {
                    "time_spent": time_spent,
                    "phase": session["phase"],
                    "current_question_index": session["current_question_index"],
                }
                interview = Interview(
                    user_id=session_id, 
                    session_id=session_id, 
                    interview_data=session["history"],  # Pass list directly
                    metadata_=metadata  # Pass dict directly
                )
                db.add(interview)
                db.commit()
                logger.info(f"Created Interview row for session {session_id} during persist")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to persist interview data for session {session_id}: {e}")
        finally:
            db.close()

    def get_history(self, session_id: str) -> Dict:
        if session_id not in self.sessions:
            db = SessionLocal()
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if interview:
                # Handle metadata (dict or str)
                meta_raw = interview.metadata_ or {}
                metadata = json.loads(meta_raw) if isinstance(meta_raw, str) else meta_raw
                self.sessions[session_id] = {
                    "questions": [],
                    "current_question_index": metadata.get("current_question_index", 0),
                    "question_start_times": [None, None],
                    "question_scores": metadata.get("question_scores", [None, None]),
                    "interview_start_time": None,
                    "max_duration_seconds": MAX_INTERVIEW_DURATION,
                    "wrap_up_threshold_seconds": WRAP_UP_THRESHOLD,
                    "phase": metadata.get("phase", "unknown"),
                    "question": None,
                    "history": json.loads(interview.interview_data) if isinstance(interview.interview_data, str) else interview.interview_data,
                    "background_summary": None,
                    "time_spent": metadata.get("time_spent", 0),
                    "wrap_up_started": False,
                    "final_response_allowed": True,
                    "evaluation": interview.evaluation_summary,
                }
                logger.info(f"Loaded session {session_id} from DB")
            else:
                logger.error(f"Session {session_id} not found")
                raise KeyError(f"Session {session_id} not found")
            db.close()
        return self.sessions[session_id]

    def get_session_state(self, session_id: str) -> Dict:
        """Get the full session state including time info."""
        session = self.get_history(session_id)
        return {
            "phase": session["phase"],
            "current_question": session["current_question_index"] + 1,
            "time_remaining": self.get_time_remaining(session_id),
            "time_status": self.check_time_status(session_id),
            "questions_count": len(session["questions"]),
        }

    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions

    def delete_session(self, session_id: str) -> None:
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Deleted session {session_id}")

    def save_evaluation(self, session_id: str, evaluation: Dict) -> None:
        """Save evaluation result to session and DB."""
        if session_id in self.sessions:
            self.sessions[session_id]["evaluation"] = evaluation
        
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if interview:
                interview.evaluation_summary = evaluation
                db.commit()
                logger.info(f"Saved evaluation for session {session_id} to DB")
            else:
                logger.warning(f"Session {session_id} not found in DB for saving evaluation")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save evaluation for session {session_id}: {e}")
        finally:
            db.close()

