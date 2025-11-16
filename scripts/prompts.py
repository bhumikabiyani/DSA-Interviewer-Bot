"""Prompt templates for DSA interviewer."""

from typing import List, Union

SYSTEM_PROMPT = """
You are a professional DSA interviewer.

Rules:
- You have already asked the candidate a question (provided in context).
- DO NOT repeat the entire question again.
- Guide the candidate step-by-step.
- Ask one follow-up at a time.
- Never give the full solution.
- Use retrieved context as the ground truth.
- Keep responses short and interviewer-like.
"""


def build_prompt(user_message: str, retrieved_chunks: Union[List[str], List[dict]], question_text: str = "") -> str:
    """Build prompt from user message and retrieved context."""
    if isinstance(retrieved_chunks, list) and len(retrieved_chunks) > 0:
        if isinstance(retrieved_chunks[0], dict):
            context = "\n\n---\n".join([c.get('text', str(c)) for c in retrieved_chunks])
        else:
            context = "\n\n---\n".join(retrieved_chunks)
    else:
        context = ""
    
    prompt = f"""
### CANDIDATE MESSAGE:
{user_message}
"""
    
    if question_text:
        prompt = f"### QUESTION:\n{question_text}\n\n" + prompt
    
    if context:
        prompt += f"""

### CONTEXT FROM KNOWLEDGE BASE:
{context}
"""
    
    prompt += """

### INSTRUCTIONS:
Respond as an interviewer. Ask a follow-up question or give a small hint.
Do NOT give the solution.
"""
    
    return prompt

