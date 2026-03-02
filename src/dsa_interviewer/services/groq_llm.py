import logging
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from dsa_interviewer.core.config import settings

logger = logging.getLogger(__name__)

class GroqLLM:
    def __init__(self, model: Optional[str] = None):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY missing in environment variables")

        self.api_key = settings.GROQ_API_KEY
        self.model = model or settings.LLM_MODEL
        print("MODEL:", self.model)
        self.url = "https://api.groq.com/openai/v1/chat/completions"

        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)

        logger.info(f"GroqLLM initialized with model: {self.model}")

    def generate(self, system_msg: str, user_msg: str) -> str:
        return self.chat([
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ])

    def chat(self, messages: list[dict[str, str]], temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature or settings.LLM_TEMPERATURE,
            "max_tokens": max_tokens or settings.LLM_MAX_TOKENS
        }
        print("REQUEST PAYLOAD:", payload)
        try:
            logger.debug(f"Sending request to Groq API with {len(messages)} messages")
            response = self.session.post(self.url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()["choices"][0]["message"]["content"]
            logger.debug(f"Received response from Groq API ({len(result)} chars)")
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Groq API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise

    def __del__(self):
        if hasattr(self, 'session'):
            self.session.close()
