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
	pnpm install

setup: install prisma-generate
	@echo "Setup complete! Run 'make dev' to start development."

# Development
dev:
	pnpm run dev

dev-server:
	pnpm run dev:server

dev-client:
	pnpm run dev:client

# Database
prisma-generate:
	pnpm prisma generate

prisma-migrate:
	pnpm prisma migrate dev

prisma-studio:
	pnpm prisma studio

prisma-reset:
	pnpm prisma migrate reset

prisma-deploy:
	pnpm prisma migrate deploy

# Build
build:
	pnpm run build

build-client:
	pnpm run build:client

build-server:
	pnpm run build:server

# Production
start:
	pnpm run start:prod

# Docker
docker-build:
	docker build -t bzfit:latest .

docker-run:
	docker run -p 3000:3000 -v $$(pwd)/data:/app/data bzfit:latest

# Testing & Quality
test:
	pnpm run test

test-watch:
	pnpm run test:watch

lint:
	pnpm run lint

format:
	pnpm run format

# Maintenance
clean:
	rm -rf node_modules packages/*/node_modules packages/*/dist dist coverage
	find . -name "*.log" -type f -delete

clean-all: clean
	rm -rf dev.db dev.db-journal
