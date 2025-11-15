# scripts/retriever.py
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

class RagRetriever:
    def __init__(self, collection_name="dsa_interviewer"):
        self.embed_model = SentenceTransformer(MODEL_NAME)
        self.client = chromadb.PersistentClient(path="./chromadb")
        self.collection = self.client.get_collection(collection_name)


    def retrieve(self, query, n_results=5):
        vec = self.embed_model.encode([query], convert_to_numpy=True)[0].tolist()
        res = self.collection.query(query_embeddings=[vec], n_results=n_results, include=["documents","metadatas","distances"])
        docs = []
        for d, m, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            docs.append({"text": d, "meta": m, "dist": dist})
            
        return docs
