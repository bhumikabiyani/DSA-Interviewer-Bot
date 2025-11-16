import pytest
from unittest.mock import Mock, patch
from dsa_interviewer.services.rag_service import RagService

@pytest.fixture
def mock_chroma_client():
    with patch('dsa_interviewer.services.rag_service.chromadb.PersistentClient') as mock:
        mock_collection = Mock()
        mock_collection.count.return_value = 100
        mock_collection.query.return_value = {
            "documents": [["Sample document 1", "Sample document 2"]],
            "metadatas": [[{"source": "test"}, {"source": "test"}]],
            "distances": [[0.1, 0.2]]
        }
        mock.return_value.get_or_create_collection.return_value = mock_collection
        yield mock

def test_rag_service_initialization(mock_chroma_client):
    service = RagService()
    assert service.client is not None
    assert service.collection is not None

def test_retrieve_documents(mock_chroma_client):
    service = RagService()
    results = service.retrieve("test query", n=2)
    assert len(results) == 2
    assert results[0] == "Sample document 1"

def test_retrieve_with_metadata(mock_chroma_client):
    service = RagService()
    results = service.retrieve_with_metadata("test query", n=2)
    assert len(results) == 2
    assert "document" in results[0]
    assert "metadata" in results[0]
    assert "distance" in results[0]