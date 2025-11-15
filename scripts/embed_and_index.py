# scripts/embed_and_index.py
import os, glob, uuid, json
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE_CHARS = 1500  # roughly 200-350 tokens depending on text
RAG_DATA_DIR = "rag_data"

def chunk_text(text, size=CHUNK_SIZE_CHARS):
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + size)
        # try to break at newline for readability
        if end < len(text):
            nl = text.rfind("\n", start, end)
            if nl > start:
                end = nl
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]

def load_documents(base_dir):
    docs = []
    for path in glob.glob(base_dir + "/**/*", recursive=True):
        if os.path.isdir(path): continue
        if not path.lower().endswith((".md", ".txt", ".json")): continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        docs.append((path, text))
    return docs

def main():
    # model for embeddings
    embed_model = SentenceTransformer(MODEL_NAME)
    client = chromadb.PersistentClient(path="./chromadb")
    collection = client.get_or_create_collection(
    name="dsa_interviewer",
    metadata={"hnsw:space": "cosine"}  # recommended
)

    docs = load_documents(RAG_DATA_DIR)
    print(f"Found {len(docs)} files. Indexing...")

    for path, text in docs:
        chunks = chunk_text(text)
        metadatas = []
        documents = []
        ids = []
        for c in chunks:
            ids.append(str(uuid.uuid4()))
            documents.append(c)
            # metadata: derive from path
            meta = {
                "source": path,
                "file": os.path.basename(path),
                "path": path
            }
            metadatas.append(meta)

        embeddings = embed_model.encode(documents, show_progress_bar=True, convert_to_numpy=True)
        collection.add(documents=documents, embeddings=embeddings.tolist(), ids=ids, metadatas=metadatas)
        print(f"Indexed {len(chunks)} chunks from {path}")

    print("Indexing complete.")

if __name__ == "__main__":
    main()
