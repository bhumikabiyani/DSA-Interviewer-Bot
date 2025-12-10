## Project High-Level Design: DSA Interviewer Bot

This document outlines the high-level architecture and key components of the DSA Interviewer Bot project, focusing on the frontend-backend interactions, API structure, and core technologies.

### 1. Overall Architecture

The project follows a client-server architecture, with a Next.js-based frontend interacting with a Python/FastAPI backend. The system is designed to facilitate dynamic programming (DSA) interview simulations, providing a conversational interface and code interaction.

```
+-------------------+      API Calls      +---------------------+
|     Frontend      |<------------------->|       Backend       |
| (Next.js/React)   |    (HTTP/JSON)      | (Python/FastAPI)    |
+-------------------+                     +---------------------+
  ^                                                 |
  |                                                 | Database
  |                                                 | (e.g., PostgreSQL, SQLite)
  |                                                 |
  +-------------------------------------------------+
```

### 2. Frontend (Next.js/React)

The frontend is built with Next.js and React, providing a modern and responsive user interface. Key aspects include:

*   **Technology Stack**: Next.js (React Framework), TypeScript, CSS (likely Tailwind CSS or similar for styling), and potentially other UI libraries.
*   **API Client**: The `frountend/lib/api.ts` file serves as the central API client, abstracting the HTTP calls to the backend.
*   **User Interface**: Components for displaying chat messages, code input areas, and interview controls. (`frountend/app/background/[session_id]/page.tsx`, `frountend/app/interview/[session_id]/page.tsx`, `frountend/components/CodeInputBox.tsx`).
*   **State Management**: Likely uses React's built-in state management (useState, useContext) or a dedicated library (e.g., Zustand, Redux) to manage application state across components.

#### Frontend API Calls:

The frontend interacts with the backend through a set of well-defined API endpoints. All calls are `POST` requests, transmit data as `application/json`, and include authentication headers.

Based on `frountend/lib/api.ts`, the following API calls are made:

1.  **`startBackground()`**:
    *   **Endpoint**: `/api/start_background`
    *   **Method**: `POST`
    *   **Purpose**: Initiates a background session, likely for pre-interview setup or initial conversational interaction.
    *   **Request Body**: None explicitly shown, but might send initial configuration.
    *   **Response**: `StartBackgroundResponse` (likely includes a `session_id`).

2.  **`sendBackgroundMessage(sessionId: string, message: string)`**:
    *   **Endpoint**: `/api/background_chat`
    *   **Method**: `POST`
    *   **Purpose**: Sends a message within the background session and receives a chat response.
    *   **Request Body**: `{ session_id: string, message: string }`
    *   **Response**: `BackgroundChatResponse` (likely includes the bot's response).

3.  **`startInterview(sessionId: string)`**:
    *   **Endpoint**: `/api/start_interview`
    *   **Method**: `POST`
    *   **Purpose**: Transitions from a background session to a formal interview session.
    *   **Request Body**: `{ session_id: string }`
    *   **Response**: `StartInterviewResponse` (likely includes initial interview questions or state).

4.  **`sendMessage(sessionId: string, message: string)`**:
    *   **Endpoint**: `/api/interact`
    *   **Method**: `POST`
    *   **Purpose**: Sends a message or code snippet during the active interview session and receives a response (e.g., feedback, next question).
    *   **Request Body**: `{ session_id: string, message: string }`
    *   **Response**: `InteractResponse` (likely includes the bot's feedback, updated state, or next prompt).

**Total Frontend API calls identified: 4 unique API calls.**

### 3. Backend (Python/FastAPI)

The backend is built with Python, leveraging the FastAPI framework for building robust and high-performance APIs.

*   **Technology Stack**: Python, FastAPI, likely a SQL database (e.g., PostgreSQL) with an ORM (e.g., SQLAlchemy, Alembic for migrations), and potentially other libraries for natural language processing (NLP) or large language model (LLM) interaction.
*   **API Framework**: FastAPI provides automatic API documentation (Swagger UI/ReDoc), data validation, and serialization.
*   **Core Logic**: This is where the DSA interviewing intelligence resides, including:
    *   **Session Management**: Tracking individual interview sessions and their state.
    *   **LLM Integration**: Interfacing with large language models (likely Groq based on `scripts/llm_groq.py`) for generating questions, providing feedback, and conversational capabilities.
    *   **RAG Service**: The presence of `src/ds-interviewer/services/rag_service.py` suggests a Retrieval-Augmented Generation (RAG) system, which likely fetches relevant DSA knowledge from a knowledge base (`data/knowledge_base/`) to inform the LLM's responses.
    *   **Database Interaction**: Storing user data, interview progress, feedback, and potentially the knowledge base. (`src/ds-interviewer/core/database.py`, `migrations/`).
    *   **Authentication/Authorization**: Handling user login, token generation, and securing API endpoints. (`src/ds-interviewer/api/auth.py`, `src/ds-interviewer/utils/jwt.py`, `src/ds-interviewer/utils/security.py`, `src/ds-interviewer/models/auth.py`, `src/ds-interviewer/models/user.py`).
*   **API Endpoints**: The backend would expose the corresponding endpoints consumed by the frontend. Based on the frontend calls, we can infer the existence of:
    *   `/api/start_background` (POST)
    *   `/api/background_chat` (POST)
    *   `/api/start_interview` (POST)
    *   `/api/interact` (POST)

    Additionally, given the presence of `src/ds-interviewer/api/auth.py`, there would be API endpoints related to user authentication, such as:
    *   `/api/auth/register` (POST) - *Inferred*
    *   `/api/auth/login` (POST) - *Inferred*
    *   `/api/auth/me` (GET) - *Inferred, for fetching user details*

**Total Backend APIs**: Based on the frontend and inferred authentication, there are likely **6-7+ API endpoints**.

### 4. Important Components and Technologies

*   **FastAPI**: High-performance Python web framework for building APIs.
*   **Next.js/React**: Frontend framework for building user interfaces.
*   **Database**: Likely a relational database (e.g., PostgreSQL, SQLite) managed with SQLAlchemy and Alembic for migrations.
*   **LLM (Groq)**: Integration with a large language model for conversational AI and content generation.
*   **RAG System**: Retrieval-Augmented Generation for grounding LLM responses with a knowledge base.
*   **JWT (JSON Web Tokens)**: Used for secure authentication and authorization.
*   **Docker/Docker Compose**: Used for containerization and orchestration of the application, as indicated by `Dockerfile`, `docker-compose.yml`, and `docker/nginx.conf`.
*   **Knowledge Base**: Stored in `data/knowledge_base/`, likely consisting of JSON files containing DSA concepts, feedback templates, and real interview data.
*   **Scripts**:
    *   `scripts/embed_and_index.py`: For processing the knowledge base and creating embeddings for the RAG system.
    *   `scripts/prompts.py`: Defines prompts used for the LLM.
    *   `scripts/interview_cli.py`: A command-line interface for interacting with the interviewer bot.
    *   `scripts/question_selector.py`, `scripts/retriever.py`: Components of the RAG system and interview flow.

---

This document provides a high-level overview. For more detailed information, further investigation into specific files (especially the backend API and service implementations) would be necessary.