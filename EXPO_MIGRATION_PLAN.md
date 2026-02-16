# Expo Migration Plan

## Background

BzFit's frontend is currently a React + Vite + TailwindCSS web app (~2,500 lines of TSX across 37 files) served by the NestJS backend as static files. It uses Shadcn/UI components, Lucide icons, and a mobile-first responsive design.

**Why migrate?** Building mobile-first in React web doesn't feel right. Components and design patterns are inherently desktop-oriented — responsive breakpoints are a workaround, not native behavior. A React Native / Expo approach gives us truly native mobile UX while still supporting web as a platform.

**Goals:**
- Single codebase for Android + Web
- Truly mobile-native UI (not responsive web)
- Self-hosted build and deployment (no Expo paid services)
- Customizable branding and theming
- Keep NestJS backend unchanged, communicate via REST API + JWT

---

## Considered Alternatives

### 1. Expo (React Native) — **Selected**
- **Pros**: Single TypeScript codebase, native Android UI, mature web support via React Native Web, file-based routing (Expo Router), large ecosystem, OTA updates possible
- **Cons**: Some web libraries (Shadcn/UI, Radix) won't work, need RN-compatible UI library, learning curve for RN primitives (`View`/`Text` instead of `div`/`span`)
- **Verdict**: Best balance of native feel + code sharing + TypeScript continuity

### 2. PWA (Progressive Web App)
- **Pros**: Zero migration, just add service worker + manifest
- **Cons**: Still a web app in a browser shell, no native feel, limited Android integration (no real app store presence, restricted background capabilities)
- **Verdict**: Too limited — doesn't solve the core problem of web-first design

### 3. Capacitor / Ionic
- **Pros**: Wraps existing web code in WebView, minimal migration
- **Cons**: Still runs web code — it's a WebView, not native. Performance and feel are noticeably worse than native. Doesn't solve the design problem
- **Verdict**: Half-measure. If we're migrating, go native

### 4. Flutter
- **Pros**: Excellent cross-platform, great performance, good web support
- **Cons**: Dart language (no TypeScript sharing with backend), completely separate ecosystem, can't reuse any existing React knowledge or shared types
- **Verdict**: Too much ecosystem divergence for a TypeScript monorepo

### 5. Separate React Native app + keep React web
- **Pros**: Optimized per platform
- **Cons**: Two frontends to maintain, duplicated logic, divergent UX
- **Verdict**: Maintenance burden too high for a solo/small-team project

---

## Expo: Key Decisions

### Free vs Paid

Expo itself is open-source and free. **EAS (Expo Application Services)** is the paid part:
- EAS Build: Cloud builds — **not needed**, we can build locally
- EAS Submit: App store submission — **not needed**, we can submit manually or script it
- EAS Update: OTA updates — **can self-host** using `expo-updates` with a custom server

**What we use (all free):**
- Expo SDK + CLI (open source)
- Expo Router (file-based routing)
- `expo run:android` for local dev builds
- `eas build --local` or raw Gradle for production APK/AAB
- `npx expo export` for web builds (static files)
- `expo-updates` pointed at our own server for OTA (optional, post-MVP)

### UI Library

Shadcn/UI and Radix primitives are web-only — they won't work in React Native. We need a cross-platform UI solution.

**Options evaluated:**

| Library | Web Support | Native Feel | Tailwind-like | Maturity |
|---------|-------------|-------------|---------------|----------|
| **NativeWind v4** | Yes (compiles to CSS on web) | Uses RN primitives | Yes (Tailwind classes) | Stable |
| **Tamagui** | Yes | Yes | Partial (own syntax) | Stable |
| **Gluestack UI v2** | Yes | Yes | Yes (NativeWind-based) | Stable |
| **React Native Paper** | Partial | Material Design | No | Mature |

**Recommendation: NativeWind v4 + custom components**

- Closest to our current Tailwind workflow
- On web: compiles to actual CSS (fast, familiar)
- On native: maps to RN StyleSheet (native performance)
- We rebuild our UI components using RN primitives (`View`, `Text`, `Pressable`) styled with NativeWind
- This gives us full branding control (no opinionated design system to fight)

### Routing

