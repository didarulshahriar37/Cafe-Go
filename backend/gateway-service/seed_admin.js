require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const credPath = process.env.FIREBASE_ADMIN_CREDENTIALS
    ? path.resolve(process.cwd(), process.env.FIREBASE_ADMIN_CREDENTIALS)
    : path.resolve(__dirname, './src/config/firebase-admin-key.json');

if (!fs.existsSync(credPath)) {
    console.error(`❌ Credentials not found at ${credPath}`);
    process.exit(1);
}

const serviceAccount = require(credPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
    const email = 'admin@iut-cafe.com';
    const password = 'admin@cafego';

    try {
        // Try to find user first
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log(`✅ Admin user already exists with UID: ${user.uid}`);
        } catch (e) {
            // User does not exist, create it
            user = await admin.auth().createUser({
                email,
                password,
                displayName: 'CafeGo Admin',
                emailVerified: true
            });
            console.log(`✅ Created new Admin user with UID: ${user.uid}`);
        }

        // Set custom claims if needed later (though our sync handles it by email for now)
        await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
        console.log('✅ Admin custom claims set successfully.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to create admin:', err);
        process.exit(1);
    }
}

createAdmin();
