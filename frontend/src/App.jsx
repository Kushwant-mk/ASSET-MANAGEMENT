import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Bookings from './pages/Bookings';
import MyBookings from './pages/MyBookings';
import History from './pages/History';
import AuditLogs from './pages/AuditLogs';
import Spinner from './components/ui/Spinner';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/assets" replace />;
  return children;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? '/dashboard' : '/assets'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/assets" /> : <Register />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to={isAdmin ? '/dashboard' : '/assets'} replace />} />
        <Route path="dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
        <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}