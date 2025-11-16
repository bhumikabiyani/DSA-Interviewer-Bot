# API Flow Documentation

## Overview
The DSA Interviewer Bot now supports 3 distinct flows:

1. **Background Understanding Flow** - Gather candidate information
2. **Interview Introduction Flow** - Transition to technical questions
3. **RAG + GROQ Question Flow** - Interactive DSA problem solving

---

## Flow 1: Background Understanding

### Purpose
Understand the candidate's background before diving into technical questions.

### Endpoint: `POST /api/start_background`

**Request:**
```json
{}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "message": "Hello! Welcome to your DSA mock interview..."
}
```

### Endpoint: `POST /api/background_chat`

**Request:**
```json
{
  "session_id": "uuid-from-start-background",
  "message": "I'm a CS student with 2 years of Python experience"
}
```

**Response:**
```json
{
  "response": "Great! What areas of DSA are you most comfortable with?..."
}
```

**Key Features:**
- Asks 3-5 conversational questions
- Gathers: education, experience, DSA knowledge, goals
- Uses dedicated `BACKGROUND_SYSTEM_PROMPT`
- Session phase: `background`

---

## Flow 2: Interview Introduction

### Purpose
Transition from background to technical interview with proper introduction.

### Endpoint: `POST /api/start_interview`

**Request:**
```json
{
  "session_id": "uuid-from-background-session"
}
```

**Response:**
```json
{
  "session_id": "same-uuid",
  "intro": "Hello! I'm your DSA mock interviewer today..."
}
```

**Requirements:**
- Must have completed background phase first
- Picks random DSA question from knowledge base
- Transitions session phase from `background` → `introduction`
- Preserves background conversation history

---

## Flow 3: RAG + GROQ Interactive Interview

### Purpose
Conduct the actual technical interview with RAG-enhanced responses.

### Endpoint: `POST /api/interact`

**Request:**
```json
{
  "session_id": "uuid-from-start-interview",
  "message": "I think I should use a hash map for this problem"
}
```

**Response:**
```json
{
  "response": "Good thinking! Can you explain why a hash map would be efficient here?..."
}
```

**Key Features:**
- **Phase 1 (Introduction)**: Presents the DSA question with RAG context
- **Phase 2 (Interview)**: Interactive Q&A with:
  - Full conversation history
  - RAG retrieval for relevant context
  - Groq LLM for natural responses
  - Never reveals full solutions
  - Focuses on reasoning and edge cases

**Special Commands:**
- `"babi"` - End interview session

---

## Complete Flow Example

### Step 1: Start Background Session
```bash
curl -X POST http://localhost:8000/api/start_background
```

Response:
```json
{
  "session_id": "abc-123",
  "message": "Hello! Welcome to your DSA mock interview. Could you start by telling me about your educational background?"
}
```

### Step 2: Background Conversation
```bash
curl -X POST http://localhost:8000/api/background_chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "message": "I am a final year CS student"
  }'
```

Response:
```json
{
  "response": "Great! What programming languages are you most comfortable with?"
}
```

### Step 3: Transition to Interview
```bash
curl -X POST http://localhost:8000/api/start_interview \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123"
  }'
```

Response:
```json
{
  "session_id": "abc-123",
  "intro": "Hello! I'm your DSA mock interviewer today. Are you ready to begin?"
}
```

### Step 4: Confirm Ready
```bash
curl -X POST http://localhost:8000/api/interact \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "message": "Yes, I am ready"
  }'
```

Response:
```json
{
  "response": "Here is your interview question:\n\nTwo Sum Problem...\n\nBefore we begin, could you walk me through your initial understanding?"
}
```

### Step 5: Interactive Problem Solving
```bash
curl -X POST http://localhost:8000/api/interact \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "message": "I would use a hash map to store complements"
  }'
```

Response:
```json
{
  "response": "Excellent approach! Can you explain the time complexity of this solution?"
}
```

---

## Session State Management

### Session Phases
1. `background` - Initial background gathering
2. `introduction` - Interview intro (after transition)
3. `interview` - Active problem solving

### Session Data Structure
```python
{
  "question": str | None,           # DSA question (None during background)
  "history": List[Dict],            # Full conversation history
  "phase": str,                     # Current phase
  "background_summary": str | None  # Optional summary (future use)
}
```

### Phase Transitions
```
background → introduction → interview
    ↓            ↓             ↓
start_background → start_interview → interact
```

---

## Error Handling

### Common Errors

**404 - Session Not Found**
```json
{
  "detail": "Session not found"
}
```

**400 - Invalid Phase**
```json
{
  "detail": "Must complete background phase first"
}
```

**500 - No Questions Available**
```json
{
  "detail": "No questions available in knowledge base"
}
```

---

## Implementation Details

### New Components

1. **Background System Prompt** (`BACKGROUND_SYSTEM_PROMPT`)
   - Friendly, conversational tone
   - Gathers 5 key areas of information
   - Summarizes profile before transition

2. **Session Store Methods**
   - `create_background_session()` - Initialize background phase
   - `transition_to_interview()` - Move to interview phase
   - Preserves full conversation history

3. **API Endpoints**
   - `/api/start_background` - Begin background flow
   - `/api/background_chat` - Background conversation
   - `/api/start_interview` - Transition to interview (modified)
   - `/api/interact` - Technical interview (existing)

---

## Testing Recommendations

1. **Background Flow**
   - Test session creation
   - Verify conversational responses
   - Check history preservation

2. **Transition Flow**
   - Test phase validation
   - Verify question assignment
   - Check session state updates

3. **Interview Flow**
   - Test RAG retrieval
   - Verify context inclusion
   - Check multi-turn conversations

4. **Error Cases**
   - Invalid session IDs
   - Wrong phase transitions
   - Missing questions in knowledge base