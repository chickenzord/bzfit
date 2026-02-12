import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '1rem 2rem',
      marginTop: 'auto', // Pushes footer to the bottom
      backgroundColor: '#f8f8f8',
      borderTop: '1px solid #eee',
      fontSize: '0.8rem',
      color: '#777'
    }}>
      © {new Date().getFullYear()} BzFit. All rights reserved.
    </footer>
  );
}
