import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <div className="flex flex-1">
        <Navbar />
        <main className="flex-1 p-6 bg-background">
          <Outlet /> {/* Renders the child route components */}
        </main>
      </div>
      <Footer />
    </div>
  );
}
