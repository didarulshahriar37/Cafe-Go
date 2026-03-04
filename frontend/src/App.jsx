import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

import StudentLayout from './layouts/StudentLayout';

import Login from './pages/shared/Login';
import MenuDashboard from './pages/student/MenuDashboard';
import OrderTracking from './pages/student/OrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes Wrapper */}

                    {/* Student-only Flow */}
                    <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                        <Route element={<StudentLayout />}>
                            <Route path="/" element={<MenuDashboard />} />
                            <Route path="/track/:orderId" element={<OrderTracking />} />
                        </Route>
                    </Route>

                    {/* Admin-only Flow */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route element={<StudentLayout />}>
                            <Route path="/admin/chaos" element={<AdminDashboard />} />
                        </Route>
                    </Route>

                </Routes>
            </Router>
        </AuthProvider>
    );
}
