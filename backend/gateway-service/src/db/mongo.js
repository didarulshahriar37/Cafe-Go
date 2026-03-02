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
        throw error;
    }
}

/**
 * Lazy-connect getDB for Vercel serverless compatibility.
 * Auto-connects if not already initialized.
 */
async function getDB(dbName = 'cafe_platform') {
    if (!dbInstance) {
        await connectDB(dbName);
    }
    return dbInstance;
}

module.exports = { connectDB, getDB };