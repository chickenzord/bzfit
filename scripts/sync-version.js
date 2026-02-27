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

function deriveVersionCode(version, build = 0) {
  const [major, minor, patch] = version.split(".").map(Number);
  return major * 1000000 + minor * 10000 + patch * 100 + build;
}

// --- Parse args ---
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const buildIndex = args.indexOf("--build");
const build = buildIndex !== -1 ? parseInt(args[buildIndex + 1], 10) : 0;

// --- Read source of truth ---
const rootPkg = readJson(path.join(root, "package.json"));
const version = rootPkg.version;
const versionCode = deriveVersionCode(version, build);

console.log(`version: ${version}  versionCode: ${versionCode} (build=${build})`);

// --- Files to sync ---
const packageFiles = [
  "packages/server/package.json",
  "packages/shared/package.json",
  "packages/app/package.json",
];

const appJson = path.join(root, "packages/app/app.json");

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

// --- Check / update app.json ---
const app = readJson(appJson);
const expoVersion = app.expo.version;
const expoVersionCode = app.expo.android?.versionCode;

if (expoVersion !== version || expoVersionCode !== versionCode) {
  if (checkOnly) {
    console.error(`  ✗ app.json: version=${expoVersion} versionCode=${expoVersionCode} (expected ${version} / ${versionCode})`);
    outOfSync = true;
  } else {
    app.expo.version = version;
    app.expo.android = { ...app.expo.android, versionCode };
    writeJson(appJson, app);
    console.log(`  updated packages/app/app.json`);
  }
} else {
  console.log(`  ok      packages/app/app.json`);
}

if (checkOnly && outOfSync) {
  console.error("\nVersions are out of sync. Run: node scripts/sync-version.js");
  process.exit(1);
}
