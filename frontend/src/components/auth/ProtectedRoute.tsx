import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'farmer' | 'buyer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userRole } = useApp();
  const location = useLocation();

  // If user is not authenticated, redirect to login with return path and intended role
  if (!currentUser) {
    const intendedRole = requiredRole || (location.pathname.startsWith('/farmer') ? 'farmer' : 'buyer');
    return <Navigate to={`/login?role=${intendedRole}&redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};
