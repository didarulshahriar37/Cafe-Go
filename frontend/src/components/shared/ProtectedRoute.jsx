import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
    const { currentUser } = useAuth();

    // If no user is logged in, redirect them immediately to the /login page
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the child routes natively
    return <Outlet />;
};
