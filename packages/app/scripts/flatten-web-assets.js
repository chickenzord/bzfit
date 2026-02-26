#!/usr/bin/env node
/**
 * Post-processing script for `expo export --platform web`
 *
 * Expo + pnpm outputs vendor assets (fonts etc.) into deeply nested paths:
 *   assets/__node_modules/.pnpm/@expo+vector-icons@.../Fonts/Feather.HASH.ttf
 *
 * These long URLs containing @ and + are mangled by Cloudflare and other
 * reverse proxies. This script flattens them to:
 *   assets/vendor/Feather.HASH.ttf
 *
 * and updates the JS bundle to reference the new paths.
 *
 * Run automatically after expo export via the build:web script.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const assetsDir = path.join(distDir, 'assets');
const nodemodulesDir = path.join(assetsDir, '__node_modules');
const vendorDir = path.join(assetsDir, 'vendor');

function findFiles(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(fullPath, pattern));
    else if (pattern.test(entry.name)) results.push(fullPath);
  }
  return results;
}

// --- 1. Find all font files under __node_modules ---
const fontFiles = findFiles(nodemodulesDir, /\.(ttf|otf|woff|woff2)$/i);

if (fontFiles.length === 0) {
  console.log('flatten-web-assets: no font files found in __node_modules, skipping.');
  process.exit(0);
}

// --- 2. Copy fonts to assets/vendor/ ---
fs.mkdirSync(vendorDir, { recursive: true });

for (const src of fontFiles) {
  const filename = path.basename(src);
  const dest = path.join(vendorDir, filename);
  fs.copyFileSync(src, dest);
  console.log(`  copied: ${filename}`);
}

// --- 3. Update JS bundles to reference new paths ---
const jsDir = path.join(distDir, '_expo', 'static', 'js');
const jsBundles = findFiles(jsDir, /\.js$/);

for (const bundle of jsBundles) {
  const original = fs.readFileSync(bundle, 'utf8');
  const updated = original.replace(
    /\/assets\/__node_modules\/[^"'\s]*\/([^/\s"']+\.(?:ttf|otf|woff|woff2))/gi,
    '/assets/vendor/$1',
  );
  if (updated !== original) {
    fs.writeFileSync(bundle, updated);
    console.log(`  patched: ${path.basename(bundle)}`);
  }
}

console.log(`flatten-web-assets: done. ${fontFiles.length} font(s) moved to /assets/vendor/`);
