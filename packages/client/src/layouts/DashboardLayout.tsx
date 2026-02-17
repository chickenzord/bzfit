import React, { useState, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * DashboardLayout - Main layout for authenticated pages
 *
 * Features:
 * - Mobile: Hamburger menu (top-left) opens navigation drawer or back button for detail views
 * - Desktop: Persistent sidebar navigation
 * - Responsive header with user actions
 * - Context for pages to control header behavior
 */

interface HeaderContextType {
  title?: string;
  showBack: boolean;
  showSearch: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: Array<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }>;
  notificationCount?: number;
  setHeaderConfig: (config: Partial<Omit<HeaderContextType, 'setHeaderConfig'>>) => void;
  goBack: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within DashboardLayout');
  }
  return context;
}

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Header state
  const [headerConfig, setHeaderConfigState] = useState<Omit<HeaderContextType, 'setHeaderConfig' | 'goBack'>>({
    title: undefined,
    showBack: false,
    showSearch: false,
    searchPlaceholder: 'Search...',
    notificationCount: 3,
  });

  const setHeaderConfig = (config: Partial<Omit<HeaderContextType, 'setHeaderConfig' | 'goBack'>>) => {
    setHeaderConfigState((prev) => ({ ...prev, ...config }));
  };

  const goBack = () => {
    navigate(-1);
    setHeaderConfig({ showBack: false });
  };

  const leftButton = headerConfig.showBack ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={goBack}
      aria-label="Go back"
      className="md:hidden"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  ) : (
    <SheetTrigger asChild className="md:hidden">
      <Button variant="ghost" size="icon" aria-label="Open navigation menu">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>
  );

  return (
    <HeaderContext.Provider value={{ ...headerConfig, setHeaderConfig, goBack }}>
      <div className="flex min-h-screen flex-col">
        {/* Mobile Navigation - Sheet/Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <Header
            leftButton={leftButton}
            title={headerConfig.title}
            showSearch={headerConfig.showSearch}
            searchPlaceholder={headerConfig.searchPlaceholder}
            onSearch={headerConfig.onSearch}
            actions={headerConfig.actions}
            notificationCount={headerConfig.notificationCount}
          />
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-xl font-bold">BzFit</SheetTitle>
            </SheetHeader>
            <Navbar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1">
          {/* Desktop Navigation - Sidebar */}
          <aside className="hidden md:block w-64 border-r bg-card">
            <Navbar />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto dashboard-bg p-3 md:p-4 lg:p-6">
            <Outlet /> {/* Renders child route components */}
          </main>
        </div>

        {/* Footer - Hidden on mobile */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    </HeaderContext.Provider>
  );
}
