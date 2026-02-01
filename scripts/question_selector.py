"""Random question selector for CLI interviews."""

import json
import glob
import random
import sys
from pathlib import Path
from typing import Optional, Tuple, List

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dsa_interviewer.core.config import settings


def load_question(file_path: Path) -> Tuple[str, str]:
    """Load a question from a JSON file.
    
    Returns:
        Tuple of (file_path_str, question_text)
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading question {file_path}: {e}")
        return str(file_path), ""

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

    return str(file_path), question_text


def pick_random_question() -> Tuple[Optional[str], Optional[str]]:
    """Pick a random question from the knowledge base."""
    questions_dir = Path(settings.KNOWLEDGE_BASE_PATH) / "questions"
    files = list(questions_dir.glob("*.json"))
    
    if not files:
        return None, None

    selected = random.choice(files)
    return load_question(selected)


def pick_two_questions() -> List[Tuple[str, str]]:
    """Pick two different random questions from the knowledge base.
    
    Returns:
        List of tuples [(path1, question_text1), (path2, question_text2)]
        If fewer than 2 questions available, returns what's available.
    """
    questions_dir = Path(settings.KNOWLEDGE_BASE_PATH) / "questions"
    files = list(questions_dir.glob("*.json"))
    
    if not files:
        return []
    
    if len(files) == 1:
        # Only one question available, return it once
        return [load_question(files[0])]
    
    # Pick 2 different questions
    selected = random.sample(files, min(2, len(files)))
    return [load_question(f) for f in selected]


def pick_questions_by_difficulty(difficulty: str = "medium", count: int = 2) -> List[Tuple[str, str]]:
    """Pick questions filtered by difficulty level.
    
    Args:
        difficulty: One of 'easy', 'medium', 'hard'
        count: Number of questions to pick
        
    Returns:
        List of tuples [(path, question_text), ...]
    """
    questions_dir = Path(settings.KNOWLEDGE_BASE_PATH) / "questions"
    files = list(questions_dir.glob("*.json"))
    
    if not files:
        return []
    
    # Filter by difficulty if metadata available
    filtered_files = []
    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                file_difficulty = data.get("metadata", {}).get("difficulty", "medium")
                if file_difficulty.lower() == difficulty.lower():
                    filtered_files.append(file_path)
        except Exception:
            continue
    
    # Fall back to all files if no matches
    if not filtered_files:
        filtered_files = files
    
    selected = random.sample(filtered_files, min(count, len(filtered_files)))
    return [load_question(f) for f in selected]