#!/usr/bin/env python3
"""Build ChromaDB vector store from knowledge base."""

import os
import sys
import glob
import uuid
import json
from pathlib import Path
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings as ChromaSettings

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dsa_interviewer.core.config import settings

MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE_CHARS = 1500


def chunk_text(text: str, size: int = CHUNK_SIZE_CHARS) -> List[str]:
    """Split text into chunks at natural boundaries."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + size)
        if end < len(text):
            nl = text.rfind("\n", start, end)
            if nl > start:
                end = nl
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
    return chunks


def load_documents(base_dir: str) -> List[Tuple[str, str]]:
    """Load all documents from knowledge base directory."""
    docs = []
    for path in glob.glob(f"{base_dir}/**/*", recursive=True):
        if os.path.isdir(path):
            continue
        if not path.lower().endswith((".md", ".txt", ".json")):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
            docs.append((path, text))
        except Exception as e:
            print(f"Warning: Failed to load {path}: {e}")
    return docs


def main():
    print("=== Building ChromaDB Vector Store ===\n")
    
    knowledge_base_path = settings.KNOWLEDGE_BASE_PATH
    vector_store_path = settings.CHROMA_PATH
    
    print(f"Knowledge base: {knowledge_base_path}")
    print(f"Vector store: {vector_store_path}\n")
    
    if not os.path.exists(knowledge_base_path):
        print(f"Error: Knowledge base directory not found: {knowledge_base_path}")
        return 1
    
    os.makedirs(vector_store_path, exist_ok=True)
    
    print(f"Loading embedding model: {MODEL_NAME}...")
    embed_model = SentenceTransformer(MODEL_NAME)
    
    print("Initializing ChromaDB client...")
    client = chromadb.PersistentClient(
        path=vector_store_path,
        settings=ChromaSettings(anonymized_telemetry=False)
    )
    
    collection = client.get_or_create_collection(
        name="dsa_questions",
        metadata={"hnsw:space": "cosine"}
    )
    
    print(f"\nLoading documents from {knowledge_base_path}...")
    docs = load_documents(knowledge_base_path)
    print(f"Found {len(docs)} files\n")
    
    if not docs:
        print("Warning: No documents found to index!")
        return 1
    
    total_chunks = 0
    for path, text in docs:
        chunks = chunk_text(text)
        if not chunks:
            continue
            
        metadatas = []
        documents = []
        ids = []
        
        for chunk in chunks:
            ids.append(str(uuid.uuid4()))
            documents.append(chunk)
            metadatas.append({
                "source": path,
                "file": os.path.basename(path),
                "path": path
            })
        
        print(f"Embedding {len(chunks)} chunks from {os.path.basename(path)}...")
        embeddings = embed_model.encode(
            documents,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        
        collection.add(
            documents=documents,
            embeddings=embeddings.tolist(),
            ids=ids,
            metadatas=metadatas
        )
        
        total_chunks += len(chunks)
        print(f"  ✓ Indexed {len(chunks)} chunks")
    
    print(f"\n{'='*50}")
    print(f"Indexing complete!")
    print(f"Total documents: {len(docs)}")
    print(f"Total chunks: {total_chunks}")
    print(f"Collection: {collection.name}")
    print(f"Vector store: {vector_store_path}")
    print(f"{'='*50}\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())