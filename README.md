# DSA Interviewer Bot

An AI-powered technical interview simulation platform designed for Data Structures and Algorithms (DSA) mock interview practice.

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- **AI-Powered Technical Interviewer**: Socratic, conversational interviewer powered by Groq's high-speed LLaMA-3 models.
- **Interactive Code Editor**: Integrated Monaco code editor with live problem solving, syntax highlighting, and edge case tracking.
- **Structured Performance Evaluation**: Automated scoring across problem understanding, algorithm optimality, code quality, time/space complexity, and communication.
- **Authentication**: JWT authentication with user registration, login, and optional Google OAuth integration.
- **Full-Stack Architecture**: Modern Next.js 14 frontend with Tailwind CSS and FastAPI backend with PostgreSQL persistence.
- **Speech Synthesis**: Text-to-speech feedback using Web Speech API and AWS Polly.

---

## 🏗️ Architecture

```
┌────────────────────────────────┐
│   Next.js 14 Frontend          │
│   - Chat & Monaco Code Editor  │
│   - Candidate Dashboard        │
│   - Evaluation Viewer          │
└───────────────┬────────────────┘
                │  REST / JSON
                ▼
┌────────────────────────────────┐
│   FastAPI Backend API          │
│   - Auth & Google OAuth Routes │
│   - Interview Session Flow     │
│   - Evaluation Engine          │
└───────┬────────────────┬───────┘
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Groq API   │
│   Database   │  │  (LLaMA 3)   │
└──────────────┘  └──────────────┘
```

---

## 📋 Quick Start

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- PostgreSQL database
- Groq API Key ([console.groq.com](https://console.groq.com))

---

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/bhumikabiyani/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot

# Configure environment variables
cp .env.example .env
# Edit .env and configure your GROQ_API_KEY and DATABASE_URL

# Install dependencies
pip install -r requirements.txt
pip install -e ".[dev]"

# Initialize database tables
make init-db

# Start the API server
make run
```

The backend will be available at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend application will be running at `http://localhost:3000`.

---

## 🔧 Configuration

Key environment variables in `.env` (see [.env.example](.env.example)):

```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# API & Security
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secure-random-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/dsadb

# Optional Integrations
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🐳 Docker Deployment

To spin up the entire backend stack using Docker Compose:

```bash
# Build and run containers
make docker-up

# View logs
make docker-logs

# Stop containers
make docker-down
```

---

## 🧪 Testing

```bash
# Run backend test suite
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --cov=src/dsa_interviewer
```

---

## 📁 Repository Structure

```
DSA-Interviewer-Bot/
├── src/dsa_interviewer/       # Backend FastAPI application
│   ├── api/                   # API routes (Auth, Google Auth, Interview)
│   ├── core/                  # Config, database connection & security
│   ├── models/                # SQLAlchemy & Pydantic models
│   ├── services/              # Groq LLM, SessionStore, Evaluation
│   └── utils/                 # JWT, moderation, and helpers
├── frontend/                  # Next.js 14 React frontend
│   ├── app/                   # App Router pages (interview, dashboard, auth)
│   ├── components/            # Monaco editor, chat UI, evaluation viewer
│   └── lib/                   # API clients and Zustand stores
├── data/                      # Problem datasets & sample training transcripts
├── tests/                     # Unit and integration test suite
├── docker/                    # Docker & Nginx configurations
├── Dockerfile                 # Backend container image
├── docker-compose.yml         # Container orchestration
└── Makefile                   # Common development shortcuts
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
