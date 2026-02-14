import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
 * - Mobile: Hamburger menu (top-left) opens navigation drawer
 * - Desktop: Persistent sidebar navigation
 * - Responsive header with user actions
 * - Footer
 *
 * TODO: CUSTOMIZE - Update layout spacing, sidebar width, and breakpoints
 */
export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Navigation - Sheet/Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Header
          mobileMenuTrigger={
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          }
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
        <main className="flex-1 overflow-y-auto dashboard-bg p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Renders child route components */}
        </main>
      </div>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
