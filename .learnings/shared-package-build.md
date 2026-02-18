# Why `@bzfit/shared` Needs a Build Step

## The Question

Can `@bzfit/shared` be imported directly from source (`src/index.ts`) without a compile step?

## The Short Answer

**No — not without additional tooling.** The `main` field must point to a compiled JS file (`dist/index.js`).

## What Was Tried

Changed `packages/shared/package.json`:
```json
"main": "src/index.ts"
```

## What Broke

`nest start --watch` (dev mode) threw:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '.../packages/shared/src/dto'
is not supported resolving ES modules imported from .../packages/shared/src/index.ts
```

## Root Cause

There are **two distinct code paths** in NestJS:

### `nest build` (production) — works with source
SWC acts as a **bundler**. It follows the full import chain at compile time, transpiles `@bzfit/shared`'s TypeScript inline, and produces a self-contained `dist/main.js`. The shared package is no longer referenced at runtime — everything is already inlined.

### `nest start --watch` (dev) — breaks with source
SWC only compiles `packages/server/src/**` to a temp output, then **Node.js runs the compiled JS**. At runtime, Node.js encounters `require('@bzfit/shared')`, resolves `main: "src/index.ts"`, and tries to load a `.ts` file as if it were JS. It sees `export *` syntax, treats it as an ES module, then fails on `export * from './dto'` because **directory imports are not allowed in ESM**.

The key insight: **Node.js cannot execute `.ts` files at runtime.** The `dist` exists to give Node.js a `.js` version it can actually run.

## Why `types: "src/index.ts"` Still Works

The `types` field is only used by **TypeScript / VS Code** for type resolution — never by Node.js at runtime. So VS Code correctly reads types from source while the runtime uses the compiled dist.

## Alternative Considered: TypeScript Executor Hook

Register `@swc-node/register` to make Node.js handle `.ts` files at runtime. Rejected because:
- NestJS SWC runner doesn't natively support `--require` hooks in watch mode
- Would require wrapping the NestJS CLI dev command
- Medium risk, uncertain compatibility
- Not worth the complexity for this use case

## The Fix

Keep `main: "dist/index.js"`. Fix the build script to **always clean before compiling** so stale files never accumulate:

```json
"build": "rm -rf dist && tsc"
```

This was the original stale dist problem: `tsc` with `--incremental` doesn't delete output for removed/renamed source files. Removing `dist` before each build prevents stale `.js`/`.d.ts` files from lingering.

## Stale Dist Symptom

VS Code error: `Module '"@bzfit/shared"' has no exported member 'CreateApiKeySchema'`

Cause: old `dist/dto/auth/create-api-key.dto.js` from pre-Zod migration was still present even though the source had been renamed to `create-api-key.schema.ts`. The `tsc` incremental build didn't remove it.
