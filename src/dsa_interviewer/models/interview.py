from sqlalchemy import JSON, Column, Integer, String, DateTime
from datetime import datetime

# Use the project's shared declarative Base to avoid multiple metadata registries
from dsa_interviewer.core.database import Base


class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    interview_data = Column(JSON, nullable=False)
    evaluation_summary = Column(JSON, nullable=True)
    # 'metadata' is a reserved attribute name on declarative classes; use attribute
    # name 'metadata_' but keep the DB column name as 'metadata' for backward compatibility.
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return (
            f"<Interview(id='{self.id}', user_id='{self.user_id}', "
            f"interview_data='{self.interview_data}', created_at='{self.created_at}')>"
        )