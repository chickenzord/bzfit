import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flexGrow: 1 }}>
        <Navbar />
        <main style={{ flexGrow: 1, padding: '2rem' }}>
          <Outlet /> {/* Renders the child route components */}
        </main>
      </div>
      <Footer />
    </div>
  );
}
