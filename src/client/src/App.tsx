import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MealsPage from './pages/MealsPage';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Placeholder for new pages
const FoodsPage = () => <div>Foods Page Content</div>;
const GoalsPage = () => <div>Goals Page Content</div>;
const DashboardPage = () => <div>Dashboard Overview</div>; // Placeholder for a dedicated dashboard page

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Auth Layout Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Dashboard Layout Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/foods" element={<FoodsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          {/* Add other authenticated routes here */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
