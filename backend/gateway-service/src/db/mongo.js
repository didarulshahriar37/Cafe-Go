const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

let dbInstance = null;
let client = null;

async function connectDB(dbName = 'cafe_platform') {
    if (dbInstance) return dbInstance;
    try {
        client = new MongoClient(uri);
        await client.connect();
        dbInstance = client.db(dbName);
        console.log('✅ Gateway Connected to MongoDB');
        return dbInstance;
    } catch (error) {
        console.error('❌ Gateway MongoDB Connection Error:', error);
        process.exit(1);
    }
}

function getDB() {
    if (!dbInstance) throw new Error('DB not initialized');
    return dbInstance;
}

module.exports = { connectDB, getDB };