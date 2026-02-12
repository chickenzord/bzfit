import React from 'react';

/**
 * Footer - Application footer with copyright and links
 *
 * TODO: CUSTOMIZE - Add privacy policy, terms of service, social media links
 */
export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} BzFit. All rights reserved.</p>

        {/* TODO: CUSTOMIZE - Add footer navigation links */}
        <div className="flex gap-4">
          {/* Example: <a href="/privacy" className="hover:text-foreground">Privacy</a> */}
        </div>
      </div>
    </footer>
  );
}
