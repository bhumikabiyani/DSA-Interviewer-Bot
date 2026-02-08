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

    def _get_metadata(self, interview: Interview) -> Dict:
        """Parse metadata from interview."""
        if interview.metadata_ is None:
            return {}
        if isinstance(interview.metadata_, str):
            return json.loads(interview.metadata_)
        return interview.metadata_

    def _save_metadata(self, interview: Interview, metadata: Dict, db) -> None:
        """Save metadata to interview."""
        interview.metadata_ = metadata
        db.add(interview)

    def create_session(self, user_id: str) -> str:
        """Create a new interview session in the DB."""
        session_id = str(uuid.uuid4())
        db = SessionLocal()
        try:
            metadata = {
                "time_spent": 0,
                "phase": "intro",
                "current_question_index": 0,
                "questions": [],
                "question_start_times": [None, None],
                "question_scores": [None, None],
                "interview_start_time": None,
                "wrap_up_started": False,
                "final_response_allowed": True,
                "candidate_info": None,
            }
            interview = Interview(
                session_id=session_id,
                user_id=user_id,
                interview_data=[],
                metadata_=metadata
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

    def start_interview(self, session_id: str, questions: List[Tuple[str, str]]) -> None:
        """Start the technical interview with questions."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            metadata["questions"] = questions
            metadata["current_question_index"] = 0
            metadata["interview_start_time"] = time.time()
            metadata["question_start_times"] = [None, None]
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
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

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
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def get_current_question(self, session_id: str) -> Optional[Tuple[int, str]]:
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
            interview_start_time = metadata.get("interview_start_time")

            if interview_start_time is None:
                return "ok"

            elapsed = time.time() - interview_start_time
            remaining = MAX_INTERVIEW_DURATION - elapsed

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
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def get_time_remaining(self, session_id: str) -> int:
        """Get remaining interview time in seconds."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            
            # If interview has ended, return the time taken (stored when ended)
            if metadata.get("phase") == "ended":
                # Return negative of time taken to indicate it's elapsed time, not remaining
                return metadata.get("total_time_taken", 0)
            
            interview_start_time = metadata.get("interview_start_time")

            if interview_start_time is None:
                return MAX_INTERVIEW_DURATION

            elapsed = time.time() - interview_start_time
            remaining = MAX_INTERVIEW_DURATION - elapsed
            return max(0, int(remaining))
        finally:
            db.close()

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
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def end_interview(self, session_id: str) -> None:
        """Mark interview as ended and save total time taken."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if not interview:
                raise KeyError(f"Session {session_id} not found")

            metadata = self._get_metadata(interview)
            
            # Calculate total time taken before ending
            interview_start_time = metadata.get("interview_start_time")
            if interview_start_time:
                total_time_taken = int(time.time() - interview_start_time)
            else:
                total_time_taken = 0
            
            metadata["phase"] = "ended"
            metadata["total_time_taken"] = total_time_taken
            metadata["end_time"] = time.time()
            self._save_metadata(interview, metadata, db)
            db.commit()
            logger.info(f"Session {session_id}: Interview ended after {total_time_taken}s")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

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
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def add_message(self, user_id: int, session_id: str, role: str, message: str, message_timestamp: int, time_spent: int) -> None:
        """Add a message to the interview history."""
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
            interview.interview_data = history

            # Update metadata
            metadata = self._get_metadata(interview)
            metadata["time_spent"] = time_spent
            self._save_metadata(interview, metadata, db)

            db.commit()
            logger.debug(f"Added message to session {session_id}, total: {len(history)} messages")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add message to session {session_id}: {e}")
            raise
        finally:
            db.close()

    def get_history(self, session_id: str) -> Dict:
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
                "interview_start_time": metadata.get("interview_start_time"),
                "phase": metadata.get("phase", "unknown"),
                "question": metadata.get("questions", [[None, None]])[metadata.get("current_question_index", 0)][1] if metadata.get("questions") else None,
                "history": history,
                "time_spent": metadata.get("time_spent", 0),
                "wrap_up_started": metadata.get("wrap_up_started", False),
                "final_response_allowed": metadata.get("final_response_allowed", True),
                "evaluation": interview.evaluation_summary,
                "candidate_info": metadata.get("candidate_info"),
            }
        finally:
            db.close()

    def get_session_state(self, session_id: str) -> Dict:
        """Get the session state including time info."""
        session = self.get_history(session_id)
        return {
            "phase": session["phase"],
            "current_question": session["current_question_index"] + 1,
            "time_remaining": self.get_time_remaining(session_id),
            "time_status": self.check_time_status(session_id),
            "questions_count": len(session["questions"]),
        }

    def session_exists(self, session_id: str) -> bool:
        """Check if session exists in DB."""
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            return interview is not None
        finally:
            db.close()

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

    def save_evaluation(self, session_id: str, evaluation: Dict) -> None:
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
