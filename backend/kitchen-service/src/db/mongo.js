const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error('❌ FATAL ERROR: MONGO_URI is not defined in environment variables.');
    throw new Error('MONGO_URI missing');
}

let client = null;
let dbInstance = null;

/**
 * Initialize the MongoDB connection natively
 * @param {string} dbName - The specific database name for this microservice (e.g., 'cafe_inventory')
 */
async function connectDB(dbName) {
    // Return early if already connected (reusable connection)
    if (dbInstance) {
        return dbInstance;
    }

    try {
        // Configure connection pool for scalability
        client = new MongoClient(uri, {
            maxPoolSize: 10, // Limits active connections
            minPoolSize: 2,  // Maintains 2 connections ready at all times
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        dbInstance = client.db(dbName);

        console.log(`✅ MongoDB Connected securely to DB: ${dbName}`);

        // Listen for unexpected connection drops
        client.on('close', () => {
            console.warn('⚠️ MongoDB connection closed unexpectedly.');
            dbInstance = null; // Forces health checks to fail and triggers reconnection on next call
        });

        return dbInstance;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        throw error;
    }
}

/**
 * Get the initialized database instance synchronously.
 * Must be called after connectDB() finishes.
 */
function getDB() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call connectDB() first during server startup.');
    }
    return dbInstance;
}

/**
 * Gracefully close the database connection.
 * Used during SIGTERM/SIGINT signals to prevent data corruption.
 */
async function closeDB() {
    if (client) {
        try {
            await client.close();
            console.log('🛑 MongoDB connection closed gracefully.');
            client = null;
            dbInstance = null;
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
            process.exit(1);
        }
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB
};
