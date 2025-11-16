.PHONY: install test lint format clean run docker-build docker-up docker-down help

help:
	@echo "DSA Interviewer Bot - Available Commands"
	@echo "========================================"
	@echo "install       - Install dependencies"
	@echo "test          - Run tests with coverage"
	@echo "lint          - Run linting checks"
	@echo "format        - Format code with black"
	@echo "clean         - Remove build artifacts"
	@echo "run           - Run development server"
	@echo "docker-build  - Build Docker image"
	@echo "docker-up     - Start Docker containers"
	@echo "docker-down   - Stop Docker containers"

install:
	pip install -r requirements.txt
	pip install -e ".[dev]"

test:
	pytest tests/ -v --cov=src/dsa_interviewer --cov-report=html --cov-report=term

lint:
	ruff check src/ tests/
	black --check src/ tests/
	mypy src/

format:
	black src/ tests/
	ruff check --fix src/ tests/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache .coverage htmlcov/ dist/ build/

run:
	uvicorn dsa_interviewer.main:app --reload --host 0.0.0.0 --port 8000

docker-build:
	docker build -t dsa-interviewer:latest .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

setup-env:
	cp .env.example .env
	@echo "Please edit .env and add your GROQ_API_KEY"

init-db:
	python scripts/embed_and_index.py