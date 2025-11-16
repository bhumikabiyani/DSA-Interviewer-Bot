# Contributing to DSA Interviewer Bot

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Python 3.9 or higher
- Git
- Docker (optional, for containerized development)

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot
```

2. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
pip install -e ".[dev]"
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

5. **Initialize vector store**
```bash
python scripts/embed_and_index.py
```

## Development Workflow

### Code Style

We use the following tools for code quality:

- **Black** for code formatting
- **Ruff** for linting
- **MyPy** for type checking

Run before committing:
```bash
black src/ tests/
ruff check src/ tests/
mypy src/
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src/dsa_interviewer --cov-report=html

# Run specific test file
pytest tests/unit/test_config.py -v
```

### Running the Application

**Development mode:**
```bash
uvicorn dsa_interviewer.main:app --reload
```

**Production mode:**
```bash
docker-compose up
```

## Project Structure

```
DSA-Interviewer-Bot/
├── src/dsa_interviewer/    # Main application code
│   ├── api/                # FastAPI routes
│   ├── core/               # Business logic
│   ├── models/             # Pydantic models
│   ├── services/           # External services
│   └── utils/              # Utilities
├── tests/                  # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── data/                   # Data files
│   ├── knowledge_base/    # RAG knowledge base
│   └── vector_store/      # ChromaDB database
├── scripts/               # CLI tools
└── docs/                  # Documentation
```

## Making Changes

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages
Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: improve code structure`

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR to `develop` branch
7. Wait for review and address feedback

## Adding New Features

### Adding a New API Endpoint

1. Create route in `src/dsa_interviewer/api/`
2. Add Pydantic models in `src/dsa_interviewer/models/`
3. Implement business logic in `src/dsa_interviewer/core/`
4. Add tests in `tests/integration/`
5. Update API documentation

### Adding New RAG Content

1. Add JSON files to `data/knowledge_base/`
2. Follow existing schema structure
3. Re-run embedding script: `python scripts/embed_and_index.py`
4. Test retrieval with new content

## Testing Guidelines

### Unit Tests
- Test individual functions/classes
- Mock external dependencies
- Fast execution (<1s per test)

### Integration Tests
- Test API endpoints
- Use TestClient from FastAPI
- Mock external services (Groq API)

### E2E Tests
- Test complete user workflows
- Use real services when possible
- Slower execution acceptable

## Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No sensitive data in commits
- [ ] Type hints added
- [ ] Error handling implemented
- [ ] Logging added where appropriate

## Getting Help

- Open an issue for bugs or feature requests
- Join our Discord community (link)
- Check existing documentation in `docs/`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.