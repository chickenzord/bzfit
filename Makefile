.PHONY: help install dev dev-server dev-client build clean test prisma-generate prisma-migrate prisma-studio docker-build docker-run

# Default target
help:
	@echo "BzFit Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install all dependencies"
	@echo "  make setup            - Full setup (install + prisma generate)"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Run both frontend and backend (concurrently)"
	@echo "  make dev-server       - Run backend only (port 3001)"
	@echo "  make dev-client       - Run frontend only (port 5173)"
	@echo ""
	@echo "Database:"
	@echo "  make prisma-generate  - Generate Prisma client"
	@echo "  make prisma-migrate   - Create and apply migration"
	@echo "  make prisma-studio    - Open Prisma Studio"
	@echo "  make prisma-reset     - Reset database (WARNING: deletes data)"
	@echo ""
	@echo "Build:"
	@echo "  make build            - Build both client and server"
	@echo "  make build-client     - Build frontend only"
	@echo "  make build-server     - Build backend only"
	@echo ""
	@echo "Production:"
	@echo "  make start            - Run production build"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-run       - Run Docker container"
	@echo ""
	@echo "Maintenance:"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run linter"
	@echo "  make format           - Format code"
	@echo "  make clean            - Remove build artifacts"
	@echo ""

# Setup
install:
	npm install

setup: install prisma-generate
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Development
dev:
	npm run dev

dev-server:
	npm run dev:server

dev-client:
	npm run dev:client

# Database
prisma-generate:
	npx prisma generate

prisma-migrate:
	npx prisma migrate dev

prisma-studio:
	npx prisma studio

prisma-reset:
	npx prisma migrate reset

prisma-deploy:
	npx prisma migrate deploy

# Build
build:
	npm run build

build-client:
	npm run build:client

build-server:
	npm run build:server

# Production
start:
	npm run start:prod

# Docker
docker-build:
	docker build -t bzfit:latest .

docker-run:
	docker run -p 3000:3000 -v $$(pwd)/data:/app/data bzfit:latest

# Testing & Quality
test:
	npm test

test-watch:
	npm run test:watch

lint:
	npm run lint

format:
	npm run format

# Maintenance
clean:
	rm -rf node_modules dist .next .turbo coverage
	find . -name "*.log" -type f -delete

clean-all: clean
	rm -rf dev.db dev.db-journal
