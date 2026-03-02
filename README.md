# DSA Interviewer Bot

AI-powered technical interview practice system using Retrieval-Augmented Generation (RAG) for realistic DSA interview simulation.

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **AI-Powered Interviewer**: Uses Groq's Llama-3.3-70b for natural conversation
- **RAG-Enhanced Responses**: Retrieves relevant context from knowledge base
- **15+ DSA Problems**: Covering arrays, strings, trees, graphs, DP, and more
- **Multi-Turn Conversations**: Maintains context throughout the interview
- **RESTful API**: FastAPI backend with automatic documentation
- **Docker Support**: Easy deployment with Docker Compose
- **Comprehensive Testing**: Unit, integration, and E2E tests

## 📋 Quick Start

### Prerequisites
- Python 3.9+
- GROQ API key ([Get one here](https://console.groq.com))

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot

# Setup environment
make setup-env
# Edit .env and add your GROQ_API_KEY

# Install dependencies
make install

# Initialize vector database
make init-db

# Run application
make run
```

Visit http://localhost:8000/docs for API documentation.

### Docker Deployment

```bash
# Build and start services
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down
```

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      FastAPI Backend            │
│  ┌──────────┐  ┌─────────────┐ │
│  │   API    │  │   Services  │ │
│  │ Routes   │──│  - Groq LLM │ │
│  └──────────┘  │  - RAG      │ │
│                │  - Session  │ │
│                └─────────────┘ │
└─────────────────────────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│  ChromaDB   │  │  Groq API    │
│ Vector Store│  │ (Llama-3.3)  │
└─────────────┘  └──────────────┘
```

### Technology Stack

- **Backend**: FastAPI, Uvicorn
- **LLM**: Groq (Llama-3.3-70b-versatile)
- **Vector DB**: ChromaDB
- **Embeddings**: SentenceTransformer (all-MiniLM-L6-v2)
- **Caching**: Redis (optional)
- **Testing**: Pytest
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
DSA-Interviewer-Bot/
├── src/dsa_interviewer/       # Main application
│   ├── api/                   # API endpoints
│   ├── core/                  # Configuration & business logic
│   ├── models/                # Pydantic models
│   ├── services/              # External services
│   └── utils/                 # Utilities
├── data/
│   ├── knowledge_base/        # RAG content (15 problems)
│   ├── vector_store/          # ChromaDB database
│   └── training_data/         # Interview transcripts
├── tests/                     # Test suite
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── scripts/                   # CLI tools
├── docs/                      # Documentation
└── docker/                    # Docker configs
```

## 🔧 Configuration

Key environment variables (see `.env.example`):

```bash
GROQ_API_KEY=your_api_key_here
API_PORT=8000
DEBUG=false
LOG_LEVEL=INFO
RAG_TOP_K=5
LLM_MODEL=llama-3.3-70b-versatile
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [API Documentation](docs/API.md) - API endpoints and usage
- [Contributing Guide](docs/CONTRIBUTING.md) - Development guidelines
- [RAG Architecture](docs/RAG_ARCHITECTURE.md) - System design details

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific test suite
pytest tests/unit/ -v
pytest tests/integration/ -v

# With coverage
pytest --cov=src/dsa_interviewer --cov-report=html
```

## 🛠️ Development

```bash
# Format code
make format

# Run linting
make lint

# Clean build artifacts
make clean
```

## 📊 Knowledge Base

Current content:
- **15 DSA Problems**: Easy (5), Medium (7), Hard (3)
- **Topics**: Arrays, Strings, Trees, Graphs, DP, Linked Lists, Stacks
- **4 Algorithm Concepts**: Sliding window, two pointers, DP, binary trees
- **5 Interview Transcripts**: Real conversation examples
- **Feedback Templates**: Positive and improvement suggestions

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

Includes:
- API server (port 8000)
- Redis cache (port 6379)
- Nginx reverse proxy (port 80)

### Manual Deployment

```bash
# Production server
uvicorn dsa_interviewer.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Groq for fast LLM inference
- ChromaDB for vector storage
- FastAPI for the excellent web framework
- SentenceTransformers for embeddings

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is an educational project for interview practice. Actual interview performance may vary.
