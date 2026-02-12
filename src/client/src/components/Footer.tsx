import React from 'react';

export default function Footer() {
  return (
    <footer className="text-center p-4 mt-auto bg-background border-t text-sm text-muted-foreground">
      © {new Date().getFullYear()} BzFit. All rights reserved.
    </footer>
  );
}
