import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../shared/lib/utils'; // Import cn

export default function Navbar() {
  const navLinkClass = "block px-4 py-2 text-foreground hover:bg-muted-foreground/10 rounded-md transition-colors";

  return (
    <nav className="p-4 border-r bg-card h-full">
      <ul className="space-y-1">
        <li>
          <Link to="/dashboard" className={navLinkClass}>Dashboard</Link>
        </li>
        <li>
          <Link to="/meals" className={navLinkClass}>Meals</Link>
        </li>
        <li>
          <Link to="/foods" className={navLinkClass}>Foods</Link>
        </li>
        <li>
          <Link to="/goals" className={navLinkClass}>Goals</Link>
        </li>
        <li>
          <Link to="/settings" className={navLinkClass}>Settings</Link>
        </li>
      </ul>
    </nav>
  );
}
