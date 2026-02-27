#!/usr/bin/env node
/**
 * Bumps the version in root package.json and syncs everywhere.
 *
 * Usage:
 *   node scripts/bump-version.js patch       # 0.1.0 → 0.1.1
 *   node scripts/bump-version.js minor       # 0.1.0 → 0.2.0
 *   node scripts/bump-version.js major       # 0.1.0 → 1.0.0
 *   node scripts/bump-version.js 1.2.3       # explicit version
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const rootPkgFile = path.join(root, "package.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const bump = process.argv[2];
if (!bump) {
  console.error("Usage: node scripts/bump-version.js <major|minor|patch|x.y.z>");
  process.exit(1);
}

const pkg = readJson(rootPkgFile);
const [major, minor, patch] = pkg.version.split(".").map(Number);

let next;
if (bump === "major") next = `${major + 1}.0.0`;
else if (bump === "minor") next = `${major}.${minor + 1}.0`;
else if (bump === "patch") next = `${major}.${minor}.${patch + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(bump)) next = bump;
else {
  console.error(`Invalid bump: "${bump}". Use major, minor, patch, or x.y.z`);
  process.exit(1);
}

console.log(`${pkg.version} → ${next}`);
pkg.version = next;
writeJson(rootPkgFile, pkg);

// Sync everywhere
execSync(`node ${path.join(__dirname, "sync-version.js")}`, { stdio: "inherit" });

console.log(`\nDone. Next steps:`);
console.log(`  git add -A && git commit -m "chore: release v${next}"`);
console.log(`  git tag v${next} && git push origin main v${next}`);
