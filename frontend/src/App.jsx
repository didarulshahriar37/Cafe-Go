import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import Login from './pages/shared/Login';

// Placeholder purely to display the Logout button for testing
import { useAuth } from './context/AuthContext';
const DummyDashboard = () => {
    const { currentUser, logout, token } = useAuth();
    return (
        <div className="p-10 bg-slate-900 min-h-screen text-white">
            <h1 className="text-3xl text-amber-400 mb-4">Dashboard</h1>
            <p>Welcome, {currentUser?.email}</p>
            <button
                onClick={logout}
                className="mt-6 px-4 py-2 bg-rose-500 rounded text-slate-900 font-bold hover:bg-rose-400"
            >
                Log Out
            </button>
            <p className="mt-10 text-xs text-slate-500 max-w-xl break-all">RAW JWT TOKEN FOR HEADERS: {token}</p>
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<DummyDashboard />} />
                        {/* the rest of our Admin and Student pages will go here! */}
                    </Route>

                </Routes>
            </Router>
        </AuthProvider>
    );
}
