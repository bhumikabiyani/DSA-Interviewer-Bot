import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from fastapi.testclient import TestClient

from dsa_interviewer.main import app


@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_groq_response():
    return "This is a mock response from the interviewer."

@pytest.fixture
def sample_question():
    return {
        "id": "test_001",
        "title": "Two Sum",
        "difficulty": "easy",
        "topic": "arrays",
        "description": "Find two numbers that add up to a target."
    }
