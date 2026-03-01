const { getDB } = require('../db/mongo');
const { getRedis } = require('../db/redis');
const { ObjectId } = require('mongodb');

/**
 * Decrement stock safely and atomically utilizing MongoDB
 * 
 * @param {Array} items - Selected items e.g., [{ itemId: "...", quantity: 1 }]
 * @param {string} idempotencyKey - Unique key provided by client/gateway
 * @returns {Object} result - Success status and reserved items
 */
async function reserveStock(items, idempotencyKey) {
    const db = getDB();
    const redis = getRedis();

    // 1. Idempotency Check
    // If we've already processed this key, return immediately
    const cachedResult = await redis.get(`idempotency:stock:${idempotencyKey}`);
    if (cachedResult) {
        console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
        return JSON.parse(cachedResult);
    }

    const inventoryCollection = db.collection('inventory');

    // To prevent partial reservations (e.g., getting the burger but not the fries if fries are sold out).
    // In a full production system, this could happen via 2-phase commits or MongoDB transactions. 
    // Here we will use a quick transactional approach if inside a replica set, or iterate and verify beforehand.
    // For simplicity & robustness combining MongoDB and NodeJS: 
    // We check availability first, then try to apply bulk modifications atomically.

    // Using a MongoDB Session Transaction ensures ATOMIC updates. If any stock update fails 
    // (like not matching the $gte condition), we abort everything.
    const client = db.client; // Need to expose client or rely on it from db.mongo.js. Wait, our `getDB` only returns `dbInstance`.
    // Let's rely on standard atomic Operations with rollback if failed.

    // Alternative approach: Verify all first (read-heavy), then reserve all.
    // However, that might introduce race conditions between read and write.
    // The MOST robust way without sessions is to sort by ID (prevent deadlocks), then decrement item by item checking $gte.

    const reservedItems = [];
    let transactionFailed = false;

    // Sort items by ID to theoretically prevent DB-level deadlocks
    items.sort((a, b) => a.itemId.localeCompare(b.itemId));

    for (const item of items) {
        const { itemId, quantity } = item;

        try {
            // THE CONCURRENCY CONTROL:
            // This query ONLY matches a document if the stock is AT LEAST the required quantity.
            // If another instance decrements stock first and it drops below 'quantity',
            // this update will silently return modifiedCount = 0.
            const result = await inventoryCollection.findOneAndUpdate(
                { _id: new ObjectId(itemId), stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { returnDocument: 'after' } // Returns the updated document
            );

            if (!result.value) {
                // If it returns null, it means there either isn't enough stock or the item doesn't exist.
                transactionFailed = true;
                break;
            }

            reservedItems.push({
                itemId,
                quantity,
                title: result.value.title,
                remainingStock: result.value.stock
            });

        } catch (error) {
            transactionFailed = true;
            break;
        }
    }

    if (transactionFailed) {
        // COMPENSATING TRANSACTION (Rollback)
        // Release back anything we successfully reserved before the failure hit.
        for (const reserved of reservedItems) {
            await inventoryCollection.updateOne(
                { _id: new ObjectId(reserved.itemId) },
                { $inc: { stock: reserved.quantity } }
            );
        }
        throw new Error('Insufficient stock or concurrency collision occurred during checkout.');
    }

    const finalResponse = { success: true, items: reservedItems };

    // Set idempotency key expiring in 24 hours
    await redis.setEx(`idempotency:stock:${idempotencyKey}`, 60 * 60 * 24, JSON.stringify(finalResponse));

    return finalResponse;
}

async function getInventory() {
    const db = getDB();
    const inventoryCollection = db.collection('inventory');
    return await inventoryCollection.find({}).toArray();
}

module.exports = {
    reserveStock,
    getInventory
};
