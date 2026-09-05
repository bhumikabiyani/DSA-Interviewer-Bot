from dsa_interviewer.core.config import settings


def test_settings_exist():
    assert settings is not None

def test_groq_api_key_loaded():
    assert hasattr(settings, 'GROQ_API_KEY')
    assert hasattr(settings, 'GROQ_API_KEY_2')
    assert hasattr(settings, 'GROQ_API_KEY_3')
    assert hasattr(settings, 'GROQ_API_KEY_4')

def test_default_values():
    assert settings.API_HOST == "0.0.0.0"
    assert settings.API_PORT == 8000
    assert settings.LLM_MODEL == "openai/gpt-oss-120b"
    assert settings.SECRET_KEY is not None
    assert settings.ALGORITHM == "HS256"

def test_groq_api_key_rotation():
    # If a key is configured, get_groq_api_key should return a non-empty string
    if settings.GROQ_API_KEY:
        key = settings.get_groq_api_key("user_123")
        assert isinstance(key, str)
        assert len(key) > 0
