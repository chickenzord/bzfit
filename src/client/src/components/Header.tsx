import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@shared/components/ui/button';

/**
 * Header - Top navigation bar with branding and user actions
 *
 * Features:
 * - App branding/logo
 * - Conditional rendering based on auth state
 * - Logout button for authenticated users
 *
 * TODO: CUSTOMIZE - Add app logo, user avatar dropdown menu, notifications
 */
export default function Header() {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-2">
          {/* TODO: CUSTOMIZE - Replace with actual logo */}
          <span className="text-xl font-bold">BzFit</span>
        </Link>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* TODO: CUSTOMIZE - Add user avatar, notifications, etc. */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
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
