import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#f8f8f8',
      borderBottom: '1px solid #eee'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>BzFit</Link>
      </div>
      <nav>
        <Link to="/meals" style={{ margin: '0 1rem', textDecoration: 'none', color: '#555' }}>Meals</Link>
        <Link to="/settings" style={{ margin: '0 1rem', textDecoration: 'none', color: '#555' }}>Settings</Link>
        <button style={{
          marginLeft: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Logout
        </button>
      </nav>
    </header>
  );
}
