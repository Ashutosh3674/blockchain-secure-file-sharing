import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardView } from './AdminDashboardView';
import { UserDashboardView } from './UserDashboardView';

/**
 * 🎯 Dashboard.jsx
 * Intelligent RBAC Dashboard Router:
 * - Admin Users (role === 'admin'): Enterprise Administration Console (AdminDashboardView)
 * - Standard Users (role === 'user'): Decentralized User Workspace (UserDashboardView)
 */
export const Dashboard = ({ onShowToast }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <AdminDashboardView onShowToast={onShowToast} />;
  }

  return <UserDashboardView onShowToast={onShowToast} />;
};

export default Dashboard;
