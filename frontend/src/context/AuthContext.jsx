import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('cafe_token'));
    const [userRole, setUserRole] = useState(localStorage.getItem('cafe_user_role'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const savedUser = localStorage.getItem('cafe_user');
            if (token && savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };
        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        try {
            let gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://127.0.0.1:8080/api';
            if (!gatewayUrl.endsWith('/api')) {
                gatewayUrl = gatewayUrl.replace(/\/$/, '') + '/api';
            }

            const response = await axios.post(`${gatewayUrl}/login`, { email, password });
            const { token: jwtToken, user } = response.data;

            localStorage.setItem('cafe_token', jwtToken);
            localStorage.setItem('cafe_user_role', user.role);
            localStorage.setItem('cafe_user', JSON.stringify(user));

            setToken(jwtToken);
            setUserRole(user.role);
            setCurrentUser(user);

            return user;
        } catch (error) {
            console.error('Login failed:', error.response?.data?.error || error.message);
            throw new Error(error.response?.data?.error || 'Failed to login');
        }
    };

    const logout = () => {
        localStorage.removeItem('cafe_token');
        localStorage.removeItem('cafe_user_role');
        localStorage.removeItem('cafe_user');
        setToken(null);
        setCurrentUser(null);
        setUserRole(null);
    };

    const signup = async () => {
        throw new Error('Self-registration is disabled. Please contact admin.');
    };

    const value = {
        currentUser,
        userRole,
        token,
        login,
        logout,
        signup,
        loginWithGoogle: () => { throw new Error('Google Login is no longer supported'); }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
