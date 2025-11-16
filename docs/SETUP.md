# Setup Guide

## Quick Start

### 1. Prerequisites
- Python 3.9+
- Git
- 4GB RAM minimum
- GROQ API key ([Get one here](https://console.groq.com))

### 2. Installation

```bash
# Clone repository
git clone https://github.com/yourusername/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
make install
# OR
pip install -r requirements.txt
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your GROQ_API_KEY
nano .env  # or use your preferred editor
```

### 4. Initialize Vector Database

```bash
# Build ChromaDB vector store from knowledge base
python scripts/embed_and_index.py
```

This will:
- Load all content from `data/knowledge_base/`
- Generate embeddings using SentenceTransformer
- Store in ChromaDB at `data/vector_store/`

### 5. Run Application

**Option A: Development Server**
```bash
make run
# OR
uvicorn dsa_interviewer.main:app --reload
```

**Option B: Docker**
```bash
make docker-up
# OR
docker-compose up
```

### 6. Verify Installation

Visit http://localhost:8000/docs to see the API documentation.

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

## Project Structure

```
DSA-Interviewer-Bot/
├── src/dsa_interviewer/       # Main application
│   ├── api/                   # API endpoints
│   ├── core/                  # Configuration & business logic
│   ├── models/                # Pydantic models
│   ├── services/              # External services (Groq, ChromaDB)
│   └── utils/                 # Utilities
├── data/
│   ├── knowledge_base/        # RAG content (questions, solutions, etc.)
│   ├── vector_store/          # ChromaDB database
│   └── training_data/         # Interview transcripts
├── tests/                     # Test suite
├── scripts/                   # CLI tools
├── docs/                      # Documentation
└── docker/                    # Docker configs
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | **Required** Groq API key |
| `API_HOST` | 0.0.0.0 | API server host |
| `API_PORT` | 8000 | API server port |
| `DEBUG` | false | Enable debug mode |
| `LOG_LEVEL` | INFO | Logging level |
| `REDIS_URL` | - | Redis connection URL (optional) |
| `RAG_TOP_K` | 5 | Number of RAG results to retrieve |
| `LLM_MODEL` | llama-3.3-70b-versatile | Groq model to use |
| `LLM_TEMPERATURE` | 0.7 | LLM temperature |
| `LLM_MAX_TOKENS` | 1024 | Max tokens per response |

### Paths

Paths are auto-configured relative to project root:
- `CHROMA_PATH`: `data/vector_store/`
- `KNOWLEDGE_BASE_PATH`: `data/knowledge_base/`

## Development Setup

### Install Development Dependencies

```bash
pip install -e ".[dev]"
```

This includes:
- pytest (testing)
- black (formatting)
- ruff (linting)
- mypy (type checking)

### Run Tests

```bash
make test
# OR
pytest tests/ -v --cov=src/dsa_interviewer
```

### Code Quality

```bash
# Format code
make format

# Run linting
make lint
```

## Docker Deployment

### Build Image

```bash
docker build -t dsa-interviewer:latest .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

This starts:
- API server (port 8000)
- Redis cache (port 6379)
- Nginx reverse proxy (port 80)

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

## Troubleshooting

### ChromaDB Errors

If you get ChromaDB initialization errors:
```bash
# Remove existing database
rm -rf data/vector_store/

# Rebuild
python scripts/embed_and_index.py
```

### Import Errors

Ensure PYTHONPATH includes src/:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
```

### Groq API Errors

- Verify API key is correct in `.env`
- Check API quota at https://console.groq.com
- Ensure network connectivity

### Port Already in Use

Change port in `.env`:
```bash
API_PORT=8001
```

## Next Steps

- Read [API Documentation](API.md)
- Check [Contributing Guide](CONTRIBUTING.md)
- Explore [Architecture](../RAG_ARCHITECTURE.md)