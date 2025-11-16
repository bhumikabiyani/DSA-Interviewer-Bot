"""Random question selector for CLI interviews."""

import json
import glob
import random
import sys
from pathlib import Path
from typing import Optional, Tuple

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dsa_interviewer.core.config import settings


def pick_random_question() -> Tuple[Optional[str], Optional[str]]:
    """Pick a random question from the knowledge base."""
    questions_dir = Path(settings.KNOWLEDGE_BASE_PATH) / "questions"
    files = list(questions_dir.glob("*.json"))
    
    if not files:
        return None, None

    selected = random.choice(files)
    
    try:
        with open(selected, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading question {selected}: {e}")
        return None, None

    content = data.get("content", {})
    title = content.get("title", "Untitled Problem")
    description = content.get("description", "")
    constraints = content.get("constraints", [])
    examples = content.get("examples", [])
    hints = content.get("hints", [])

    question_text = f"# {title}\n\n{description}\n\n"

    if constraints:
        question_text += "### Constraints:\n"
        for c in constraints:
            question_text += f"- {c}\n"
        question_text += "\n"

    if examples:
        question_text += "### Examples:\n"
        for ex in examples:
            inp = ex.get("input", "")
            out = ex.get("output", "")
            exp = ex.get("explanation", "")
            question_text += f"- Input: {inp}\n  Output: {out}\n  Explanation: {exp}\n\n"

    if hints:
        question_text += "### Hints:\n"
        for h in hints:
            question_text += f"- {h}\n"
        question_text += "\n"

    return str(selected), question_text