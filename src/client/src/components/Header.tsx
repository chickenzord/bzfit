import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Zap, Share2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * Header - Top navigation bar with branding and user actions
 *
 * Features:
 * - Mobile menu trigger (hamburger)
 * - Center title with dropdown (for dashboard)
 * - Action icons (notifications, share)
 * - Logout button for authenticated users
 *
 * Matches reference design: ui_meal_dashboard.jpeg
 */

interface HeaderProps {
  mobileMenuTrigger?: React.ReactNode;
}

export default function Header({ mobileMenuTrigger }: HeaderProps) {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile Menu */}
        <div className="flex items-center gap-3">
          {mobileMenuTrigger}
          {!isDashboard && (
            <Link to="/" className="flex items-center space-x-2 md:block hidden">
              <span className="text-xl font-bold">BzFit</span>
            </Link>
          )}
        </div>

        {/* Center: Title/Dropdown (Dashboard only) */}
        {isDashboard && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Button variant="ghost" className="gap-2 text-lg font-semibold">
              Today
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right: Action Icons */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {isDashboard && (
                <>
                  {/* Notifications/Streak */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Zap className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-bold flex items-center justify-center text-primary-foreground">
                      2
                    </span>
                  </Button>

                  {/* Share */}
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Logout (hidden on mobile dashboard) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={isDashboard ? 'hidden md:flex gap-2' : 'flex gap-2'}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
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