**Expo Router** (file-based, built on React Navigation):
- Works on both web and native
- SEO-friendly on web (generates proper URLs)
- Deep linking on Android
- Layout routes for shared navigation structure
- Mature enough for production use

### Navigation Pattern

- **Mobile**: Bottom tab bar matching namespaces — Nutrition, Catalog, Settings
- **Web**: Same bottom tabs or sidebar depending on viewport — Expo Router layout handles this
- **Routes mirror API namespaces** for consistency:
  - `/nutrition/` — meals, goals
  - `/catalog/` — foods, servings, workouts (future)
  - `/settings/` — user preferences

---

## New Project Structure

```
bzfit/
├── src/
│   ├── server/                 # NestJS backend (UNCHANGED)
│   │   ├── modules/
│   │   └── prisma/
│   ├── app/                    # Expo frontend (replaces src/client/)
│   │   ├── app/                # Expo Router file-based routes
│   │   │   ├── _layout.tsx     # Root layout (auth check, providers)
│   │   │   ├── (auth)/         # Auth group (login, register)
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   └── (tabs)/         # Main app with tab navigation
│   │   │       ├── _layout.tsx # Tab bar config (Nutrition, Catalog, Settings)
│   │   │       ├── index.tsx   # Redirect to /nutrition
│   │   │       ├── nutrition/  # ── Nutrition namespace ──
│   │   │       │   ├── _layout.tsx   # Nutrition stack navigator
│   │   │       │   ├── index.tsx     # Journal / daily view (default)
│   │   │       │   ├── meals/
│   │   │       │   │   ├── index.tsx # Meal list
│   │   │       │   │   └── [id].tsx  # Meal detail
│   │   │       │   └── goals.tsx     # Nutrition goals
│   │   │       ├── catalog/    # ── Catalog namespace ──
│   │   │       │   ├── _layout.tsx   # Catalog stack navigator
│   │   │       │   ├── index.tsx     # Catalog landing (search)
│   │   │       │   ├── foods/
│   │   │       │   │   ├── index.tsx # Food list
│   │   │       │   │   └── [id].tsx  # Food detail + servings
│   │   │       │   └── workouts/     # Future: workout catalog
│   │   │       │       └── index.tsx
│   │   │       └── settings.tsx      # User preferences
│   │   ├── components/         # Shared UI components
│   │   │   ├── ui/             # Base components (Button, Card, Input, etc.)
│   │   │   ├── catalog/        # Food/serving components
│   │   │   └── nutrition/      # Meal/goal components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities (API client, storage, etc.)
│   │   ├── context/            # React Context providers
│   │   ├── constants/          # Theme colors, config
│   │   ├── assets/             # Images, fonts
│   │   ├── app.json            # Expo config
│   │   ├── metro.config.js     # Metro bundler config
│   │   ├── nativewind-env.d.ts # NativeWind types
│   │   ├── tailwind.config.ts  # NativeWind/Tailwind config
│   │   └── tsconfig.json
│   └── shared/                 # Shared TypeScript types (UNCHANGED)
│       ├── dto/
│       └── entities/
├── prisma/
├── package.json                # Monorepo root
├── Dockerfile                  # Updated for new web build
└── CLAUDE.md
```

### Key Changes from Current Structure

| Aspect | Before (React/Vite) | After (Expo) |
|--------|---------------------|--------------|
| Entry point | `src/client/index.html` | `src/app/app/_layout.tsx` |
| Routing | React Router DOM | Expo Router (file-based) |
| Styling | TailwindCSS + Shadcn/UI | NativeWind + custom components |
| Icons | Lucide React | Lucide React Native (or Expo Vector Icons) |
| Bundler | Vite | Metro (native) + Expo export (web) |
| HTTP client | fetch + axios | fetch (works on both platforms) |
| Storage | localStorage | expo-secure-store (native) + localStorage (web) |
| Navigation | React Router + sidebar | Expo Router + bottom tabs |

### Route Mapping

Frontend routes mirror the API namespaces (`/api/v1/nutrition/*`, `/api/v1/catalog/*`):

