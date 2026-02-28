# BzFit Release Strategy

## Overview

BzFit is an open-source monorepo that produces two release artifacts:

| Artifact | Description |
|---|---|
| **Docker image** | Server + bundled web UI (`ghcr.io/chickenzord/bzfit`) |
| **Android app** | APK (sideload / F-Droid) and AAB (Play Store) |

---

## Versioning

### Scheme: `MAJOR.MINOR.PATCH` (SemVer)

All packages in the monorepo share a single version (`packages/app`, `packages/server`, `packages/shared`, root). Bumping is done in one place and propagated.

### Android `versionCode`

Play Store requires a monotonically increasing integer. We derive it from the version rather than a timestamp (timestamps are fragile across machines/CI):

```
versionCode = MAJOR * 1000000 + MINOR * 10000 + PATCH * 100 + BUILD
```

`BUILD` is a rebuild counter (0–99) for re-releasing the same semver (e.g. hotfix signing, CI flake). It resets to `0` on each new `PATCH` bump.

Examples:
- `0.1.0` build `0` → `10000`
- `0.1.0` build `1` → `10001` (rebuild of same version)
- `0.2.0` build `0` → `20000`
- `1.0.0` build `0` → `1000000`
- `1.2.3` build `5` → `1020305`

Maximum supported: MAJOR up to 2100, well within Play Store's 2,100,000,000 limit.

The `versionCode` is set in `app.json` and kept in sync via `scripts/sync-version.js`. A CI guard validates they are consistent before any build.

### Single source of truth

Version lives in the **root `package.json`**. All other `package.json` files and `app.json` reference it or are kept in sync by a `scripts/sync-version.js` script run as part of the release process.

---

## Release Channels

| Channel | Artifact | Trigger | Notes |
|---|---|---|---|
| **GitHub Release** | Source tarball + APK + AAB | Git tag `v*` | Draft created by CI, manually published |
| **GHCR Docker** | `ghcr.io/chickenzord/bzfit` | Git tag `v*` + `main` push | `latest` tracks `main`; versioned tags on release |
| **Play Store** | AAB | Manual `workflow_dispatch` | Requires keystore secrets |
| **F-Droid (self-hosted)** | APK | Git tag `v*` | Included in GitHub Release assets |
| **Public SaaS instance** | Docker image | Manual deploy after release | `bzfit.mdgrd.net` |
| **Public demo instance** | Docker image | Manual deploy after release | Separate container, reset data periodically |

---

## Git Workflow

```
main  ──── feature branches ──── PRs ──── merge ──── tag ──── release
```

- `main` always builds and pushes `latest` Docker image
- A `v*` tag triggers the full release pipeline: Docker versioned tag + GitHub Release (APK/AAB)
- Play Store submission is a separate manual step after validating the GitHub Release draft

---

## Release Process (step by step)

1. **Bump version** — update root `package.json` version, run `scripts/sync-version.js` to propagate to sub-packages and `app.json` (including derived `versionCode`)
2. **Commit** — `chore: release vX.Y.Z`
3. **Tag** — `git tag vX.Y.Z && git push origin vX.Y.Z`
4. **CI runs automatically**:
   - Docker image built for `linux/amd64` + `linux/arm64`, pushed as `vX.Y.Z` and `vMAJOR.MINOR` to GHCR
   - APK and AAB built via EAS local build
   - GitHub Release draft created with APK, AAB, and changelog from commits since last tag
5. **Review & publish** the GitHub Release draft
6. **Play Store** — run `workflow_dispatch` with `publish-stores` to submit AAB (or do it from the release draft)
7. **Deploy SaaS** — pull new Docker image on production host
8. **Deploy demo** — pull new Docker image on demo host, optionally reset data

---

## CI Workflows

### `docker.yml` (existing, mostly complete)
- Triggers on `main` push and `v*` tags ✅
- Multi-arch build (amd64 + arm64) ✅
- Tags: `latest` on main, `vX.Y.Z` + `vX.Y` on tag ✅
- **Gap**: does not validate `versionCode` consistency

### `react-native-cicd.yaml` (existing, needs refinement)
- Manual `workflow_dispatch` with build type selector ✅
- Builds APK and AAB via EAS local ✅
- Creates GitHub Release draft ✅
- **Gaps** (see wiring detail below)

#### Wiring `versionCode` into the EAS local build

Since we use **EAS local builds** (not prebuilt/managed), EAS reads `expo.version` and `expo.android.versionCode` directly from `app.json` at build time. The value baked into the APK/AAB is whatever is in `app.json` when `eas build` runs — so it must be set correctly before that step.

**`workflow_dispatch` inputs to add:**

```yaml
workflow_dispatch:
  inputs:
    buildType:
      type: choice
      options: [prod-apk, prod-aab, publish-stores, all]
    build:
      type: number
      description: "Rebuild counter for this semver (0 = first build)"
      default: "0"
```

**Steps to add before the EAS build steps:**

```yaml
- name: Compute and apply versionCode
  run: |
    node scripts/sync-version.js --build ${{ inputs.build || 0 }}
    VERSION=$(node -p "require('./packages/app/app.json').expo.version")
    VCODE=$(node -p "require('./packages/app/app.json').expo.android.versionCode")
    echo "Building $VERSION (versionCode $VCODE)"
```

`sync-version.js` writes the computed `versionCode` into `app.json` in-place — the change is never committed, it only exists in the CI workspace. EAS then reads the patched `app.json` when it runs.

**Fixes to make:**
- Remove `date +%Y%m%d%H%M` build number — version info now comes entirely from `app.json`
- Change release tag to `vX.Y.Z` (not `vX.Y.Z-BUILDNUMBER`); if a rebuild is needed, use `vX.Y.Z-bN` (e.g. `v1.2.3-b1`)
- Add `v*` tag trigger alongside `workflow_dispatch` for the fully automated flow
- Re-enable Play Store submission step once keystore secrets are configured

---

## Proposed `scripts/sync-version.js`

A small Node.js script run before committing a release:

```
node scripts/sync-version.js
```

It reads the version from root `package.json`, then:
1. Writes the same version to `packages/server/package.json`, `packages/shared/package.json`, `packages/app/package.json`
2. Writes `expo.version` and the derived `expo.android.versionCode` to `packages/app/app.json`
3. Exits non-zero if anything is out of sync (useful as a CI guard)

---

## Open Questions

- **Demo instance reset cadence**: how often should demo data be wiped?
- **F-Droid self-hosted repo**: needs a repo metadata file (`fdroid` tooling) — separate task
- **iOS**: not in scope yet, but `versionCode` equivalent (`CFBundleVersion`) should follow the same derivation when added
