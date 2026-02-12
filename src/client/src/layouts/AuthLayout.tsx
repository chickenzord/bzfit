import React from 'react';
import { Outlet } from 'react-router-dom';
import { Card, CardContent } from '../../../shared/components/ui/card'; // Import Card components

export default function AuthLayout() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background font-sans">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Outlet /> {/* Renders the child route components (Login/Register) */}
        </CardContent>
      </Card>
    </div>
  );
}
