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
    const db = await getDB();
    const redis = getRedis();

    // 1. Idempotency Check
    // If we've already processed this key, return immediately
    const cachedResult = await redis.get(`idempotency:stock:${idempotencyKey}`);
    if (cachedResult) {
        console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
        return JSON.parse(cachedResult);
    }

    const inventoryCollection = db.collection('inventory');

    const reservedItems = [];
    let transactionFailed = false;

    // Sort items by ID to theoretically prevent DB-level deadlocks
    items.sort((a, b) => a.itemId.localeCompare(b.itemId));

    for (const item of items) {
        const { itemId, quantity } = item;
        let retries = 3;
        let itemProcessed = false;

        while (retries > 0 && !itemProcessed) {
            try {
                // 1. Fetch current document to get initial version
                const current = await inventoryCollection.findOne({ _id: new ObjectId(itemId) });
                if (!current) {
                    transactionFailed = true;
                    itemProcessed = true; // Break loop
                    break;
                }

                if (current.stock < quantity) {
                    transactionFailed = true;
                    itemProcessed = true;
                    break;
                }

                // 2. Perform Optimistic Update: Match ID and Version
                const result = await inventoryCollection.findOneAndUpdate(
                    {
                        _id: new ObjectId(itemId),
                        version: current.version,
                        stock: { $gte: quantity }
                    },
                    {
                        $inc: { stock: -quantity, version: 1 }
                    },
                    { returnDocument: 'after' }
                );

                if (result) {
                    reservedItems.push({
                        itemId,
                        quantity,
                        title: result.title,
                        remainingStock: result.stock
                    });
                    itemProcessed = true;
                } else {
                    // Possible version collision (another request won the lock)
                    console.log(`[Stock Service] Version collision for item ${itemId}. Retrying... (${retries - 1} left)`);
                    retries--;
                    if (retries === 0) transactionFailed = true;
                }

            } catch (error) {
                console.error(`[Stock Service] Error processing item ${itemId}:`, error);
                transactionFailed = true;
                itemProcessed = true;
                break;
            }
        }

        if (transactionFailed) break;
    }

    if (transactionFailed) {
        // COMPENSATING TRANSACTION (Rollback)
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
    const db = await getDB();
    const inventoryCollection = db.collection('inventory');
    return await inventoryCollection.find({}).toArray();
}

/**
 * Read-only check for stock availability
 * Does NOT decrement stock. Perfect for pre-checkout validation.
 */
async function checkStock(items) {
    const db = await getDB();
    const inventoryCollection = db.collection('inventory');

    for (const item of items) {
        const { itemId, quantity } = item;
        const record = await inventoryCollection.findOne({
            _id: new ObjectId(itemId),
            stock: { $gte: quantity }
        });

        if (!record) {
            throw new Error(`Insufficient stock or item not found for ID: ${itemId}`);
        }
    }

    return { available: true };
}

module.exports = {
    reserveStock,
    getInventory,
    checkStock
};
