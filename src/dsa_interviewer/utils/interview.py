from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from dsa_interviewer.models.question_bank import QuestionBank


def pick_random_question(db: Session, difficulty: Optional[int] = None, topic_tags: Optional[list[str]] = None, type: Optional[str] = None):
    """
    Finds a random question from the database based on difficulty, topic_tags (list), and type.
    topic_tag in DB is a comma-separated string.
    """
    query = db.query(QuestionBank)

    if difficulty is not None:
        query = query.filter(QuestionBank.difficulty == difficulty)

    if topic_tags:
        filters = [QuestionBank.topic_tag.ilike(f"%{tag}%") for tag in topic_tags]
        query = query.filter(or_(*filters))

    if type:
        query = query.filter(QuestionBank.type == type)

    question = query.order_by(func.random()).first()

    if not question:
        return None

    return {
        "id": question.question_id,
        "title": question.title,
        "difficulty": question.difficulty,
        "topic_tag": question.topic_tag,
        "type": question.type,
        "company_tag": question.company_tag,
        "question_url": question.question_url
    }
