import chromadb

class RagService:
    def __init__(self):
        # Use new client initialization
        self.client = chromadb.PersistentClient(path="chromadb")
        self.collection = self.client.get_or_create_collection("dsa_questions")

    def retrieve(self, query, n=5):
        results = self.collection.query(
            query_texts=[query],
            n_results=n
        )
        return results["documents"][0]
