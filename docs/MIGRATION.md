# Migration Guide

## Migrating from Old Structure to New Structure

This guide helps you migrate from the old project structure to the new professional structure.

## What Changed

### Directory Structure

**Old Structure:**
```
DSA-Interviewer-Bot/
├── backend/app/          → src/dsa_interviewer/
├── rag_data/             → data/knowledge_base/
├── chromadb/             → data/vector_store/
├── labelled_transcript/  → data/training_data/
└── scripts/              → scripts/ (updated)
```

**New Structure:**
```
DSA-Interviewer-Bot/
├── src/dsa_interviewer/  # Main application package
├── data/                 # All data files
├── tests/                # Test suite
├── scripts/              # CLI tools
├── docs/                 # Documentation
└── docker/               # Docker configs
```

### Import Changes

**Old imports:**
```python
from app.config import settings
from app.services.groq_llm import GroqLLM
from app.services.rag_service import RagService
```

**New imports:**
```python
from dsa_interviewer.core.config import settings
from dsa_interviewer.services.groq_llm import GroqLLM
from dsa_interviewer.services.rag_service import RagService
```

### Configuration Changes

**Old `.env`:**
```bash
GROQ_API_KEY=xxx
CHROMA_PATH=chromadb
```

**New `.env`:**
```bash
GROQ_API_KEY=xxx
# Paths are auto-configured, but can be overridden:
# CHROMA_PATH=data/vector_store
# KNOWLEDGE_BASE_PATH=data/knowledge_base
```

## Migration Steps

### 1. Backup Your Data

```bash
# Backup your current setup
cp -r chromadb chromadb.backup
cp -r rag_data rag_data.backup
cp .env .env.backup
```

### 2. Update Dependencies

```bash
# Install new dependencies
pip install -r requirements.txt
pip install -e ".[dev]"
```

### 3. Rebuild Vector Store

The vector store path has changed, so you need to rebuild it:

```bash
# Run the new indexing script
python scripts/embed_and_index.py
```

This will create the vector store at `data/vector_store/`.

### 4. Update Environment Variables

```bash
# Copy the new template
cp .env.example .env

# Add your GROQ_API_KEY
# Other paths are auto-configured
```

### 5. Test the Migration

```bash
# Run tests
make test

# Start the server
make run

# Test the API
curl http://localhost:8000/health
```

### 6. Update Custom Scripts

If you have custom scripts that import from the old structure, update them:

**Before:**
```python
from app.services.groq_llm import GroqLLM
```

**After:**
```python
from dsa_interviewer.services.groq_llm import GroqLLM
```

## Breaking Changes

### 1. Module Paths
- All imports now use `dsa_interviewer` package
- No more `app` or `backend` in import paths

### 2. Data Paths
- `rag_data/` → `data/knowledge_base/`
- `chromadb/` → `data/vector_store/`
- Paths are now configurable via environment variables

### 3. Configuration
- `config.py` moved to `core/config.py`
- Added many new configuration options
- Paths are auto-configured based on project root

### 4. Scripts
- Scripts now use the main package imports
- Updated to use new configuration system
- Better error handling and logging

## Rollback Plan

If you need to rollback:

```bash
# Restore backups
rm -rf chromadb data/vector_store
mv chromadb.backup chromadb
mv rag_data.backup rag_data
mv .env.backup .env

# Reinstall old dependencies (if needed)
git checkout HEAD~1 requirements.txt
pip install -r requirements.txt
```

## Common Issues

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solution:** Update imports to use `dsa_interviewer` package:
```python
from dsa_interviewer.services.groq_llm import GroqLLM
```

### Vector Store Not Found

**Problem:** `ChromaDB collection not found`

**Solution:** Rebuild the vector store:
```bash
python scripts/embed_and_index.py
```

### Path Issues

**Problem:** Files not found in expected locations

**Solution:** Check that paths in `.env` are correct, or let them auto-configure:
```bash
# Remove custom paths from .env to use defaults
# CHROMA_PATH and KNOWLEDGE_BASE_PATH will auto-configure
```

## Getting Help

If you encounter issues during migration:

1. Check the [Setup Guide](SETUP.md)
2. Review the [Contributing Guide](CONTRIBUTING.md)
3. Open an issue on GitHub with:
   - Error messages
   - Your environment (OS, Python version)
   - Steps to reproduce

## Post-Migration Checklist

- [ ] Dependencies installed
- [ ] Vector store rebuilt
- [ ] Environment variables configured
- [ ] Tests passing
- [ ] API server starts successfully
- [ ] Health endpoint responds
- [ ] Interview endpoints work
- [ ] CLI tool works
- [ ] Custom scripts updated (if any)