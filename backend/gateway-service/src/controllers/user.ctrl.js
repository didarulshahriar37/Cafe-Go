const { getDB } = require('../db/mongo');
const { getFirebase } = require('../middleware/auth');

async function syncUser(req, res, next) {
    try {
        const { displayName, photoURL } = req.body;
        const { uid, email } = req.user;
        const db = getDB();
        const firebase = getFirebase();

        const ADMIN_EMAIL = 'admin@iut-cafe.com';
        const role = email === ADMIN_EMAIL ? 'admin' : 'student';

        // Update Firebase Custom Claims for token persistence
        await firebase.auth().setCustomUserClaims(uid, { role });

        // Sync with MongoDB
        await db.collection('users').updateOne(
            { uid },
            {
                $set: {
                    email,
                    displayName: displayName || email.split('@')[0],
                    photoURL: photoURL || null,
                    lastSync: new Date(),
                    role
                }
            },
            { upsert: true }
        );

        res.status(200).json({ success: true, role });
    } catch (error) {
        console.error('❌ User Sync Error:', error.message);
        res.status(500).json({ error: 'Failed to sync user' });
    }
}

module.exports = { syncUser };
