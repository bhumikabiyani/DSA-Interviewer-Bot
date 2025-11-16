import uuid
import logging
from typing import Dict, List, Optional

from dsa_interviewer.core.config import settings

logger = logging.getLogger(__name__)

class SessionStore:
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}

    def create_session(self, question: str) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "question": question,
            "history": []
        }
        logger.info(f"Created session {session_id}")
        return session_id

    def add_message(self, session_id: str, role: str, message: str) -> None:
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")
        
        self.sessions[session_id]["history"].append({
            "role": role,
            "message": message
        })
        
        history = self.sessions[session_id]["history"]
        if len(history) > settings.MAX_CONVERSATION_HISTORY * 2:
            self.sessions[session_id]["history"] = history[-(settings.MAX_CONVERSATION_HISTORY * 2):]
            logger.debug(f"Trimmed history for session {session_id}")

    def get_history(self, session_id: str) -> Dict:
        if session_id not in self.sessions:
            logger.error(f"Session {session_id} not found")
            raise KeyError(f"Session {session_id} not found")
        return self.sessions[session_id]
    
    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions
    
    def delete_session(self, session_id: str) -> None:
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Deleted session {session_id}")
