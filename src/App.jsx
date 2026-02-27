import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getIdToken } from './auth/useAuth';

function App() {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchToken() {
            const t = await getIdToken();
            setToken(t);
            setLoading(false);
        }

        fetchToken();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
                />
                <Route
                    path="/login"
                    element={<Login onLogin={(t) => setToken(t)} />}
                />
                <Route
                    path="/dashboard"
                    element={token ? <Dashboard token={token} /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;
