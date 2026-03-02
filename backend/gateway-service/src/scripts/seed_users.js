require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const students = [
    { email: 'didarul@iut-dhaka.edu', pass: '230042137' },
    { email: 'ashfaque@iut-dhaka.edu', pass: '230042102' },
    { email: 'saimon@iut-dhaka.edu', pass: '230042103' },
    { email: 'shifat@iut-dhaka.edu', pass: '230042156' },
    { email: 'arafat@iut-dhaka.edu', pass: '230042151' },
    { email: 'ifham@iut-dhaka.edu', pass: '230042112' },
    { email: 'admin@iut-cafe.com', pass: 'admin123', role: 'admin' }
];

async function seed() {
    try {
        await client.connect();
        const db = client.db('cafe_platform');
        const usersCol = db.collection('users');

        for (const user of students) {
            const hashedPassword = await bcrypt.hash(user.pass, 10);
            await usersCol.updateOne(
                { email: user.email },
                {
                    $set: {
                        email: user.email,
                        password: hashedPassword,
                        role: user.role || 'student',
                        displayName: user.email.split('@')[0],
                        lastSync: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Seeded: ${user.email}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
