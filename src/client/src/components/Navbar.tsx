import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{
      padding: '1rem 0',
      borderRight: '1px solid #eee',
      width: '200px',
      backgroundColor: '#f4f4f4'
    }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link to="/dashboard" style={{ display: 'block', padding: '0.5rem 2rem', textDecoration: 'none', color: '#333' }}>Dashboard</Link>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link to="/meals" style={{ display: 'block', padding: '0.5rem 2rem', textDecoration: 'none', color: '#333' }}>Meals</Link>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link to="/foods" style={{ display: 'block', padding: '0.5rem 2rem', textDecoration: 'none', color: '#333' }}>Foods</Link>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link to="/goals" style={{ display: 'block', padding: '0.5rem 2rem', textDecoration: 'none', color: '#333' }}>Goals</Link>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <Link to="/settings" style={{ display: 'block', padding: '0.5rem 2rem', textDecoration: 'none', color: '#333' }}>Settings</Link>
        </li>
      </ul>
    </nav>
  );
}
