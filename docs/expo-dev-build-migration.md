# Migration: Expo Go → Development Build

## Why the Warning

EAS CLI prints *"Detected that your app uses Expo Go for development"* when the
`development` profile in `eas.json` has no `developmentClient: true` flag and
`expo-dev-client` is not installed. EAS infers the app still relies on the
Expo Go client for local development.

**Expo Go** is a sandboxed host app maintained by Expo. It only supports the
native modules Expo ships with it — you cannot add custom native code. It also
silently diverges from your production build because the JS bundle runs inside
someone else's binary.

**Development Build** (`expo-dev-client`) is a custom version of the Expo Go
client compiled from *your* project. It includes the same native modules as
your production app, gives you a launcher screen to switch between dev servers,
and is what EAS expects as the correct local development setup.

---

## Current State

| Item | Status |
|---|---|
| `expo-dev-client` installed | ❌ |
| `eas.json` development profile has `developmentClient: true` | ❌ |
| `eas.json` development profile has `distribution: internal` | ❌ |
| Native Android project generated (`android/`) | ❌ (gitignored) |

---

## What Changes

### 1. Install `expo-dev-client`

```bash
cd packages/app
pnpm add expo-dev-client
```

This adds the dev launcher screen and the native module bridge needed for
development builds.

### 2. Update `eas.json` development profile

```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

- `developmentClient: true` — tells EAS to include `expo-dev-client`
- `distribution: internal` — distribute via direct APK install, not the store
- Remove the explicit `gradleCommand` — EAS handles debug builds automatically
  when `developmentClient` is set

### 3. Register a `scheme` in `app.json` (already done)

`scheme: "bzfit"` is already present. This is required for deep linking between
the dev launcher and the Metro dev server. ✅

### 4. Update `_layout.tsx` entry point

Import `expo-dev-client` at the very top of the root layout so the dev client
initialises before anything else:

```ts
// Must be the first import
import "expo-dev-client";
```

This only affects debug builds — production builds tree-shake it out.

### 5. Gitignore stays as-is

`android/` and `ios/` are already gitignored. The native project is generated
by EAS (or locally by `expo prebuild`) at build time and never committed.

---

## Development Workflow After Migration

### First-time device setup

Build and install the development APK once on your device/emulator:

```bash
# Using EAS local (no EAS cloud needed)
cd packages/app
eas build --profile development --platform android --local --output ./dev-build.apk

# Install on connected device
adb install dev-build.apk
```

Or add a Makefile target:
```makefile
dev-build-android:
    cd packages/app && eas build --profile development --platform android --local --output ../../dev-build.apk
```

### Daily development

```bash
# Start Metro as usual
pnpm dev:app
```

Open the installed dev client app on your device → it shows a launcher screen →
enter your Metro URL (e.g. `exp://192.168.x.x:8081`) → connects and loads your JS.

You only need to rebuild the APK when native dependencies change
(e.g. adding a new Expo module). JS-only changes just require a Metro reload.

### Web development

Unaffected — `expo start --web` continues to work exactly the same.

---

## CI Impact

The GitHub `react-native-cicd.yaml` workflow builds the `production-apk` and
`production` (AAB) profiles — neither uses `developmentClient`. No CI changes
required for production builds.

If a CI development build is ever needed (e.g. for automated device testing),
add a new job using the `development` profile with `--local`.

---

## Implementation Steps (ordered)

1. `pnpm add expo-dev-client` in `packages/app`
2. Add `import "expo-dev-client"` as first line in `packages/app/app/_layout.tsx`
3. Update `eas.json` development profile
4. Optionally add `dev-build-android` target to `Makefile`
5. Test: `eas build --profile development --platform android --local`
6. Verify warning is gone from the CI pipeline on next push
