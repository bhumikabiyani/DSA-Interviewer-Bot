# scripts/interview_cli.py
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.question_selector import pick_random_question
from scripts.llm_groq import GroqLLM
from scripts.retriever import RagRetriever
from prompts import SYSTEM_PROMPT, build_prompt

import os

def main():
    groq = GroqLLM()
    retriever = RagRetriever()

    print("=== Mock DSA Interview CLI (Groq + RAG) ===")
    print("Type 'exit' to quit.\n")

    q_path, q_text = pick_random_question()
    if q_path:
        print("\n=== INTERVIEW QUESTION ===")
        print(q_text)
        print("==========================\n")
    else:
        print("WARNING: No questions found in rag_data/questions/")

    while True:
        user_input = input("Candidate: ")
        if user_input.lower().strip() in ("exit", "quit"):
            break

        # retrieve relevant context from vector DB
        query = q_text + "\n\n" + user_input
        chunks = retriever.retrieve(query, n_results=5)
        if not chunks:
            print("No context found. Proceeding without RAG.")
            prompt = build_prompt(user_input, [])
        else:
            prompt = build_prompt(user_input, chunks, q_text)

        reply = groq.ask(SYSTEM_PROMPT, prompt)
        print("\nInterviewer:", reply)
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()
