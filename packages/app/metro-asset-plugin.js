/**
 * Custom Metro asset plugin to flatten asset paths for web
 *
 * This prevents the very long node_modules/.pnpm paths from appearing in
 * the final web build, which can cause issues with URL encoding, web servers,
 * and reverse proxies (especially Cloudflare).
 *
 * Only applies during `expo export` (NODE_ENV=production).
 * In dev mode, assets are served from their original paths by the Metro dev
 * server, so flattening would cause 404s.
 *
 * Fonts from node_modules will be output to: assets/vendor/[filename]
 * The JavaScript will request them as: /assets/vendor/[filename]
 */

module.exports = function(assetData) {
  // Only flatten during production export, not in dev server
  if (process.env.NODE_ENV !== 'production') {
    return assetData;
  }

  // Only flatten paths that contain node_modules (especially the long .pnpm paths)
  if (assetData.httpServerLocation && assetData.httpServerLocation.includes('node_modules')) {
    return {
      ...assetData,
      httpServerLocation: '/assets/vendor',
    };
  }

  return assetData;
};
