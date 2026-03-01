import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase/firebase.config';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase listener for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const jwtToken = await user.getIdToken();
                const idTokenResult = await user.getIdTokenResult();

                // Get role from claims or default to student
                const role = idTokenResult.claims.role || 'student';

                setToken(jwtToken);
                setCurrentUser(user);
                setUserRole(role);

                // Sync with DB
                try {
                    const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api';
                    await fetch(`${gatewayUrl}/users/sync`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`
                        },
                        body: JSON.stringify({
                            displayName: user.displayName,
                            photoURL: user.photoURL
                        })
                    });
                } catch (e) {
                    console.error('User sync failed:', e);
                }
            } else {
                setCurrentUser(null);
                setToken(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Helper functions
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        token,
        login,
        loginWithGoogle,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Do not render app until Firebase confirms initial auth state */}
            {!loading && children}
        </AuthContext.Provider>
    );
};
