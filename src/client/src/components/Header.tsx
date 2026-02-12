import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

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
        {isAuthenticated ? (
          <>
            <Link to="/meals" style={{ margin: '0 1rem', textDecoration: 'none', color: '#555' }}>Meals</Link>
            <button onClick={handleLogout} style={{
              marginLeft: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545', // Red color for logout
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ margin: '0 1rem', textDecoration: 'none', color: '#555' }}>Login</Link>
        )}
      </nav>
    </header>
  );
}
