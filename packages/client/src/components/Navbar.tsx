import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Target,
  Apple,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate?: () => void;
}

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Navbar - Modular navigation menu
 *
 * Features:
 * - Grouped by modules (Overview, Nutrition, Catalog, Settings)
 * - Icon + text navigation links
 * - Active state highlighting
 * - Logout action at bottom
 * - Accessible with proper ARIA labels
 */
export default function Navbar({ onNavigate }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
    onNavigate?.();
  };

  const navSections: NavSection[] = [
    {
      items: [
        { to: '/journal', icon: LayoutDashboard, label: 'Journal' },
      ],
    },
    {
      title: 'Nutrition',
      items: [
        { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
        { to: '/goals', icon: Target, label: 'Goals' },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { to: '/catalog/foods', icon: Apple, label: 'Foods' },
      ],
    },
    {
      items: [
        { to: '/settings', icon: Settings, label: 'Settings' },
        { icon: LogOut, label: 'Logout', onClick: handleLogout },
      ],
    },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = item.to ? location.pathname === item.to : false;

    if (item.onClick) {
      return (
        <Button
          key={item.label}
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start gap-3 w-full',
            isActive && 'bg-secondary font-medium'
          )}
          onClick={() => {
            item.onClick?.();
            onNavigate?.();
          }}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Button>
      );
    }

    return (
      <Button
        key={item.to}
        asChild
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'justify-start gap-3',
          isActive && 'bg-secondary font-medium'
        )}
        onClick={onNavigate}
      >
        <Link to={item.to!}>
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      </Button>
    );
  };

  return (
    <nav className="flex flex-col p-4 space-y-4">
      {navSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {section.title && (
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
          )}
          <div className="space-y-1">
            {section.items.map(renderNavItem)}
          </div>
          {sectionIndex < navSections.length - 1 && (
            <Separator className="mt-4" />
          )}
        </div>
      ))}
    </nav>
  );
}
