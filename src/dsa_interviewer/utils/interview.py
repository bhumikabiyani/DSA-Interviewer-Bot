from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from dsa_interviewer.models.question_bank import QuestionBank

def pick_random_question(db: Session, difficulty: int, topic_tags: Optional[List[str]] = None, type: Optional[str] = None):
    """
    Finds a random question from the database based on difficulty, topic_tags (list), and type.
    topic_tag in DB is a comma-separated string.
    """
    query = db.query(QuestionBank).filter(QuestionBank.difficulty == difficulty)
    
    if topic_tags:
        filters = [QuestionBank.topic_tag.ilike(f"%{tag}%") for tag in topic_tags]
        query = query.filter(or_(*filters))
    
    if type:
        query = query.filter(QuestionBank.type == type)
        
    question = query.order_by(func.random()).first()
    
    return question.title if question else None