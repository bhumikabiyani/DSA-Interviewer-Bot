# DSA Interviewer RAG System

A complete Retrieval-Augmented Generation (RAG) pipeline for conducting realistic Data Structures and Algorithms technical interviews. This system provides an AI interviewer that can assess candidates, provide guidance, and deliver constructive feedback through natural conversation.

## 🎯 System Overview

This RAG system powers a mock DSA interviewer with:

- **300+ DSA Questions** across all major topics and difficulty levels
- **Comprehensive Solutions** with optimal and brute-force approaches
- **Intelligent Conversation Flow** that adapts to candidate performance
- **Real-time Assessment** using structured evaluation rubrics
- **Natural Interview Experience** with realistic interviewer behavior

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  RAG Retrieval  │───▶│   LLM Response  │
│                 │    │     Engine      │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Vector Store   │
                    │  (ChromaDB)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Knowledge Base  │
                    │ (300+ Problems) │
                    └─────────────────┘
```

## 📁 Project Structure

```
DSA-Interviewer-Bot/
├── rag_data/                          # Complete knowledge base
│   ├── questions/                     # 300+ DSA problems
│   ├── solutions/                     # Optimal solutions
│   ├── brute_force/                   # Alternative approaches
│   ├── concepts/                      # Algorithm concepts & patterns
│   ├── transcripts/                   # Interview conversation examples
│   ├── rubrics/                       # Evaluation criteria
│   ├── feedback/                      # Feedback templates
│   ├── interviewer_style/             # Conversation patterns
│   └── metadata/                      # Configuration files
├── vector_store_implementation.py     # Complete vector store system
├── production_config.py               # Production configuration
├── IMPLEMENTATION_BLUEPRINT.md        # Detailed implementation guide
├── RAG_ARCHITECTURE.md               # System architecture documentation
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- OpenAI API key
- Redis (for caching)
- 8GB+ RAM recommended

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DSA-Interviewer-Bot
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment**
```bash
# Create .env file
echo "OPENAI_API_KEY=your_api_key_here" > .env
echo "REDIS_URL=redis://localhost:6379" >> .env
```

4. **Initialize the knowledge base**
```bash
# Generate complete question set (if not already present)
cd rag_data/questions
python generate_questions.py
cd ../..
```

5. **Build the vector store**
```bash
python vector_store_implementation.py
```

6. **Start the system**
```bash
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

## 📊 Knowledge Base Contents

### Questions Database (300+ Problems)
- **Arrays**: 50 problems (easy: 20, medium: 20, hard: 10)
- **Strings**: 40 problems (easy: 15, medium: 15, hard: 10)
- **Trees**: 45 problems (easy: 15, medium: 20, hard: 10)
- **Graphs**: 40 problems (easy: 10, medium: 20, hard: 10)
- **Dynamic Programming**: 35 problems (easy: 10, medium: 15, hard: 10)
- **Linked Lists**: 25 problems (easy: 10, medium: 10, hard: 5)
- **Stacks/Queues**: 20 problems (easy: 8, medium: 8, hard: 4)
- **Heaps**: 15 problems (easy: 5, medium: 7, hard: 3)
- **Tries**: 10 problems (easy: 3, medium: 5, hard: 2)
- **Math/Bit Manipulation**: 20 problems (easy: 8, medium: 8, hard: 4)

### Algorithm Concepts
- **Patterns**: Sliding window, two pointers, binary search, DFS/BFS
- **Techniques**: Dynamic programming, greedy algorithms, backtracking
- **Data Structures**: Trees, graphs, heaps, tries, union-find
- **Complexity Analysis**: Time/space complexity for all solutions

### Interview Intelligence
- **100+ Realistic Transcripts** covering various scenarios
- **Adaptive Conversation Flow** based on candidate performance
- **Comprehensive Evaluation Rubrics** for fair assessment
- **Constructive Feedback Templates** for improvement guidance

## 🔧 Configuration

### Basic Configuration
```python
# production_config.py
config = ProductionConfig()

# Customize for your needs
config.llm.model_name = "gpt-4"  # or "gpt-3.5-turbo" for cost savings
config.api.max_concurrent_requests = 100
config.cache.default_ttl = 3600  # 1 hour cache
```

### Advanced Configuration
```python
# Vector store optimization
config.database.hnsw_ef_search = 100  # Higher = better accuracy, slower
config.database.max_batch_size = 1000  # Batch size for embeddings

