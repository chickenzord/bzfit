import React from 'react';

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-foreground">🍽️ BzFit - Calorie Tracker</h1>
      <p className="mt-4 text-muted-foreground">
        Self-hosted calorie tracking application
      </p>

      <div className="mt-8 p-4 bg-muted rounded-md shadow-sm">
        <p className="text-sm text-muted-foreground">
          <strong>Status:</strong> Frontend skeleton ready. Backend API available at /api/v1/*
        </p>
      </div>
    </div>
  );
}
