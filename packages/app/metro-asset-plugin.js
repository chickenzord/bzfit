/**
 * Custom Metro asset plugin to flatten asset paths for web
 * 
 * This prevents the very long node_modules/.pnpm paths from appearing in
 * the final web build, which can cause issues with URL encoding, web servers,
 * and reverse proxies (especially Cloudflare).
 * 
 * Fonts from node_modules will be output to: assets/vendor/[filename]
 * The JavaScript will request them as: /assets/vendor/[filename]
 */

module.exports = function(assetData) {
  // Only flatten paths that contain node_modules (especially the long .pnpm paths)
  if (assetData.httpServerLocation && assetData.httpServerLocation.includes('node_modules')) {
    // Flatten all node_modules assets to assets/vendor/
    // Metro will output to: dist/assets/vendor/
    // JavaScript will request: /assets/vendor/[filename]
    return {
      ...assetData,
      httpServerLocation: '/assets/vendor',
    };
  }
  
  // Keep user assets in their original structure (e.g., /assets/icon.png)
  return assetData;
};
