import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Share2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * Header - Top navigation bar with page titles and user actions
 *
 * Features:
 * - Mobile menu trigger (hamburger)
 * - Center page title (dynamic based on route)
 * - Date selector for Journal page
 * - Notifications CTA (top right)
 * - Share action (Journal only)
 *
 * Matches reference design: ui_meal_dashboard.jpeg
 */

interface HeaderProps {
  mobileMenuTrigger?: React.ReactNode;
}

export default function Header({ mobileMenuTrigger }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Determine page title based on route
  const getPageTitle = (): { title: string; hasDropdown: boolean } => {
    if (location.pathname === '/journal') {
      return { title: 'Today', hasDropdown: true };
    }
    if (location.pathname === '/meals') {
      return { title: 'Meals', hasDropdown: false };
    }
    if (location.pathname === '/goals') {
      return { title: 'Goals', hasDropdown: false };
    }
    if (location.pathname === '/catalog/foods') {
      return { title: 'Foods', hasDropdown: false };
    }
    if (location.pathname === '/settings') {
      return { title: 'Settings', hasDropdown: false };
    }
    return { title: '', hasDropdown: false };
  };

  const { title, hasDropdown } = getPageTitle();
  const isJournal = location.pathname === '/journal';
  const showPageTitle = title !== '';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile Menu */}
        <div className="flex items-center gap-3">
          {mobileMenuTrigger}
          {!showPageTitle && (
            <Link to="/" className="flex items-center space-x-2 md:block hidden">
              <span className="text-xl font-bold">BzFit</span>
            </Link>
          )}
        </div>

        {/* Center: Page Title */}
        {showPageTitle && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            {hasDropdown ? (
              <Button variant="ghost" className="gap-2 text-lg font-semibold">
                {title}
                <ChevronDown className="h-4 w-4" />
              </Button>
            ) : (
              <h1 className="text-lg font-semibold">{title}</h1>
            )}
          </div>
        )}

        {/* Right: Action Icons */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {/* Notifications CTA - Always visible when authenticated */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
                  3
                </span>
              </Button>

              {/* Share (Journal only) */}
              {isJournal && (
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              )}
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
