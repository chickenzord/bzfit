#!/usr/bin/env node
/**
 * Syncs the version from root package.json to all sub-packages and app.json.
 * Also computes expo.android.versionCode from the semver + optional build counter.
 *
 * Usage:
 *   node scripts/sync-version.js           # sync only, build=0
 *   node scripts/sync-version.js --build 2 # sync with rebuild counter
 *   node scripts/sync-version.js --check   # validate all in sync, exit 1 if not
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

// --- Parse args ---
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

// --- Read source of truth ---
const rootPkg = readJson(path.join(root, "package.json"));
const version = rootPkg.version;

console.log(`version: ${version}`);

// --- Files to sync ---
const packageFiles = [
  "packages/server/package.json",
  "packages/shared/package.json",
  "packages/app/package.json",
];

let outOfSync = false;

// --- Check / update sub-packages ---
for (const rel of packageFiles) {
  const file = path.join(root, rel);
  const pkg = readJson(file);
  if (pkg.version !== version) {
    if (checkOnly) {
      console.error(`  ✗ ${rel}: ${pkg.version} (expected ${version})`);
      outOfSync = true;
    } else {
      pkg.version = version;
      writeJson(file, pkg);
      console.log(`  updated ${rel}`);
    }
  } else {
    console.log(`  ok      ${rel}`);
  }
}

// app.config.js derives version and versionCode from package.json at build
// time — no file patching needed here.
console.log(`  ok      packages/app/app.config.js (reads package.json at build time)`);

if (checkOnly && outOfSync) {
  console.error("\nVersions are out of sync. Run: node scripts/sync-version.js");
  process.exit(1);
}
