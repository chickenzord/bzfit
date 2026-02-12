import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MealsPage from './pages/MealsPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

// Placeholder for new pages
const FoodsPage = () => <div>Foods Page Content</div>;
const GoalsPage = () => <div>Goals Page Content</div>;
const DashboardPage = () => <div>Dashboard Overview</div>; // Placeholder for a dedicated dashboard page

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public routes (Auth Layout) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes (Dashboard Layout) */}
        <Route element={<ProtectedRoute />}> {/* Wrap protected routes with ProtectedRoute */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/foods" element={<FoodsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            {/* Add other authenticated routes here */}
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
