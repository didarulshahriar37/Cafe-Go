import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase/firebase.config';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase listener for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get the JWT token immediately upon login
                // Parameter 'true' isn't necessary unless we want to force refresh, 
                // Firebase automatically manages the 1-hour expiration cycle in the background.
                const jwtToken = await user.getIdToken();
                setToken(jwtToken);
                setCurrentUser(user);

                // Keep the token fresh. Firebase automatically refreshes the token behind the scenes, 
                // but we need to update our React State when it does.
                user.getIdTokenResult(false).then((idTokenResult) => {
                    setToken(idTokenResult.token);
                });

            } else {
                setCurrentUser(null);
                setToken(null);
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

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        token, // Raw JWT to attach to Axios headers
        login,
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
