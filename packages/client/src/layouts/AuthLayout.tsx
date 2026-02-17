import React from 'react';
import { Outlet } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AuthLayout - Centered card layout for authentication pages
 *
 * Modern, clean design with gradient background
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-8 sm:p-10">
            <Outlet /> {/* Renders LoginPage or RegisterPage */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
