const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe-go-super-secret-key-2026';

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = await getDB();
        const user = await db.collection('users').findOne({ email: email.toLowerCase() });

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                uid: user._id.toString(),
                email: user.email,
                role: user.role || 'student'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                email: user.email,
                role: user.role,
                displayName: user.displayName
            }
        });

    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function verifyToken(req, res) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, decoded });
    } catch (err) {
        res.status(401).json({ valid: false, error: err.message });
    }
}

module.exports = { login, verifyToken };
