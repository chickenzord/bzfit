<div align="center">
  <img src=".github/assets/icon.png" width="128" alt="BzFit" />
  <h1>BzFit</h1>
  <p>Self-hosted calorie tracker. Log meals fast, fill in the details later.</p>
</div>

---

BzFit is a personal calorie and macro tracking app designed for self-hosting. The mobile app (iOS/Android) connects to your own server, with a web UI bundled in the same Docker image.

**Core idea:** Log what you ate now. Fill in exact nutrition data when you have the package label.

## Quick Start

**1. Create `docker-compose.yml`:**

```yaml
services:
  bzfit:
    image: ghcr.io/chickenzord/bzfit:latest
    ports:
      - "3000:3000"
    environment:
      JWT_SECRET: change-me-use-openssl-rand-hex-32
    volumes:
      - bzfit-data:/app/data
    restart: unless-stopped

volumes:
  bzfit-data:
```

**2. Start it:**

```bash
docker compose up -d
```

**3. Open the web UI:** `http://your-server:3000`

**4. Point the mobile app** at `http://your-server:3000` (see [Mobile App](#mobile-app) below).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | **Required.** Sign JWT tokens. Use `openssl rand -hex 32`. |
| `DATABASE_URL` | `file:./data/db.sqlite` | SQLite path or `postgresql://user:pass@host:5432/db` |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. Examples: `1d`, `12h`, `30m` |
| `REGISTRATION_ENABLED` | `true` | Set to `false` to block new signups (single-user mode) |
| `PORT` | `3000` | Port the server listens on |

### PostgreSQL

Swap SQLite for Postgres by updating `DATABASE_URL`:

```yaml
services:
  bzfit:
    image: ghcr.io/chickenzord/bzfit:latest
    environment:
      JWT_SECRET: your-secret
      DATABASE_URL: postgresql://bzfit:yourpassword@db:5432/bzfit
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bzfit
      POSTGRES_PASSWORD: yourpassword
      POSTGRES_DB: bzfit
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

### Reverse Proxy

BzFit runs on a single port serving both the API (`/api/v1/`) and the web UI. Point any reverse proxy directly at that port.

Example with Traefik labels:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.bzfit.rule=Host(`bzfit.yourdomain.com`)"
  - "traefik.http.routers.bzfit.entrypoints=websecure"
  - "traefik.http.routers.bzfit.tls.certresolver=letsencrypt"
```

## Mobile App

The app is built with Expo. To connect it to your server:

1. Clone this repo
2. Set the server URL in `packages/app/.env.local`:
   ```
   EXPO_PUBLIC_API_URL=https://bzfit.yourdomain.com
   ```
3. Run on your device:
   ```bash
   pnpm run dev:app
   ```

Or build a standalone APK/IPA with `eas build`.

## Platforms

Docker images are published for `linux/amd64` and `linux/arm64` (Raspberry Pi 4/5 and other ARM servers).

```bash
docker pull ghcr.io/chickenzord/bzfit:latest
```

## Data

SQLite data is stored at `/app/data/db.sqlite` inside the container. Mount a volume there to persist it across restarts and upgrades. Migrations run automatically on startup.

```bash
# Backup
docker exec bzfit sqlite3 /app/data/db.sqlite ".backup '/app/data/backup.db'"
```
