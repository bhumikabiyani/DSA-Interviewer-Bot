"""convert interview columns to json

Revision ID: e578b2aefecd
Revises: dbe7b2de6bdf
Create Date: 2026-02-08 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e578b2aefecd'
down_revision: Union[str, Sequence[str], None] = 'dbe7b2de6bdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Change interview_data column from String to JSON
    # First, we need to convert existing string data to JSON
    op.execute("""
        UPDATE interviews 
        SET interview_data = CAST(interview_data AS JSON)
        WHERE interview_data IS NOT NULL
    """)
    
    # Alter the column type
    op.alter_column('interviews', 'interview_data',
               existing_type=sa.String(),
               type_=sa.JSON(),
               existing_nullable=False)
    
    # Change metadata column from String to JSON
    # First, we need to convert existing string data to JSON
    op.execute("""
        UPDATE interviews 
        SET metadata = CAST(metadata AS JSON)
        WHERE metadata IS NOT NULL
    """)
    
    # Alter the column type
    op.alter_column('interviews', 'metadata',
               existing_type=sa.String(),
               type_=sa.JSON(),
               existing_nullable=True)
    
    # Add evaluation_summary column as JSON
    op.add_column('interviews', sa.Column('evaluation_summary', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove evaluation_summary column
    op.drop_column('interviews', 'evaluation_summary')
    
    # Revert metadata column back to String
    op.execute("""
        UPDATE interviews 
        SET metadata = CAST(metadata AS TEXT)
        WHERE metadata IS NOT NULL
    """)
    
    op.alter_column('interviews', 'metadata',
               existing_type=sa.JSON(),
               type_=sa.String(),
               existing_nullable=True)
    
    # Revert interview_data column back to String
    op.execute("""
        UPDATE interviews 
        SET interview_data = CAST(interview_data AS TEXT)
        WHERE interview_data IS NOT NULL
    """)
    
    op.alter_column('interviews', 'interview_data',
               existing_type=sa.JSON(),
               type_=sa.String(),
               existing_nullable=False)
