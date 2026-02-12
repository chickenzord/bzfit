import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../../shared/components/ui/button'; // Assuming Button component will be in ui
import { cn } from '../../shared/lib/utils'; // Import cn

export default function Header() {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b shadow-sm">
      <div className="text-xl font-bold">
        <Link to="/" className="text-foreground no-underline">BzFit</Link>
      </div>
      <nav className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link to="/meals" className="text-muted-foreground hover:text-foreground no-underline">Meals</Link>
            {/* The Settings link is removed as per the previous instruction, keep it out */}
            <Button onClick={handleLogout} variant="destructive" size="sm">
              Logout
            </Button>
          </>
        ) : (
          <Link to="/login" className="text-muted-foreground hover:text-foreground no-underline">Login</Link>
        )}
      </nav>
    </header>
  );
}
