import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🍽️ BzFit - Calorie Tracker</h1>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Self-hosted calorie tracking application
      </p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Links</h2>
        <ul style={{ marginTop: '1rem', listStyle: 'none' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/login">Login</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/meals">Meals</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              API Documentation
            </a>
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          <strong>Status:</strong> Frontend skeleton ready. Backend API available at /api/v1/*
        </p>
      </div>
    </div>
  );
}
