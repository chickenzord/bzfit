import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shared/components/ui/sheet';
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
      <Header />

      <div className="flex flex-1">
        {/* Mobile Navigation - Sheet/Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <Navbar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation - Sidebar */}
        <aside className="hidden md:block w-64 border-r bg-card">
          <Navbar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Renders child route components */}
        </main>
      </div>

      <Footer />
    </div>
  );
}
