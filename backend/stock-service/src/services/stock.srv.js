const { getDB } = require('../db/mongo');
const { getRedis } = require('../db/redis');
const { ObjectId } = require('mongodb');

// decrement stock atomically using optimistic locking
async function reserveStock(items, idempotencyKey) {
    const db = await getDB();
    const redis = getRedis();

    const cachedResult = await redis.get(`idempotency:stock:${idempotencyKey}`);
    if (cachedResult) {
        console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
        return JSON.parse(cachedResult);
    }

    const inventoryCollection = db.collection('inventory');

    const reservedItems = [];
    let transactionFailed = false;

    // sort by id to avoid potential deadlocks under concurrent load
    items.sort((a, b) => a.itemId.localeCompare(b.itemId));

    for (const item of items) {
        const { itemId, quantity } = item;
        let retries = 3;
        let itemProcessed = false;

        while (retries > 0 && !itemProcessed) {
            try {
                const current = await inventoryCollection.findOne({ _id: new ObjectId(itemId) });
                if (!current) {
                    transactionFailed = true;
                    itemProcessed = true;
                    break;
                }

                if (current.stock < quantity) {
                    transactionFailed = true;
                    itemProcessed = true;
                    break;
                }

                // match on version too - if someone else updated first this returns null and we retry
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
        // roll back anything we already decremented
        for (const reserved of reservedItems) {
            await inventoryCollection.updateOne(
                { _id: new ObjectId(reserved.itemId) },
                { $inc: { stock: reserved.quantity } }
            );
        }
        throw new Error('Insufficient stock or concurrency collision occurred during checkout.');
    }

    const finalResponse = { success: true, items: reservedItems };

    // cache result for 24h so duplicate requests are short-circuited
    await redis.setEx(`idempotency:stock:${idempotencyKey}`, 60 * 60 * 24, JSON.stringify(finalResponse));

    return finalResponse;
}

async function getInventory() {
    const db = await getDB();
    const inventoryCollection = db.collection('inventory');
    return await inventoryCollection.find({}).toArray();
}

// read-only check - does not modify stock
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
