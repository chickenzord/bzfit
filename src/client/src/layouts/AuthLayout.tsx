import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background font-sans">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <Outlet /> {/* Renders the child route components (Login/Register) */}
      </div>
    </div>
  );
}
