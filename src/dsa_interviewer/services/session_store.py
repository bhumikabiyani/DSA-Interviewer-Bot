import json
import logging
import time
import uuid
from typing import Optional

from sqlalchemy.exc import IntegrityError

from dsa_interviewer.core.config import settings
from dsa_interviewer.core.database import SessionLocal, with_db_retry
from dsa_interviewer.models.interview import Interview

logger = logging.getLogger(__name__)

# Interview time constants (in seconds)
MAX_INTERVIEW_DURATION = 3000  # 50 minutes
WRAP_UP_THRESHOLD = 2820  # 47 minutes - start wrap up
MAX_Q1_DURATION = 1500  # 25 minutes max for Q1
MAX_IDLE_CAP = 300  # 5 minutes - max counted per idle gap


class SessionStore:
    """DB-only session store using the `interviews` table as single source of truth.

    All session state is stored in the database:
    - interview_data: JSON list of message history
    - metadata_: JSON object with phase, time tracking, questions, etc.
    """

    def _get_interview(self, session_id: str, db=None) -> Optional[Interview]:
        """Get interview from DB by session_id."""
        close_db = db is None
        if db is None:
            db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            return interview
        finally:
            if close_db:
                db.close()

    def _get_metadata(self, interview: Interview) -> dict:
        """Parse metadata from interview."""
        if interview.metadata_ is None:
            return {}
        if isinstance(interview.metadata_, str):
            return json.loads(interview.metadata_)
        return interview.metadata_

    def _save_metadata(self, interview: Interview, metadata: dict, db) -> None:
        """Save metadata to interview."""
        interview.metadata_ = json.dumps(metadata)
        db.add(interview)

    @with_db_retry
    def create_session(self, user_id: str) -> str:
        """Create a new interview session in the DB."""
        session_id = str(uuid.uuid4())
        db = SessionLocal()
        try:
            metadata = {
                "total_time_taken": 0,
                "last_interaction_time": None,
                "phase": "intro",
                "current_question_index": 0,
                "questions": [],
                "question_start_times": [None, None],
                "question_scores": [None, None],
                "wrap_up_started": False,
                "final_response_allowed": True,
                "candidate_info": None,
                "terminated_reason": None,
            }
            interview = Interview(
                session_id=session_id,
                user_id=user_id,
                interview_data=json.dumps([]),
                metadata_=json.dumps(metadata)
            )
            db.add(interview)
            db.commit()
            logger.info(f"Created session {session_id} for user {user_id}")
        except IntegrityError:
            db.rollback()
            logger.warning(f"Interview row for session {session_id} already exists")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create session {session_id}: {e}")
            raise
        finally:
            db.close()

        return session_id

    # Alias for backward compatibility
    def create_background_session(self, user_id: str) -> str:
        return self.create_session(user_id)

    @with_db_retry
    def start_interview(self, session_id: str, questions: list[tuple[str, str]]) -> None:
        """Start the technical interview with questions."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            metadata["questions"] = questions
            metadata["current_question_index"] = 0
            metadata["last_interaction_time"] = time.time()
            metadata["question_start_times"] = [time.time(), None]
            metadata["phase"] = "intro"

            self._save_metadata(interview, metadata, db)
            db.commit()
            logger.info(f"Started interview for session {session_id} with {len(questions)} questions")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to start interview {session_id}: {e}")
            raise
        finally:
            db.close()

    @with_db_retry
    def set_candidate_info(self, session_id: str, info: dict) -> None:
        """Store candidate info from pre-interview form."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            metadata["candidate_info"] = info
            self._save_metadata(interview, metadata, db)
            db.commit()
            logger.info(f"Stored candidate info for session {session_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to set candidate info for {session_id}: {e}")
            raise
        finally:
            db.close()

    @with_db_retry
    def get_candidate_info(self, session_id: str) -> Optional[dict]:
        """Get candidate info from session."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")
            metadata = self._get_metadata(interview)
            return metadata.get("candidate_info")
        finally:
            db.close()

    @with_db_retry
    def transition_to_q1(self, session_id: str) -> str:
        """Transition from intro phase to Q1. Returns Q1 text."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            metadata["phase"] = "q1"
            metadata["question_start_times"][0] = time.time()
            self._save_metadata(interview, metadata, db)
            db.commit()

            questions = metadata.get("questions", [])
            if questions:
                return questions[0][1]
            return ""
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def transition_to_next_question(self, session_id: str) -> Optional[str]:
        """Move from Q1 to Q2. Returns Q2 text or None if no more questions."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            questions = metadata.get("questions", [])
            current_idx = metadata.get("current_question_index", 0)

            if current_idx >= len(questions) - 1:
                # No more questions
                logger.info(f"Session {session_id}: No more questions, moving to wrap-up")
                metadata["phase"] = "wrap_up"
                metadata["wrap_up_started"] = True
                self._save_metadata(interview, metadata, db)
                db.commit()
                return None

            # Move to Q2
            metadata["current_question_index"] = 1
            question_start_times = metadata.get("question_start_times", [None, None])
            question_start_times[1] = time.time()
            metadata["question_start_times"] = question_start_times
            metadata["phase"] = "q2"
            self._save_metadata(interview, metadata, db)
            db.commit()

            logger.info(f"Session {session_id}: Transitioned to Q2")
            return questions[1][1] if len(questions) > 1 else None
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def get_current_question(self, session_id: str) -> Optional[tuple[int, str]]:
        """Get current question index (1-based) and text."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            questions = metadata.get("questions", [])
            idx = metadata.get("current_question_index", 0)

            if idx < len(questions):
                return (idx + 1, questions[idx][1])
            return None
        finally:
            db.close()

    @with_db_retry
    def check_time_status(self, session_id: str) -> str:
        """Check interview time status.

        Returns:
            - 'ok': Interview can continue normally
            - 'q1_timeout': Q1 has exceeded max time, should transition to Q2
            - 'wrap_up': Interview should start wrapping up (< 3 min left)
            - 'force_end': Interview must end immediately
        """
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            time_taken = metadata.get("total_time_taken")

            if time_taken is None:
                return "ok"

            remaining = MAX_INTERVIEW_DURATION - time_taken

            if remaining <= 0:
                return "force_end"

            if remaining <= 180:  # < 3 minutes
                if not metadata.get("wrap_up_started", False):
                    metadata["wrap_up_started"] = True
                    metadata["phase"] = "wrap_up"
                    self._save_metadata(interview, metadata, db)
                    db.commit()
                return "wrap_up"

            # Check Q1 timeout
            phase = metadata.get("phase")
            question_start_times = metadata.get("question_start_times", [None, None])
            if phase == "q1" and question_start_times[0]:
                q1_elapsed = time.time() - question_start_times[0]
                if q1_elapsed >= MAX_Q1_DURATION:
                    return "q1_timeout"

            return "ok"
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def get_time_remaining(self, session_id: str) -> int:
        """Get remaining interview time in seconds."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)

            # If interview has ended, return the total time taken
            if metadata.get("phase") == "ended":
                return metadata.get("total_time_taken", 0)

            total_time_taken = metadata.get("total_time_taken", 0)

            # If no interaction has happened yet, return full duration
            if total_time_taken == 0 and metadata.get("last_interaction_time") is None:
                return MAX_INTERVIEW_DURATION

            remaining = MAX_INTERVIEW_DURATION - total_time_taken
            return max(0, int(remaining))
        finally:
            db.close()

    @with_db_retry
    def use_final_response(self, session_id: str) -> bool:
        """Mark that the final response has been used during wrap-up."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            if metadata.get("final_response_allowed", True):
                metadata["final_response_allowed"] = False
                self._save_metadata(interview, metadata, db)
                db.commit()
                return True
            return False
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def end_interview(self, session_id: str, reason: Optional[str] = None) -> None:
        """Mark interview as ended and save total time taken.
        
        Args:
            session_id: The session ID to end.
            reason: Optional reason for ending (e.g., 'violation', 'timeout')
        """
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)

            # Do one final accumulation from last interaction
            last_time = metadata.get("last_interaction_time")
            if last_time is not None:
                delta = time.time() - last_time
                delta = min(delta, MAX_IDLE_CAP)
                metadata["total_time_taken"] = metadata.get("total_time_taken", 0) + int(delta)

            total_time_taken = metadata.get("total_time_taken", 0)

            metadata["phase"] = "ended"
            metadata["end_time"] = time.time()
            metadata["last_interaction_time"] = None  # Clear since interview is over
            
            if reason:
                metadata["terminated_reason"] = reason
                
            self._save_metadata(interview, metadata, db)
            db.commit()
            logger.info(f"Session {session_id}: Interview ended after {total_time_taken}s, reason: {reason or 'normal'}")
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def set_question_score(self, session_id: str, question_index: int, score: dict) -> None:
        """Set the score for a specific question."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            question_scores = metadata.get("question_scores", [None, None])
            if 0 <= question_index < len(question_scores):
                question_scores[question_index] = score
                metadata["question_scores"] = question_scores
                self._save_metadata(interview, metadata, db)
                db.commit()
                logger.info(f"Session {session_id}: Set score for Q{question_index + 1}")
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @with_db_retry
    def add_message(self, user_id: int, session_id: str, role: str, message: str, message_timestamp: int) -> None:
        """Add a message to the interview history and accumulate active time."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            # Parse existing history
            if interview.interview_data is None:
                history = []
            elif isinstance(interview.interview_data, str):
                history = json.loads(interview.interview_data)
            else:
                history = interview.interview_data

            # Add new message
            history.append({
                "role": role,
                "message": message,
                "timestamp": message_timestamp,
            })

            # Trim history to max size
            max_history = settings.MAX_CONVERSATION_HISTORY * 2
            if len(history) > max_history:
                history = history[-max_history:]
                logger.debug(f"Trimmed history for session {session_id}")

            # Save history
            interview.interview_data = json.dumps(history)

            # Accumulate active time between interactions
            metadata = self._get_metadata(interview)
            last_time = metadata.get("last_interaction_time")
            if last_time is not None:
                delta = time.time() - last_time
                delta = min(delta, MAX_IDLE_CAP)  # Cap idle gaps
                metadata["total_time_taken"] = metadata.get("total_time_taken", 0) + int(delta)
            metadata["last_interaction_time"] = time.time()
            self._save_metadata(interview, metadata, db)

            db.commit()
            logger.debug(f"Added message to session {session_id}, total: {len(history)} messages")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add message to session {session_id}: {e}")
            raise
        finally:
            db.close()

    @with_db_retry
    def get_history(self, session_id: str) -> dict:
        """Get session data from database."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)

            # Parse history
            if interview.interview_data is None:
                history = []
            elif isinstance(interview.interview_data, str):
                history = json.loads(interview.interview_data)
            else:
                history = interview.interview_data

            return {
                "questions": metadata.get("questions", []),
                "current_question_index": metadata.get("current_question_index", 0),
                "question_start_times": metadata.get("question_start_times", [None, None]),
                "question_scores": metadata.get("question_scores", [None, None]),
                "total_time_taken": metadata.get("total_time_taken", 0),
                "phase": metadata.get("phase", "unknown"),
                "question": metadata.get("questions", [[None, None]])[metadata.get("current_question_index", 0)][1] if metadata.get("questions") else None,
                "history": history,
                "wrap_up_started": metadata.get("wrap_up_started", False),
                "final_response_allowed": metadata.get("final_response_allowed", True),
                "evaluation": interview.evaluation_summary,
                "candidate_info": metadata.get("candidate_info"),
                "terminated_reason": metadata.get("terminated_reason"),
            }
        finally:
            db.close()

    def get_session_state(self, session_id: str) -> dict:
        """Get the session state including time info."""
        session = self.get_history(session_id)
        return {
            "phase": session["phase"],
            "current_question": session["current_question_index"] + 1,
            "time_remaining": self.get_time_remaining(session_id),
            "time_status": self.check_time_status(session_id),
            "questions_count": len(session["questions"]),
        }

    @with_db_retry
    def session_exists(self, session_id: str) -> bool:
        """Check if session exists in DB."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            return interview is not None
        finally:
            db.close()

    @with_db_retry
    def delete_session(self, session_id: str) -> None:
        """Delete session from DB."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if interview:
                db.delete(interview)
                db.commit()
                logger.info(f"Deleted session {session_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete session {session_id}: {e}")
        finally:
            db.close()

    @with_db_retry
    def save_evaluation(self, session_id: str, evaluation: dict) -> None:
        """Save evaluation result to DB."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if interview:
                interview.evaluation_summary = evaluation
                db.commit()
                logger.info(f"Saved evaluation for session {session_id}")
            else:
                logger.warning(f"Session {session_id} not found for saving evaluation")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save evaluation for session {session_id}: {e}")
        finally:
            db.close()
