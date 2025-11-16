#!/usr/bin/env python3
"""Command-line interface for DSA mock interviews."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dsa_interviewer.services.groq_llm import GroqLLM
from dsa_interviewer.services.rag_service import RagService
from question_selector import pick_random_question
from prompts import SYSTEM_PROMPT, build_prompt


def main():
    print("=== DSA Mock Interview CLI ===")
    print("Type 'exit' or 'quit' to end the interview.\n")

    try:
        llm = GroqLLM()
        rag = RagService()
    except Exception as e:
        print(f"Error initializing services: {e}")
        return 1

    q_path, q_text = pick_random_question()
    if not q_path:
        print("WARNING: No questions found in data/knowledge_base/questions/")
        return 1

    print("\n=== INTERVIEW QUESTION ===")
    print(q_text)
    print("==========================\n")

    conversation_history = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    while True:
        try:
            user_input = input("Candidate: ").strip()
            if user_input.lower() in ("exit", "quit"):
                print("\nInterview ended. Good luck!")
                break

            if not user_input:
                continue

            query = f"{q_text}\n\n{user_input}"
            chunks = rag.retrieve(query, n=5)
            
            prompt = build_prompt(user_input, chunks, q_text)
            conversation_history.append({"role": "user", "content": prompt})

            reply = llm.chat(conversation_history)
            conversation_history.append({"role": "assistant", "content": reply})

            print(f"\nInterviewer: {reply}")
            print("\n" + "="*50 + "\n")

        except KeyboardInterrupt:
            print("\n\nInterview interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}")
            continue

    return 0


if __name__ == "__main__":
    sys.exit(main())