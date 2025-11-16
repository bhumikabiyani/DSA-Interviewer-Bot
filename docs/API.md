# API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### Start Interview
```http
POST /api/start_interview
```

Starts a new interview session with a randomly selected DSA question.

**Response:**
```json
{
  "session_id": "uuid-string",
  "question": {
    "id": "easy_arrays_001",
    "title": "Two Sum",
    "difficulty": "easy",
    "topic": "arrays",
    "description": "Given an array of integers..."
  },
  "response": "Hello! Let's begin with this problem..."
}
```

---

### Interact
```http
POST /api/interact
```

Send a message in an ongoing interview session.

**Request Body:**
```json
{
  "session_id": "uuid-string",
  "message": "I would use a hash map to solve this"
}
```

**Response:**
```json
{
  "response": "Great approach! Can you explain the time complexity?"
}
```

---

## Interactive API Documentation

Visit http://localhost:8000/docs for Swagger UI with interactive API testing.

## Example Usage

### Python
```python
import requests

# Start interview
response = requests.post("http://localhost:8000/api/start_interview")
data = response.json()
session_id = data["session_id"]

# Interact
response = requests.post(
    "http://localhost:8000/api/interact",
    json={
        "session_id": session_id,
        "message": "I would use two pointers"
    }
)
print(response.json()["response"])
```

### cURL
```bash
# Start interview
curl -X POST http://localhost:8000/api/start_interview

# Interact
curl -X POST http://localhost:8000/api/interact \
  -H "Content-Type: application/json" \
  -d '{"session_id":"your-session-id","message":"I would use a hash map"}'
```

### JavaScript
```javascript
// Start interview
const startResponse = await fetch('http://localhost:8000/api/start_interview', {
  method: 'POST'
});
const { session_id } = await startResponse.json();

// Interact
const interactResponse = await fetch('http://localhost:8000/api/interact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: session_id,
    message: 'I would use a hash map'
  })
});
const data = await interactResponse.json();
console.log(data.response);
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request format"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is enforced. In production, consider implementing rate limiting based on IP or API key.

## Authentication

Currently no authentication required. For production deployment, implement API key authentication or OAuth2.