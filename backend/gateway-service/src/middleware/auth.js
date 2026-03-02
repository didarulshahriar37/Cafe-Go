const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Lazy initialization of Firebase Admin to handle environment loading gracefully
let firebaseApp = null;
function getFirebase() {
    if (!firebaseApp) {
        const credentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
        let serviceAccount;

        try {
            // 1. Try to parse as JSON string (standard Vercel/Cloud practice)
            if (credentials && (credentials.startsWith('{') || credentials.startsWith('['))) {
                serviceAccount = JSON.parse(credentials);
            } else {
                // 2. Fallback to file path
                const credPath = credentials
                    ? path.resolve(process.cwd(), credentials)
                    : path.resolve(__dirname, '../config/firebase-admin-key.json');

                if (fs.existsSync(credPath)) {
                    serviceAccount = require(credPath);
                } else {
                    console.error(`❌ FATAL ERROR: Firebase admin credentials not found at ${credPath}`);
                    // Don't process.exit(1) in serverless, return null or throw
                    throw new Error('Firebase credentials missing');
                }
            }

            if (!admin.apps.length) {
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('✅ Firebase Admin SDK Initialized.');
            } else {
                firebaseApp = admin.app();
            }
        } catch (error) {
            console.error('❌ Failed to initialize Firebase:', error.message);
            throw error;
        }
    }
    return admin;
}

/**
 * Express middleware to verify Firebase authentication tokens
 */
const verifyAuthToken = async (req, res, next) => {
    try {
        // 1. Check if the Authorization header is present
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No bearer token provided. Please log in to continue.'
            });
        }

        // 2. Extract the JWT string
        const idToken = authHeader.split('Bearer ')[1];

        // 3. Verify the token using Firebase Admin
        const firebase = getFirebase();

        try {
            const decodedToken = await firebase.auth().verifyIdToken(idToken);

            // 4. Attach the verified user payload to the Express request object
            // This makes `req.user` globally available to any route following this middleware
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role || 'student', // Custom claim fallback
                email_verified: decodedToken.email_verified
            };

            next(); // Hand off control to the actual route handler (Controller)

        } catch (tokenError) {
            // 5. Handle Expired and Malformed Tokens Specifically
            if (tokenError.code === 'auth/id-token-expired') {
                return res.status(401).json({
                    error: 'Token Expired',
                    message: 'Your login session has expired. Please refresh your token or log in again.'
                });
            }
            if (tokenError.code === 'auth/argument-error' || tokenError.code === 'auth/invalid-id-token') {
                return res.status(401).json({
                    error: 'Invalid Token',
                    message: 'The authentication token provided is malformed or forged.'
                });
            }

            // Re-throw unhandled errors to generic catch block
            throw tokenError;
        }

    } catch (error) {
        console.error('❌ Authorization Middleware Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to authenticate user due to a server-side error.'
        });
    }
};

module.exports = {
    verifyAuthToken
};
