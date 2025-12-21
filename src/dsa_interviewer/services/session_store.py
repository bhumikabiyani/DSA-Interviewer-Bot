import uuid
import logging
import json
from typing import Dict

from sqlalchemy.exc import IntegrityError

from dsa_interviewer.core.config import settings
from dsa_interviewer.core.database import SessionLocal
from dsa_interviewer.models.interview import Interview

logger = logging.getLogger(__name__)


class SessionStore:
    """In-memory session store with optional DB persistence to the `interviews` table.

    Behavior:
    - On session creation we create an Interview row using session_id as `user_id`.
    - On every add_message we update the Interview.interview_data column with
      the serialized conversation history.
    """

    def __init__(self):
        self.sessions: Dict[str, Dict] = {}

    def create_background_session(self, user_id: str) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "question": None,
            "history": [],
            "phase": "background",
            "background_summary": None,
            "time_spent": 0,
        }

        # Persist Interview row for background session as well
        db = SessionLocal()
        try:
            interview = Interview(session_id=session_id, user_id=user_id, interview_data=json.dumps([]), metadata=json.dumps({"time_spent": 0}))
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

    def transition_to_interview(self, session_id: str, question: str) -> None:
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")

        self.sessions[session_id]["question"] = question
        self.sessions[session_id]["phase"] = "introduction"
        logger.info(f"Transitioned session {session_id} to interview phase")

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
        db = SessionLocal()
        try:
            interview = db.query(Interview).filter(Interview.session_id == session_id).one_or_none()
            if interview:
                interview.interview_data = json.dumps(self.sessions[session_id]["history"])
                metadata = json.loads(interview.metadata_ or "{}")
                metadata["time_spent"] = time_spent
                interview.metadata_ = json.dumps(metadata)
                db.add(interview)
                db.commit()
                logger.debug(f"Updated Interview (user_id={session_id}) interview_data with {len(self.sessions[session_id]['history'])} messages")
            else:
                # If not found, create a new Interview row (defensive)
                interview = Interview(user_id=user_id, session_id=session_id, interview_data=json.dumps(self.sessions[session_id]["history"]), metadata=json.dumps({"time_spent": time_spent}))
                db.add(interview)
                db.commit()
                logger.info(f"Created Interview row for session {session_id} during add_message")
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
                self.sessions[session_id] = {
                    "question": None,
                    "history": json.loads(interview.interview_data),
                    "phase": "unknown",
                    "background_summary": None,
                    "time_spent": json.loads(interview.metadata_ or "{}").get("time_spent", 0),
                }
                logger.info(f"Loaded session {session_id} from DB")
            else:
                logger.error(f"Session {session_id} not found")
                raise KeyError(f"Session {session_id} not found")
            db.close()
        return self.sessions[session_id]

    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions

    def delete_session(self, session_id: str) -> None:
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Deleted session {session_id}")
