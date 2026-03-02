from dsa_interviewer.core.config import settings


def test_settings_exist():
    assert settings is not None

def test_groq_api_key_loaded():
    assert hasattr(settings, 'GROQ_API_KEY')

def test_chroma_path_configured():
    assert settings.CHROMA_PATH is not None
    assert 'vector_store' in settings.CHROMA_PATH

def test_default_values():
    assert settings.API_HOST == "0.0.0.0"
    assert settings.API_PORT == 8000
    assert settings.RAG_TOP_K == 5
    assert settings.LLM_MODEL == "llama-3.3-70b-versatile"
