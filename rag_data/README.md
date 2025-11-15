# DSA Interviewer RAG Knowledge Base

This directory contains the complete knowledge base for the DSA Interviewer RAG system.

## Directory Structure

### Core Knowledge
- **questions/**: 300 DSA problems with metadata and examples
- **solutions/**: Optimal solutions with detailed explanations
- **brute_force/**: Brute force approaches for comparison
- **concepts/**: DSA theory, algorithms, and data structures
- **patterns/**: Common algorithmic patterns and templates

### Interview Intelligence
- **transcripts/**: Multi-turn interview conversations with annotations
- **followups/**: Context-aware follow-up questions and hints
- **rubrics/**: Evaluation criteria and scoring guidelines
- **feedback/**: Feedback templates and improvement suggestions
- **interviewer_style/**: Personality, tone, and behavioral patterns

### System Metadata
- **metadata/**: Cross-references, indexes, and configuration files

## Document Naming Convention

### Questions
- Format: `{difficulty}_{topic}_{id}.json`
- Example: `medium_arrays_001.json`

### Solutions
- Format: `{question_id}_optimal.json`
- Example: `medium_arrays_001_optimal.json`

### Concepts
- Format: `{category}_{concept}.json`
- Example: `algorithms_sliding_window.json`

### Transcripts
- Format: `{scenario}_{difficulty}_{id}.json`
- Example: `problem_solving_medium_001.json`

## Metadata Schema

Each document includes standardized metadata for efficient retrieval:

```json
{
  "id": "unique_identifier",
  "type": "question|solution|concept|transcript|rubric|feedback",
  "topic": "arrays|strings|trees|graphs|dp|etc",
  "difficulty": "easy|medium|hard",
  "pattern": "sliding_window|two_pointers|dfs|bfs|etc",
  "tags": ["relevant", "keywords"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Usage Guidelines

1. **Chunking**: Documents are pre-chunked for optimal retrieval (250-400 tokens)
2. **Embedding**: Use separate embeddings for technical vs behavioral content
3. **Retrieval**: Combine semantic search with metadata filtering
4. **Context**: Merge multiple document types for comprehensive responses

## Quality Standards

- All solutions are verified for correctness
- Complexity analysis is accurate and complete
- Interview transcripts reflect realistic scenarios
- Feedback templates are constructive and actionable