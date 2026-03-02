from sqlalchemy import Column, Integer, String

from dsa_interviewer.core.database import Base


class QuestionBank(Base):
    __tablename__ = "question_bank"
    question_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(Integer, nullable=False)
    topic_tag = Column(String,nullable=False)
    type = Column(String,index=True)
    company_tag = Column(String)
    question_url = Column(String)
