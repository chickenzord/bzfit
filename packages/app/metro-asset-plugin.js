/**
 * Custom Metro asset plugin to flatten asset paths for web
 * 
 * This prevents the very long node_modules/.pnpm paths from appearing in
 * the final web build, which can cause issues with URL encoding, web servers,
 * and reverse proxies (especially Cloudflare).
 * 
 * Fonts from node_modules will be output to: /assets/fonts/[filename]
 * Other assets remain in their original paths.
 */

module.exports = function(assetData) {
  // Only flatten paths that contain node_modules (especially the long .pnpm paths)
  if (assetData.httpServerLocation && assetData.httpServerLocation.includes('node_modules')) {
    const isFont = /\.(ttf|otf|woff|woff2)$/i.test(assetData.name);
    
    if (isFont) {
      // Flatten fonts to /assets/fonts/
      return {
        ...assetData,
        httpServerLocation: '/assets/fonts',
      };
    }
    
    // Flatten other node_modules assets to /assets/vendor/
    return {
      ...assetData,
      httpServerLocation: '/assets/vendor',
    };
  }
  
  // Keep user assets in their original structure
  return assetData;
};