| Web URL | Screen | API Namespace |
|---------|--------|---------------|
| `/nutrition` | Journal (daily view) | `nutrition/*` |
| `/nutrition/meals` | Meal list | `nutrition/meals` |
| `/nutrition/meals/:id` | Meal detail | `nutrition/meals/:id` |
| `/nutrition/goals` | Nutrition goals | `nutrition/goals` |
| `/catalog` | Catalog search | `catalog/*` |
| `/catalog/foods` | Food list | `catalog/foods` |
| `/catalog/foods/:id` | Food detail + servings | `catalog/foods/:id` |
| `/catalog/workouts` | Workout catalog (future) | `catalog/workouts` |
| `/settings` | User preferences | — |

### Shared Types

The `src/shared/` directory remains unchanged. Both backend and frontend import DTOs and entity types from here. Expo's Metro bundler needs a `metro.config.js` update to resolve the `@shared/*` path alias.

---

## Build & Deploy

### Development

```bash
# Backend (unchanged)
npm run dev:server              # NestJS on :3001

# Frontend (new)
npx expo start                  # Expo dev server (Metro)
# Press 'w' for web, 'a' for Android
# Web runs on :8081, proxies /api to :3001
```

### Local Android Build

```bash
# Development build (debug APK)
npx expo run:android

# Production build (release APK/AAB) — option A: eas local
npx eas build --platform android --local

# Production build — option B: raw Gradle
cd android && ./gradlew assembleRelease
```

Requirements: JDK 17+, Android SDK, Android NDK (managed by Expo prebuild).

### Web Build

```bash
# Export static files
npx expo export --platform web

# Output: dist/app (static HTML/JS/CSS)
```

The web export produces static files, same as Vite did. NestJS can serve them identically.

### Docker / Production

```dockerfile
# Build stage changes:
# Before: npm run build:client (Vite)
# After:  npx expo export --platform web --output-dir dist/client

# NestJS still serves dist/client as static files
# API still at /api/v1/*
# Same single-container deployment model
```

The Docker image only contains the web build. Android APK is built and distributed separately.

### Android Distribution (Self-Hosted)

Options for distributing the Android app without Google Play:
1. **Direct APK download** from a page on the BzFit instance
2. **F-Droid** (open source app store)
3. **Google Play** (when ready, manual upload or scripted with `fastlane`)

---

## Migration Strategy

### Phase 1: Scaffold Expo Project
- Initialize Expo project in `src/app/`
- Configure NativeWind, Expo Router, path aliases
- Set up Metro config to resolve `@shared/*`
- Set up API client (reuse fetch-based client, adapt storage layer)
- Auth context with platform-aware token storage

### Phase 2: Rebuild Core Screens
- Auth screens (login, register)
- Tab layout with navigation
- Journal page (daily view, metrics)
- Food catalog (search, list, detail)
- Meal logging flow

### Phase 3: Platform-Specific Polish
- Android: native status bar, safe areas, haptics
- Web: responsive layout adjustments, keyboard shortcuts
- Shared: loading states, error handling, offline indicators

### Phase 4: Build & Deploy Pipeline
- Local Android build scripts
- Updated Dockerfile for web export
- CI/CD for both platforms (optional, can be manual initially)

### Phase 5: Remove Old Frontend
- Delete `src/client/`
- Update npm scripts
- Update CLAUDE.md and documentation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| NativeWind web rendering differs from native | UI inconsistencies | Test on both platforms during development, use platform-specific overrides when needed |
| Expo web bundle size larger than Vite | Slower initial load | Use `expo export` optimizations, lazy-load routes, tree-shaking |
| Metro bundler slower than Vite for web dev | Developer experience | Use Expo's fast refresh; web DX is secondary to native |
| Some RN libraries lack web support | Feature gaps | Check web compatibility before adopting any library |
| Android build requires local setup | Onboarding friction | Document setup steps, consider Docker-based Android build |
| Expo SDK version lock-in | Upgrade difficulty | Follow Expo's upgrade guides, stay on stable releases |

---

## What Stays the Same

- NestJS backend — completely unchanged
- REST API contract — same endpoints, same DTOs
- Prisma / database layer — untouched
- Shared TypeScript types — still imported by both sides
- JWT authentication flow — same mechanism, different token storage
- Docker deployment model — still single container for web + API
- Self-hosted philosophy — no cloud dependencies added
