#!/usr/bin/env python3
"""
Complete vector store implementation for DSA Interviewer RAG system.
Includes document processing, embedding generation, and retrieval logic.
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np

# Vector store dependencies (would need to be installed)
try:
    import chromadb
    import openai
except ImportError as e:
    print(f"Missing dependencies: {e}")
    print("Install with: pip install chromadb sentence-transformers openai")

@dataclass
class DocumentChunk:
    """Represents a single document chunk with metadata"""
    id: str
    content: str
    document_type: str
    chunk_type: str
    topic: str
    difficulty: str
    pattern: str
    tags: list[str]
    complexity: dict[str, str]
    interview_phase: str
    speaker_role: Optional[str] = None
    interaction_type: Optional[str] = None
    candidate_level: Optional[str] = None
    evaluation_criteria: list[str] = None
    priority: int = 5
    context_window_position: str = "supporting"
    related_documents: list[str] = None
    prerequisite_concepts: list[str] = None
    follow_up_topics: list[str] = None
    created_at: str = None
    quality_score: float = 1.0

    def __post_init__(self):
        if self.evaluation_criteria is None:
            self.evaluation_criteria = []
        if self.related_documents is None:
            self.related_documents = []
        if self.prerequisite_concepts is None:
            self.prerequisite_concepts = []
        if self.follow_up_topics is None:
            self.follow_up_topics = []
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

class DocumentProcessor:
    """Handles document loading and chunking"""

    def __init__(self, rag_data_path: str = "rag_data"):
        self.rag_data_path = Path(rag_data_path)
        self.chunking_config = self._load_chunking_config()

    def _load_chunking_config(self) -> dict:
        """Load chunking strategy configuration"""
        config_path = self.rag_data_path / "metadata" / "chunking_strategy.json"
        if config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        return {}

    def load_all_documents(self) -> list[DocumentChunk]:
        """Load and chunk all documents from the RAG data directory"""
        chunks = []

        # Process each document type
        for doc_type in ["questions", "solutions", "brute_force", "concepts", "transcripts", "rubrics", "feedback"]:
            doc_dir = self.rag_data_path / doc_type
            if doc_dir.exists():
                chunks.extend(self._process_document_directory(doc_dir, doc_type))

        return chunks

    def _process_document_directory(self, directory: Path, doc_type: str) -> list[DocumentChunk]:
        """Process all JSON files in a directory"""
        chunks = []

        for file_path in directory.glob("*.json"):
            try:
                with open(file_path) as f:
                    document = json.load(f)

                # Extract chunks based on document type
                doc_chunks = self._chunk_document(document, doc_type)
                chunks.extend(doc_chunks)

            except Exception as e:
                logging.error(f"Error processing {file_path}: {e}")

        return chunks

    def _chunk_document(self, document: dict, doc_type: str) -> list[DocumentChunk]:
        """Chunk a single document based on its type"""
        metadata = document.get("metadata", {})
        content = document.get("content", {})

        if doc_type == "questions":
            return self._chunk_question(metadata, content)
        elif doc_type in ["solutions", "brute_force"]:
            return self._chunk_solution(metadata, content)
        elif doc_type == "concepts":
            return self._chunk_concept(metadata, content)
        elif doc_type == "transcripts":
            return self._chunk_transcript(metadata, content)
        elif doc_type == "rubrics":
            return self._chunk_rubric(metadata, content)
        elif doc_type == "feedback":
            return self._chunk_feedback(metadata, content)
        else:
            return []

    def _chunk_question(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk question documents"""
        chunks = []

        # Problem statement chunk
        problem_content = f"""
        Title: {content.get('title', '')}

        Description: {content.get('description', '')}

        Constraints:
        {chr(10).join(content.get('constraints', []))}

        Examples:
        {self._format_examples(content.get('examples', []))}
        """.strip()

        chunks.append(DocumentChunk(
            id=f"{metadata['id']}_problem_statement",
            content=problem_content,
            document_type="question",
            chunk_type="problem_statement",
            topic=metadata.get("topic", ""),
            difficulty=metadata.get("difficulty", ""),
            pattern=metadata.get("pattern", ""),
            tags=metadata.get("tags", []),
            complexity=metadata.get("complexity", {}),
            interview_phase="problem_introduction",
            evaluation_criteria=metadata.get("evaluation_criteria", []),
            priority=9
        ))

        # Hints and guidance chunk
        guidance_content = f"""
        Hints:
        {chr(10).join(content.get('hints', []))}

        Edge Cases:
        {chr(10).join(content.get('edge_cases', []))}

        Follow-up Questions:
        {chr(10).join(content.get('follow_up_questions', []))}
        """.strip()

        chunks.append(DocumentChunk(
            id=f"{metadata['id']}_guidance",
            content=guidance_content,
            document_type="question",
            chunk_type="guidance",
            topic=metadata.get("topic", ""),
            difficulty=metadata.get("difficulty", ""),
            pattern=metadata.get("pattern", ""),
            tags=metadata.get("tags", []) + ["hints", "edge_cases"],
            complexity=metadata.get("complexity", {}),
            interview_phase="clarification",
            evaluation_criteria=["problem_understanding"],
            priority=7
        ))

        return chunks

    def _chunk_solution(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk solution documents"""
        chunks = []

        # Approach explanation chunk
        approach_content = f"""
        Approach: {content.get('approach_name', '')}

        Intuition: {content.get('intuition', '')}

        Algorithm Steps:
        {chr(10).join(content.get('algorithm_steps', []))}

        Key Insights:
        {chr(10).join(content.get('key_insights', []))}
        """.strip()

        chunks.append(DocumentChunk(
            id=f"{metadata['id']}_approach",
            content=approach_content,
            document_type=metadata.get("type", "solution"),
            chunk_type="approach_explanation",
            topic=metadata.get("topic", ""),
            difficulty=metadata.get("difficulty", ""),
            pattern=metadata.get("pattern", ""),
            tags=metadata.get("tags", []),
            complexity=metadata.get("complexity", {}),
            interview_phase="approach_discussion",
            evaluation_criteria=["algorithm_design"],
            priority=8
        ))

        # Implementation chunk
        code_content = f"""
        Implementation:

        Python:
        ```python
        {content.get('code', {}).get('python', '')}
        ```

        Complexity Analysis:
        Time: {content.get('complexity_analysis', {}).get('time', {}).get('complexity', '')}
        Space: {content.get('complexity_analysis', {}).get('space', {}).get('complexity', '')}

        Common Mistakes:
        {chr(10).join(content.get('common_mistakes', []))}
        """.strip()

        chunks.append(DocumentChunk(
            id=f"{metadata['id']}_implementation",
            content=code_content,
            document_type=metadata.get("type", "solution"),
            chunk_type="implementation",
            topic=metadata.get("topic", ""),
            difficulty=metadata.get("difficulty", ""),
            pattern=metadata.get("pattern", ""),
            tags=metadata.get("tags", []) + ["code", "implementation"],
            complexity=metadata.get("complexity", {}),
            interview_phase="implementation",
            evaluation_criteria=["implementation", "optimization"],
            priority=8
        ))

        return chunks

    def _chunk_concept(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk concept documents"""
        chunks = []

        # Concept definition chunk
        definition_content = f"""
        Concept: {content.get('concept_name', '')}

        Definition: {content.get('definition', '')}

        When to Use:
        {chr(10).join(content.get('when_to_use', []))}

        Key Characteristics:
        {chr(10).join(content.get('key_characteristics', []))}
        """.strip()

        chunks.append(DocumentChunk(
            id=f"{metadata['id']}_definition",
            content=definition_content,
            document_type="concept",
            chunk_type="concept_definition",
            topic=metadata.get("topic", ""),
            difficulty=metadata.get("difficulty", ""),
            pattern=metadata.get("pattern", ""),
            tags=metadata.get("tags", []),
            complexity=metadata.get("complexity", {}),
            interview_phase="approach_discussion",
            evaluation_criteria=["algorithm_design", "pattern_recognition"],
            priority=7
        ))

        return chunks

    def _chunk_transcript(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk transcript documents"""
        chunks = []
        conversation = content.get("conversation", [])

        # Group exchanges into chunks of 3-4 exchanges
        chunk_size = 3
        for i in range(0, len(conversation), chunk_size):
            exchange_group = conversation[i:i + chunk_size]

            exchange_content = ""
            for exchange in exchange_group:
                exchange_content += f"{exchange['speaker']}: {exchange['message']}\n\n"

            chunks.append(DocumentChunk(
                id=f"{metadata['id']}_exchange_{i//chunk_size}",
                content=exchange_content.strip(),
                document_type="transcript",
                chunk_type="exchange",
                topic=metadata.get("topic", ""),
                difficulty=metadata.get("difficulty", ""),
                pattern=metadata.get("pattern", ""),
                tags=metadata.get("tags", []),
                complexity={},
                interview_phase=metadata.get("interview_phase", ""),
                speaker_role="both",
                interaction_type="conversation",
                candidate_level=content.get("session_info", {}).get("candidate_level", ""),
                evaluation_criteria=metadata.get("evaluation_criteria", []),
                priority=6
            ))

        return chunks

    def _format_examples(self, examples: list[dict]) -> str:
        """Format examples for display"""
        formatted = []
        for i, example in enumerate(examples, 1):
            formatted.append(f"Example {i}:")
            formatted.append(f"Input: {example.get('input', '')}")
            formatted.append(f"Output: {example.get('output', '')}")
            if 'explanation' in example:
                formatted.append(f"Explanation: {example['explanation']}")
            formatted.append("")
        return "\n".join(formatted)

    def _chunk_rubric(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk rubric documents"""
        # Implementation for rubric chunking
        return []

    def _chunk_feedback(self, metadata: dict, content: dict) -> list[DocumentChunk]:
        """Chunk feedback documents"""
        # Implementation for feedback chunking
        return []

class EmbeddingGenerator:
    """Handles embedding generation for document chunks"""

    def __init__(self, model_name: str = "text-embedding-3-large"):
        self.model_name = model_name
        self.client = openai.OpenAI()  # Assumes API key is set in environment

    def generate_embeddings(self, chunks: list[DocumentChunk]) -> list[tuple[DocumentChunk, np.ndarray]]:
        """Generate embeddings for all chunks"""
        embedded_chunks = []

        # Process in batches for efficiency
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            batch_texts = [chunk.content for chunk in batch]

            try:
                response = self.client.embeddings.create(
                    input=batch_texts,
                    model=self.model_name
                )

                for chunk, embedding_data in zip(batch, response.data):
                    embedding = np.array(embedding_data.embedding)
                    embedded_chunks.append((chunk, embedding))

            except Exception as e:
                logging.error(f"Error generating embeddings for batch {i}: {e}")

        return embedded_chunks

class VectorStore:
    """Main vector store implementation using ChromaDB"""

    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name="dsa_interviewer",
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(self, embedded_chunks: list[tuple[DocumentChunk, np.ndarray]]):
        """Add embedded chunks to the vector store"""
        ids = []
        embeddings = []
        metadatas = []
        documents = []

        for chunk, embedding in embedded_chunks:
            ids.append(chunk.id)
            embeddings.append(embedding.tolist())
            documents.append(chunk.content)

            # Convert chunk to metadata dict
            metadata = asdict(chunk)
            del metadata['content']  # Don't duplicate content in metadata
            del metadata['id']       # ID is stored separately
            metadatas.append(metadata)

        # Add to collection in batches
        batch_size = 1000
        for i in range(0, len(ids), batch_size):
            end_idx = min(i + batch_size, len(ids))

            self.collection.add(
                ids=ids[i:end_idx],
                embeddings=embeddings[i:end_idx],
                metadatas=metadatas[i:end_idx],
                documents=documents[i:end_idx]
            )

    def search(self,
               query: str,
               n_results: int = 10,
               filters: Optional[dict] = None,
               interview_phase: Optional[str] = None,
               candidate_level: Optional[str] = None) -> list[dict]:
        """Search for relevant chunks"""

        # Build filter conditions
        where_conditions = {}
        if filters:
            where_conditions.update(filters)
        if interview_phase:
            where_conditions["interview_phase"] = interview_phase
        if candidate_level:
            where_conditions["candidate_level"] = candidate_level

        # Generate query embedding
        embedding_gen = EmbeddingGenerator()
        query_embedding = embedding_gen.client.embeddings.create(
            input=[query],
            model=embedding_gen.model_name
        ).data[0].embedding

        # Search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_conditions if where_conditions else None
        )

        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i]
            })

        return formatted_results

