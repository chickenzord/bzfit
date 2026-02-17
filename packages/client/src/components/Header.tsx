import React, { useState } from 'react';
import { ArrowLeft, Search, MoreVertical, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Header - Mobile-first app header
 *
 * Features:
 * - Left: Hamburger (top level) or Back button (detail view)
 * - Center: Page title
 * - Right: Search, 3-dots menu, notifications (customizable per page)
 * - Expandable search overlay
 */

interface HeaderAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  badge?: number;
}

interface HeaderProps {
  // Navigation
  leftButton?: React.ReactNode; // Hamburger or back button from layout
  title?: string;

  // Search
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  // Actions
  actions?: HeaderAction[];
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function Header({
  leftButton,
  title,
  showSearch,
  searchPlaceholder = 'Search...',
  onSearch,
  actions,
  showNotifications = true,
  notificationCount,
}: HeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleSearchClose = () => {
    setSearchExpanded(false);
    setSearchQuery('');
    onSearch?.('');
  };

  // Search overlay mode
  if (searchExpanded) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="flex h-14 items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchClose}
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
              autoFocus
            />
          </form>
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchClose}
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
    );
  }

  // Normal header mode
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Navigation button */}
        <div className="flex items-center">
          {leftButton}
        </div>

        {/* Center: Title */}
        {title && (
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold truncate max-w-[50%]">
            {title}
          </h1>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search icon */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchExpanded(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Custom actions via 3-dots menu */}
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          {showNotifications && (
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {notificationCount && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
