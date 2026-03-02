const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe-go-super-secret-key-2026';

/**
 * Express middleware to verify internal JWT tokens
 */
const verifyAuthToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No bearer token provided. Please log in to continue.'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET);

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role || 'student'
            };

            next();

        } catch (tokenError) {
            console.error('❌ Token Verification Error:', tokenError.message);
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token Expired',
                    message: 'Your session has expired. Please log in again.'
                });
            }
            return res.status(401).json({
                error: 'Invalid Token',
                message: 'The authentication token provided is invalid.'
            });
        }

    } catch (error) {
        console.error('❌ Authorization Middleware Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to authenticate user.'
        });
    }
};

module.exports = { verifyAuthToken };
