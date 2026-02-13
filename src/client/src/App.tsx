import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MealsPage from './pages/MealsPage';
import RegisterPage from './pages/RegisterPage';
import JournalPage from './pages/JournalPage';
import FoodCatalogPage from './pages/FoodCatalogPage';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

// Placeholder for new pages
const GoalsPage = () => <div className="space-y-4"><p className="text-muted-foreground">Set and track your nutrition goals</p></div>;
const SettingsPage = () => <div className="space-y-4"><p className="text-muted-foreground">App settings and preferences</p></div>;

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
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/catalog/foods" element={<FoodCatalogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
