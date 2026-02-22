# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Build-time arg for web app API URL.
# Empty string (default) = relative URLs, works when server and web app are on the same host.
# Override at build time: docker build --build-arg EXPO_PUBLIC_API_URL=https://api.example.com .
ARG EXPO_PUBLIC_API_URL=""
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Copy workspace config and package files first (for layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/app/package.json packages/app/package.json
COPY prisma ./prisma

# Install all dependencies (needed for both server and web app build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build server
RUN pnpm --filter @bzfit/shared build && pnpm --filter @bzfit/server build

# Build Expo web app (outputs to packages/app/dist/)
RUN pnpm --filter @bzfit/app build:web

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config (only server packages — app static files are pre-built)
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY prisma ./prisma

# Install production dependencies for server only
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client
RUN pnpm prisma generate

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/app/dist ./web

# Environment variables
ENV DATABASE_URL="file:./data/db.sqlite"
ENV NODE_ENV=production
ENV PORT=3000
ENV SERVE_STATIC_PATH=/app/web

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command (run migrations then start server)
CMD ["sh", "-c", "pnpm prisma migrate deploy && node packages/server/dist/main.js"]
