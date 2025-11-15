import requests
from app.config import settings

class GroqLLM:
    def __init__(self, model="llama-3.3-70b-versatile"):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY missing in .env")
        self.api_key = settings.GROQ_API_KEY
        self.model = model
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def generate(self, system_msg, user_msg):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ]
        }

        response = requests.post(self.url, headers=headers, json=payload)

        if response.status_code != 200:
            print("Groq error:", response.text)
            response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"]
