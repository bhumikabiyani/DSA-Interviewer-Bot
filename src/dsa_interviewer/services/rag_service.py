import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings

from dsa_interviewer.core.config import settings

logger = logging.getLogger(__name__)

class RagService:
    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PATH,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self.collection = self.client.get_or_create_collection("dsa_questions")
            logger.info(f"RAG service initialized with {self.collection.count()} documents")
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            raise

    def retrieve(self, query: str, n: int = None) -> List[str]:
        if n is None:
            n = settings.RAG_TOP_K
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n
            )
            documents = results["documents"][0] if results["documents"] else []
            logger.debug(f"Retrieved {len(documents)} documents for query: {query[:50]}...")
            return documents
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return []
    
    def retrieve_with_metadata(self, query: str, n: int = None) -> List[Dict[str, Any]]:
        if n is None:
            n = settings.RAG_TOP_K
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n
            )
            
            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            
            return [
                {
                    "document": doc,
                    "metadata": meta,
                    "distance": dist
                }
                for doc, meta, dist in zip(documents, metadatas, distances)
            ]
        except Exception as e:
            logger.error(f"RAG retrieval with metadata failed: {e}")
            return []
