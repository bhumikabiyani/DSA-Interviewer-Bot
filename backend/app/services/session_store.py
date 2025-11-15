import uuid

class SessionStore:
    def __init__(self):
        self.sessions = {}  # session_id → chat history + question

    def create_session(self, question):
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "question": question,
            "history": []
        }
        return session_id

    def add_message(self, session_id, sender, text):
        self.sessions[session_id]["history"].append({
            "sender": sender,
            "text": text
        })

    def get_history(self, session_id):
        return self.sessions[session_id]
