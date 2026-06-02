.PHONY: help install dev test lint format typecheck clean db-init db-migrate run docker-build docker-up docker-down

help:
	@echo "API-Market v5.0"
	@echo ""
	@echo "Usage:"
	@echo "  make install      Install production dependencies"
	@echo "  make dev          Install all dev dependencies"
	@echo "  make run          Start development server"
	@echo "  make test         Run test suite"
	@echo "  make lint         Run ruff lint"
	@echo "  make format       Run ruff format"
	@echo "  make typecheck    Run mypy type checking"
	@echo "  make db-init      Initialize SQLite database from JSON"
	@echo "  make db-reset     Reset database and re-import"
	@echo "  make docker-build Build Docker image"
	@echo "  make docker-up    Start Docker Compose"
	@echo "  make docker-down  Stop Docker Compose"
	@echo "  make clean        Remove build artifacts"
	@echo "  make all          Run lint + typecheck + test"

install:
	pip install -e .

dev:
	pip install -e ".[dev,pipeline]"

run:
	PYTHONPATH=backend uvicorn api_market.main:app --host 0.0.0.0 --port 8080 --reload

test:
	cd backend && python -m pytest tests/ -v

lint:
	ruff check backend/ pipeline/ scripts/

format:
	ruff format backend/ pipeline/ scripts/

typecheck:
	mypy backend/api_market/

db-init:
	PYTHONPATH=backend python scripts/migrate_to_sqlite.py

db-reset:
	rm -f data/api_market.db
	PYTHONPATH=backend python scripts/migrate_to_sqlite.py

docker-build:
	docker build -t api-market:latest -f Dockerfile .
	docker build -t api-market-frontend:latest -f frontend.Dockerfile .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf __pycache__ .pytest_cache .mypy_cache .ruff_cache
	rm -rf backend/**/__pycache__
	rm -rf htmlcov .coverage
	find . -name "*.pyc" -delete

all: lint typecheck test