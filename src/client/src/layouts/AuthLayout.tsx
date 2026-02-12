import React from 'react';
import { Outlet } from 'react-router-dom';
import { Card, CardContent } from '@shared/components/ui/card';

/**
 * AuthLayout - Centered card layout for authentication pages
 *
 * Features:
 * - Centered small card (max-w-md) on all screen sizes
 * - Full viewport height background
 * - Mobile-first responsive padding
 *
 * TODO: CUSTOMIZE - Update background color/gradient when brand design is ready
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <Outlet /> {/* Renders LoginPage or RegisterPage */}
        </CardContent>
      </Card>
    </div>
  );
}