class RAGRetriever:
    """High-level retrieval interface implementing the retrieval logic"""

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.retrieval_config = self._load_retrieval_config()

    def _load_retrieval_config(self) -> dict:
        """Load retrieval logic configuration"""
        config_path = Path("rag_data/metadata/retrieval_logic.json")
        if config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        return {}

    def retrieve_for_interview_context(self,
                                     user_message: str,
                                     conversation_history: list[dict],
                                     current_problem: Optional[dict] = None,
                                     candidate_level: str = "mid",
                                     interview_phase: str = "approach_discussion") -> dict:
        """Main retrieval method implementing the multi-stage pipeline"""

        # Stage 1: Context Classification
        context = self._classify_context(user_message, conversation_history, interview_phase)

        # Stage 2: Primary Retrieval
        primary_results = self._primary_retrieval(user_message, context, candidate_level)

        # Stage 3: Behavioral Retrieval
        behavioral_results = self._behavioral_retrieval(context, candidate_level)

        # Stage 4: Cross-reference Enrichment
        enriched_results = self._enrich_results(primary_results, behavioral_results)

        # Stage 5: Ranking and Selection
        final_context = self._rank_and_select(enriched_results, context)

        return final_context

    def _classify_context(self, user_message: str, conversation_history: list[dict], interview_phase: str) -> dict:
        """Classify the current interview context"""
        # Simplified context classification
        return {
            "interview_phase": interview_phase,
            "intent": self._classify_intent(user_message),
            "candidate_state": self._assess_candidate_state(conversation_history)
        }

    def _classify_intent(self, message: str) -> str:
        """Classify user intent from message"""
        message_lower = message.lower()

        if any(word in message_lower for word in ["how", "what", "why", "?"]):
            return "asking_question"
        elif any(word in message_lower for word in ["think", "approach", "solution"]):
            return "providing_solution"
        elif any(word in message_lower for word in ["confused", "unclear", "don't understand"]):
            return "showing_confusion"
        else:
            return "general_response"

    def _assess_candidate_state(self, conversation_history: list[dict]) -> str:
        """Assess candidate's current state from conversation history"""
        # Simplified assessment - in production would be more sophisticated
        if len(conversation_history) < 3:
            return "starting"

        recent_messages = conversation_history[-3:]

        # Look for indicators of struggle or success
        struggle_indicators = ["stuck", "confused", "don't know", "not sure"]
        success_indicators = ["got it", "understand", "makes sense", "solution"]

        struggle_count = sum(1 for msg in recent_messages
                           if any(indicator in msg.get('content', '').lower()
                                for indicator in struggle_indicators))

        success_count = sum(1 for msg in recent_messages
                          if any(indicator in msg.get('content', '').lower()
                               for indicator in success_indicators))

        if struggle_count > success_count:
            return "struggling"
        elif success_count > struggle_count:
            return "progressing_well"
        else:
            return "neutral"

    def _primary_retrieval(self, query: str, context: dict, candidate_level: str) -> list[dict]:
        """Perform primary semantic retrieval"""
        # Determine document types based on interview phase
        phase_filters = {
            "problem_introduction": {"document_type": {"$in": ["question", "concept"]}},
            "clarification": {"document_type": {"$in": ["question", "transcript"]}},
            "approach_discussion": {"document_type": {"$in": ["concept", "solution", "transcript"]}},
            "implementation": {"document_type": {"$in": ["solution", "transcript"]}},
            "optimization": {"document_type": {"$in": ["solution", "concept"]}},
            "evaluation": {"document_type": {"$in": ["rubric", "feedback", "transcript"]}}
        }

        filters = phase_filters.get(context["interview_phase"], {})

        return self.vector_store.search(
            query=query,
            n_results=20,
            filters=filters,
            interview_phase=context["interview_phase"],
            candidate_level=candidate_level
        )

    def _behavioral_retrieval(self, context: dict, candidate_level: str) -> list[dict]:
        """Retrieve behavioral and conversation patterns"""
        behavioral_query = f"interviewer response {context['candidate_state']} {context['interview_phase']}"

        return self.vector_store.search(
            query=behavioral_query,
            n_results=10,
            filters={"document_type": {"$in": ["transcript", "feedback", "interviewer_style"]}}
        )

    def _enrich_results(self, primary_results: list[dict], behavioral_results: list[dict]) -> list[dict]:
        """Enrich results with cross-references and related content"""
        # Combine and deduplicate results
        all_results = primary_results + behavioral_results
        seen_ids = set()
        enriched = []

        for result in all_results:
            if result['id'] not in seen_ids:
                enriched.append(result)
                seen_ids.add(result['id'])

        return enriched

    def _rank_and_select(self, results: list[dict], context: dict) -> dict:
        """Rank results and select final context"""
        # Implement ranking based on multiple factors
        for result in results:
            score = self._calculate_relevance_score(result, context)
            result['final_score'] = score

        # Sort by score and select top results
        results.sort(key=lambda x: x['final_score'], reverse=True)

        # Organize into context categories
        return {
            "primary_knowledge": results[:8],
            "behavioral_guidance": [r for r in results if r['metadata'].get('document_type') in ['transcript', 'feedback']][:5],
            "supporting_context": results[8:15],
            "context_summary": self._generate_context_summary(results[:15])
        }

    def _calculate_relevance_score(self, result: dict, context: dict) -> float:
        """Calculate relevance score for ranking"""
        base_score = 1.0 - result['distance']  # Convert distance to similarity

        # Boost based on interview phase match
        if result['metadata'].get('interview_phase') == context['interview_phase']:
            base_score *= 1.2

        # Boost based on priority
        priority = result['metadata'].get('priority', 5)
        base_score *= (priority / 10.0)

        # Boost based on document type relevance
        relevant_types = {
            "problem_introduction": ["question"],
            "approach_discussion": ["concept", "solution"],
            "implementation": ["solution"],
            "evaluation": ["rubric", "feedback"]
        }

        if result['metadata'].get('document_type') in relevant_types.get(context['interview_phase'], []):
            base_score *= 1.1

        return base_score

    def _generate_context_summary(self, results: list[dict]) -> str:
        """Generate a summary of the retrieved context"""
        topics = set()
        patterns = set()
        phases = set()

        for result in results:
            metadata = result['metadata']
            if metadata.get('topic'):
                topics.add(metadata['topic'])
            if metadata.get('pattern'):
                patterns.add(metadata['pattern'])
            if metadata.get('interview_phase'):
                phases.add(metadata['interview_phase'])

        summary = f"Retrieved context covers topics: {', '.join(topics)}, "
        summary += f"patterns: {', '.join(patterns)}, "
        summary += f"interview phases: {', '.join(phases)}"

        return summary

def main():
    """Main function to build and populate the vector store"""
    logging.basicConfig(level=logging.INFO)

    # Initialize components
    processor = DocumentProcessor()
    embedding_gen = EmbeddingGenerator()
    vector_store = VectorStore()

    # Load and process documents
    print("Loading documents...")
    chunks = processor.load_all_documents()
    print(f"Loaded {len(chunks)} document chunks")

    # Generate embeddings
    print("Generating embeddings...")
    embedded_chunks = embedding_gen.generate_embeddings(chunks)
    print(f"Generated embeddings for {len(embedded_chunks)} chunks")

    # Add to vector store
    print("Adding to vector store...")
    vector_store.add_documents(embedded_chunks)
    print("Vector store populated successfully!")

    # Test retrieval
    retriever = RAGRetriever(vector_store)
    test_query = "How do I solve the two sum problem?"
    results = retriever.retrieve_for_interview_context(
        user_message=test_query,
        conversation_history=[],
        interview_phase="approach_discussion"
    )

    print(f"\nTest retrieval for: '{test_query}'")
    print(f"Retrieved {len(results['primary_knowledge'])} primary results")
    print(f"Context summary: {results['context_summary']}")

if __name__ == "__main__":
    main()