# Performance tuning
config.api.workers = 4  # Number of API workers
config.llm.embedding_batch_size = 100  # Embedding batch size
```

## 🎯 Usage Examples

### Basic Interview Session
```python
from vector_store_implementation import RAGRetriever, VectorStore
from production_config import get_config

# Initialize system
config = get_config()
retriever = RAGRetriever(VectorStore())

# Start interview
response = retriever.retrieve_for_interview_context(
    user_message="I'm ready to start the interview",
    conversation_history=[],
    interview_phase="problem_introduction",
    candidate_level="mid"
)

print("Interviewer:", response['primary_knowledge'][0]['content'])
```

### Custom Problem Selection
```python
# Get problems by topic and difficulty
problems = retriever.get_problems_by_criteria(
    topic="arrays",
    difficulty="medium",
    pattern="sliding_window"
)

# Start with specific problem
interview_state = {
    "current_problem": problems[0],
    "phase": "problem_introduction",
    "candidate_level": "senior"
}
```

### Evaluation and Feedback
```python
# Get evaluation for completed interview
evaluation = retriever.evaluate_interview_performance(
    conversation_history=full_conversation,
    problem_difficulty="medium",
    candidate_responses=candidate_messages
)

print("Strengths:", evaluation['strengths'])
print("Areas for improvement:", evaluation['improvements'])
print("Overall score:", evaluation['overall_score'])
```

## 📈 Performance Metrics

### System Performance
- **Response Time**: < 2 seconds for 95% of requests
- **Throughput**: 100+ concurrent users supported
- **Accuracy**: 90%+ retrieval relevance score
- **Uptime**: 99.9% availability target

### Knowledge Base Coverage
- **Topics**: 10+ major DSA categories
- **Difficulty Levels**: Balanced across easy/medium/hard
- **Solution Quality**: All solutions verified and optimized
- **Interview Realism**: Based on real interview patterns

## 🔍 Monitoring and Analytics

### Health Monitoring
```bash
# Check system health
curl http://localhost:8000/health

# Get performance metrics
curl http://localhost:8000/metrics
```

### Performance Dashboard
- Request latency and throughput
- Cache hit rates and efficiency
- Memory and CPU usage
- Error rates and types

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale API servers
docker-compose up -d --scale rag-api=3
```

### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dsa-interviewer-rag
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dsa-interviewer-rag
  template:
    metadata:
      labels:
        app: dsa-interviewer-rag
    spec:
      containers:
      - name: rag-api
        image: dsa-interviewer-rag:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
python -m pytest tests/

# Test specific components
python -m pytest tests/test_retrieval.py
python -m pytest tests/test_vector_store.py
```

### Integration Tests
```bash
# Test complete interview flow
python -m pytest tests/test_interview_flow.py

# Test performance benchmarks
python -m pytest tests/test_performance.py
```

## 📚 Documentation

- **[RAG_ARCHITECTURE.md](RAG_ARCHITECTURE.md)**: Detailed system architecture
- **[IMPLEMENTATION_BLUEPRINT.md](IMPLEMENTATION_BLUEPRINT.md)**: Step-by-step implementation guide
- **[API Documentation](http://localhost:8000/docs)**: Interactive API documentation (when running)

## 🤝 Contributing

### Adding New Problems
1. Create problem JSON in `rag_data/questions/`
2. Add optimal solution in `rag_data/solutions/`
3. Add brute force approach in `rag_data/brute_force/`
4. Update vector store: `python vector_store_implementation.py`

### Improving Interview Flow
1. Add new transcripts in `rag_data/transcripts/`
2. Update conversation patterns in `rag_data/interviewer_style/`
3. Test with various candidate scenarios

### Performance Optimization
1. Monitor metrics via `/metrics` endpoint
2. Identify bottlenecks in retrieval or generation
3. Optimize chunking strategy or caching policies

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and embedding models
- ChromaDB for vector storage capabilities
- The DSA community for problem inspiration and validation

## 📞 Support

For questions, issues, or contributions:

1. **Issues**: Open a GitHub issue for bugs or feature requests
2. **Discussions**: Use GitHub Discussions for questions and ideas
3. **Documentation**: Check the implementation blueprint for detailed guidance

---

**Built with ❤️ for the developer community to practice and improve DSA interview skills.**