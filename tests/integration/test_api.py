import pytest
from unittest.mock import patch, Mock

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

@patch('dsa_interviewer.api.interview.pick_random_question')
@patch('dsa_interviewer.api.interview.llm')
@patch('dsa_interviewer.api.interview.rag')
def test_start_interview(mock_rag, mock_llm, mock_pick_question, client):
    mock_pick_question.return_value = (
        "data/knowledge_base/questions/test.json",
        "Given an array of integers, find two numbers that add up to a target."
    )
    mock_rag.retrieve.return_value = ["Sample context"]
    mock_llm.chat.return_value = "Hello! Let's start the interview."
    
    response = client.post("/api/start_interview")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "question" in data
    assert "response" in data
    assert "Given an array" in data["question"]

@patch('dsa_interviewer.api.interview.llm')
@patch('dsa_interviewer.api.interview.rag')
@patch('dsa_interviewer.api.interview.sessions')
def test_interact_endpoint(mock_sessions, mock_rag, mock_llm, client):
    mock_rag.retrieve.return_value = ["Sample context"]
    mock_llm.chat.return_value = "Great approach!"
    mock_sessions.session_exists.return_value = True
    mock_sessions.get_history.return_value = {
        "question": "Test question",
        "history": []
    }
    
    response = client.post("/api/interact", json={
        "session_id": "test_session",
        "message": "I would use a hash map"
    })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data