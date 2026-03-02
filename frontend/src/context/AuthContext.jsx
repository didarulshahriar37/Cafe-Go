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
                    let gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || '';
                    if (import.meta.env.MODE === 'production' && !gatewayUrl) {
                        // nothing configured; skip sync to avoid network errors
                        console.warn('Skipping user sync – no API gateway URL in production');
                    } else {
                        // ensure we have the /api prefix
                        if (!gatewayUrl.endsWith('/api')) {
                            gatewayUrl = gatewayUrl.replace(/\/$/, '') + '/api';
                        }
                        const res = await fetch(`${gatewayUrl}/users/sync`, {
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
                        if (!res.ok) {
                            // log details but don't throw – we don't want the
                            // entire app to crash just because the sync endpoint
                            // returned a 500.  The error is already visible in
                            // browser devtools/network tab.
                            console.warn('User sync returned non-OK status', res.status, await res.text());
                        }
                    }
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
