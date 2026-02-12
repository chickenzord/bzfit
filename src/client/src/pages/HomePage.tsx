import React from 'react';

export default function HomePage() {
  return (
    <div>
      <h1>🍽️ BzFit - Calorie Tracker</h1>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Self-hosted calorie tracking application
      </p>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          <strong>Status:</strong> Frontend skeleton ready. Backend API available at /api/v1/*
        </p>
      </div>
    </div>
  );
}
