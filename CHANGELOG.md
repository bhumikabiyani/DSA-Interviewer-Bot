# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added - Major Restructuring

#### Project Structure
- **NEW**: Professional package structure under `src/dsa_interviewer/`
- **NEW**: Organized data directory (`data/knowledge_base/`, `data/vector_store/`)
- **NEW**: Comprehensive test suite (`tests/unit/`, `tests/integration/`, `tests/e2e/`)
- **NEW**: Documentation directory with multiple guides
- **NEW**: Docker configuration with docker-compose setup

#### Dependency Management
- **NEW**: `requirements.txt` with pinned versions
- **NEW**: `pyproject.toml` for modern Python packaging
- **NEW**: `setup.py` for package installation
- **NEW**: Development dependencies separated

#### Configuration
- **NEW**: Enhanced configuration system in `core/config.py`
- **NEW**: `.env.example` template
- **NEW**: Auto-configured paths based on project root
- **NEW**: Support for Redis, logging, and LLM parameters

#### Services
- **IMPROVED**: `GroqLLM` service with retry logic and better error handling
- **IMPROVED**: `RagService` with metadata support and logging
- **IMPROVED**: Session management with conversation history

#### API
- **IMPROVED**: FastAPI app with CORS middleware
- **NEW**: Health check endpoint
- **NEW**: Root endpoint with API info
- **IMPROVED**: Better error handling and logging

#### Testing
- **NEW**: Unit tests for configuration and services
- **NEW**: Integration tests for API endpoints
- **NEW**: Test fixtures and mocking
- **NEW**: Coverage reporting

#### CI/CD
- **NEW**: GitHub Actions workflow
- **NEW**: Automated testing on push/PR
- **NEW**: Multi-Python version testing (3.9, 3.10, 3.11)
- **NEW**: Docker image building

#### Documentation
- **NEW**: `docs/SETUP.md` - Comprehensive setup guide
- **NEW**: `docs/API.md` - API documentation with examples
- **NEW**: `docs/CONTRIBUTING.md` - Contribution guidelines
- **NEW**: `docs/ARCHITECTURE.md` - System architecture details
- **NEW**: `docs/MIGRATION.md` - Migration guide from old structure
- **IMPROVED**: `README.md` - Updated with accurate information

#### Docker
- **NEW**: `Dockerfile` for containerization
- **NEW**: `docker-compose.yml` with API, Redis, and Nginx
- **NEW**: `docker/nginx.conf` for reverse proxy

#### Development Tools
- **NEW**: `Makefile` with common commands
- **NEW**: Black configuration for code formatting
- **NEW**: Ruff configuration for linting
- **NEW**: MyPy configuration for type checking

#### Scripts
- **IMPROVED**: `scripts/interview_cli.py` - Updated to use new package structure
- **IMPROVED**: `scripts/embed_and_index.py` - Better error handling and progress reporting
- **IMPROVED**: `scripts/question_selector.py` - Uses new configuration system

### Changed

#### Import Paths
- **BREAKING**: All imports now use `dsa_interviewer` package instead of `app`
- **BREAKING**: Configuration moved from `app.config` to `dsa_interviewer.core.config`

#### Directory Structure
- **BREAKING**: `backend/app/` → `src/dsa_interviewer/`
- **BREAKING**: `rag_data/` → `data/knowledge_base/`
- **BREAKING**: `chromadb/` → `data/vector_store/`
- **BREAKING**: `labelled_transcript/` → `data/training_data/`

#### Configuration
- **BREAKING**: `CHROMA_PATH` now defaults to `data/vector_store/`
- **NEW**: Many new configuration options added
- **IMPROVED**: Paths auto-configure based on project root

### Fixed
- Inconsistent import paths across modules
- Missing dependency management files
- Lack of proper error handling in services
- No logging configuration
- Missing test suite
- Documentation inaccuracies

### Removed
- **BREAKING**: Old `backend/app/` directory structure
- Duplicate logic between backend and scripts
- Unused or outdated configuration files

## [0.1.0] - 2024-XX-XX (Pre-restructure)

### Initial Implementation
- Basic FastAPI backend
- Groq LLM integration
- ChromaDB vector store
- RAG retrieval system
- CLI interview tool
- 15 DSA problems in knowledge base
- Interview transcripts for training

---

## Migration Notes

For users upgrading from pre-1.0.0 versions, please see [docs/MIGRATION.md](docs/MIGRATION.md) for detailed migration instructions.

### Quick Migration Steps
1. Backup your data
2. Install new dependencies: `pip install -r requirements.txt`
3. Update imports to use `dsa_interviewer` package
4. Rebuild vector store: `python scripts/embed_and_index.py`
5. Update `.env` file using `.env.example` as template
6. Run tests: `make test`

---

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/yourusername/DSA-Interviewer-Bot/tags).