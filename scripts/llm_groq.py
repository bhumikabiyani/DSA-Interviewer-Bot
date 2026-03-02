# scripts/llm_groq.py
import os

import requests


class GroqLLM:
    def __init__(self, api_key=None, model="llama-3.3-70b-versatile"):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("Set GROQ_API_KEY env var")

        self.model = model
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def ask(self, system_prompt, user_prompt, max_tokens=512, temperature=0.2):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        print("REQUEST PAYLOAD:", payload)

        response = requests.post(self.base_url, json=payload, headers=headers)

        if response.status_code != 200:
            print("ERROR RESPONSE:", response.text)

        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
