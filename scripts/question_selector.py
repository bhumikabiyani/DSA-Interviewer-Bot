import json
import glob
import random

def pick_random_question():
    files = glob.glob("rag_data/questions/*.json")  # load JSON files
    if not files:
        return None, None

    selected = random.choice(files)
    with open(selected, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Extract question text nicely
    title = data["content"].get("title", "")
    description = data["content"].get("description", "")
    constraints = data["content"].get("constraints", [])
    examples = data["content"].get("examples", [])
    hints = data["content"].get("hints", [])

    # build readable question text
    question_text = f"# {title}\n\n{description}\n\n"

    if constraints:
        question_text += "### Constraints:\n"
        for c in constraints:
            question_text += f"- {c}\n"
        question_text += "\n"

    if examples:
        question_text += "### Examples:\n"
        for ex in examples:
            question_text += f"- Input: {ex['input']}\n  Output: {ex['output']}\n  Explanation: {ex['explanation']}\n\n"

    if hints:
        question_text += "### Hints:\n"
        for h in hints:
            question_text += f"- {h}\n"
        question_text += "\n"

    return selected, question_text
