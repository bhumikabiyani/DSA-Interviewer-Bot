# System Architecture

## Overview

DSA Interviewer Bot is a production-ready RAG (Retrieval-Augmented Generation) system for conducting realistic technical interviews. The system combines vector search, LLM generation, and conversation management to simulate authentic interview experiences.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web UI, CLI, API Clients)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Nginx)                      │
│  - Load Balancing                                           │
│  - SSL Termination                                          │
│  - Rate Limiting                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Routes  │  │   Services   │  │     Core     │      │
│  │              │  │              │  │              │      │
│  │ - Interview  │  │ - Groq LLM   │  │ - Config     │      │
│  │ - Health     │  │ - RAG        │  │ - Business   │      │
│  │              │  │ - Session    │  │   Logic      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  ChromaDB   │  │   Groq API   │  │    Redis     │
│ Vector Store│  │ (Llama-3.3)  │  │    Cache     │
│             │  │              │  │              │
│ - Questions │  │ - Generation │  │ - Sessions   │
│ - Solutions │  │ - Chat       │  │ - Rate Limit │
│ - Concepts  │  │              │  │              │
└─────────────┘  └──────────────┘  └──────────────┘
```

## Component Details

### 1. API Layer (`src/dsa_interviewer/api/`)

**Responsibilities:**
- HTTP request handling
- Request validation (Pydantic models)
- Response formatting
- Error handling

**Key Endpoints:**
- `POST /api/start_interview` - Initialize new interview session
- `POST /api/interact` - Continue conversation
- `GET /health` - Health check

### 2. Service Layer (`src/dsa_interviewer/services/`)

#### GroqLLM Service
- Manages communication with Groq API
- Handles chat completions
- Implements retry logic
- Manages conversation context

**Features:**
- Automatic retries on failure
- Timeout handling
- Request/response logging
- Temperature and token control

#### RAG Service
- Vector similarity search
- Document retrieval
- Context ranking
- Metadata filtering

**Features:**
- ChromaDB integration
- Configurable top-k retrieval
- Distance-based ranking
- Metadata extraction

#### Session Store
- Conversation history management
- Session lifecycle
- Memory management

### 3. Core Layer (`src/dsa_interviewer/core/`)

**Configuration Management:**
- Environment variable loading
- Path resolution
- Default values
- Validation

**Business Logic:**
- Interview flow control
- Question selection
- Response generation
- Feedback evaluation

### 4. Data Layer (`data/`)

#### Knowledge Base (`data/knowledge_base/`)
```
knowledge_base/
├── questions/          # 15 DSA problems
├── solutions/          # Optimal solutions
├── concepts/           # Algorithm explanations
├── transcripts/        # Interview examples
├── feedback/           # Feedback templates
└── metadata/           # RAG configuration
```

#### Vector Store (`data/vector_store/`)
- ChromaDB persistent storage
- Embeddings: SentenceTransformer (all-MiniLM-L6-v2)
- Distance metric: Cosine similarity
- Chunking: 1500 characters with smart boundaries

## Data Flow

### Interview Start Flow

```
1. Client → POST /api/start_interview
2. API → Question Selector → Random question from knowledge base
3. API → Session Store → Create new session
4. API → RAG Service → Retrieve relevant context
5. RAG → ChromaDB → Vector similarity search
6. API → Groq LLM → Generate initial response
7. Groq → API → Return response
8. API → Client → Return session_id + question + response
```

### Interaction Flow

```
1. Client → POST /api/interact {session_id, message}
2. API → Session Store → Retrieve conversation history
3. API → RAG Service → Retrieve context for user message
4. RAG → ChromaDB → Vector search
5. API → Build prompt with:
   - System prompt
   - Conversation history
   - Retrieved context
   - User message
6. API → Groq LLM → Generate response
7. Groq → API → Return response
8. API → Session Store → Update conversation history
9. API → Client → Return response
```

## RAG Pipeline

### 1. Indexing (Offline)

```
Knowledge Base Files
        ↓
    Load & Parse
        ↓
    Chunk Text (1500 chars)
        ↓
    Generate Embeddings (SentenceTransformer)
        ↓
    Store in ChromaDB
```

### 2. Retrieval (Runtime)

```
User Query
    ↓
Generate Query Embedding
    ↓
Vector Similarity Search (ChromaDB)
    ↓
Rank by Distance (Cosine)
    ↓
Return Top-K Documents (default: 5)
    ↓
Inject into LLM Prompt
```

## Technology Stack

### Backend
- **Framework**: FastAPI 0.115+
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic 2.10+

### AI/ML
- **LLM**: Groq (Llama-3.3-70b-versatile)
- **Embeddings**: SentenceTransformer (all-MiniLM-L6-v2)
- **Vector DB**: ChromaDB 0.5+

### Infrastructure
- **Cache**: Redis 7+ (optional)
- **Reverse Proxy**: Nginx
- **Containerization**: Docker + Docker Compose

### Development
- **Testing**: Pytest 8.3+
- **Linting**: Ruff 0.8+
- **Formatting**: Black 24.10+
- **Type Checking**: MyPy 1.13+

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Session data in Redis (shared state)
- Multiple API instances behind load balancer

### Vertical Scaling
- ChromaDB supports large collections
- Groq API handles high throughput
- Redis for fast session access

### Performance Optimizations
- Vector search caching
- Conversation history pruning
- Batch embedding generation
- Connection pooling

## Security

### API Security
- CORS configuration
- Rate limiting (planned)
- Input validation
- Error sanitization

### Data Security
- No sensitive data in logs
- Environment variable secrets
- Secure API key storage
- HTTPS in production

## Monitoring & Observability

### Logging
- Structured logging (JSON)
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging
- Error tracking

### Metrics (Planned)
- Request latency
- Error rates
- Cache hit rates
- LLM token usage

### Health Checks
- `/health` endpoint
- Service dependency checks
- Database connectivity

## Deployment Architecture

### Development
```
Local Machine
├── Python Virtual Environment
├── Local ChromaDB
└── Direct Groq API calls
```

### Production
```
Docker Compose Stack
├── Nginx (Port 80/443)
│   └── Reverse Proxy
├── API Containers (Port 8000)
│   └── Multiple instances
├── Redis (Port 6379)
│   └── Session cache
└── ChromaDB Volume
    └── Persistent storage
```

## Future Enhancements

### Planned Features
- [ ] Real-time streaming responses
- [ ] Multi-language support
- [ ] Advanced feedback system
- [ ] Performance analytics
- [ ] User authentication
- [ ] Interview recording/playback
- [ ] Custom question sets
- [ ] Difficulty adaptation

### Infrastructure Improvements
- [ ] Kubernetes deployment
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] ELK stack logging
- [ ] CDN for static assets
- [ ] Database replication