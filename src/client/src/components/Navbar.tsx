import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, Apple, Target, Settings } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';

interface NavbarProps {
  onNavigate?: () => void;
}

/**
 * Navbar - Main navigation menu
 *
 * Features:
 * - Icon + text navigation links
 * - Active state highlighting
 * - onClick callback for mobile menu closing
 * - Accessible with proper ARIA labels
 *
 * TODO: CUSTOMIZE - Update navigation links based on final feature set
 */
export default function Navbar({ onNavigate }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
    { to: '/foods', icon: Apple, label: 'Foods' },
    { to: '/goals', icon: Target, label: 'Goals' }, // TODO: Remove if not in MVP
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="flex flex-col p-4 space-y-1">
      {navItems.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;

        return (
          <Button
            key={to}
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'justify-start gap-3',
              isActive && 'bg-secondary font-medium'
            )}
            onClick={onNavigate}
          >
            <Link to={to}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
