const { safeRedisGet, safeRedisSetEx } = require('../db/redis-safe');
const { publishToQueue } = require('../db/rabbitmq');
const { checkStockWithCache } = require('./stock-cache.srv');

async function orchestrateOrder(user, items, idempotencyKey) {
    // 1. Gateway-Level Check: Deduplication / Idempotency 
    // If the client retries, we can capture it here before even making HTTP calls to stock
    // But stock-service is also idempotent. Gateway checking means we save network hops.
    const cacheKey = `gateway:idempotency:${idempotencyKey}`;
    const cachedResponse = await safeRedisGet(cacheKey);
    if (cachedResponse) {
        console.log(`[Gateway] Found cached order for ID: ${idempotencyKey}`);
        return JSON.parse(cachedResponse);
    }

    // 2. Stock Availability Check with Redis Caching (TTL 60s)
    // This is a read-only check safe to cache, unlike the write-heavy checkout
    console.log(`[Gateway] Checking stock availability for items...`);
    await checkStockWithCache(items);

    // 3. HTTP Call to Stock Service for Actual Reservation
    const stockUrl = process.env.STOCK_SERVICE_URL || 'http://127.0.0.1:3001';

    console.log(`[Gateway Order] Reserving stock at ${stockUrl}/checkout for ID: ${idempotencyKey}`);
    const response = await fetch(`${stockUrl}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ items })
    });

    const stockData = await response.json();

    if (!response.ok) {
        // Stock reservation failed (e.g., 409 Conflict - Insufficient stock)
        throw new Error(JSON.stringify({
            status: response.status,
            data: stockData,
            message: `Gateway Reservation failed: ${stockData.message || response.statusText}`
        }));
    }

    // 4. Stock Resereved Successfully -> Publish to RabbitMQ
    // The Kitchen Service will pick this up and actually process the real order
    const orderPayload = {
        userId: user.uid,
        userEmail: user.email,
        idempotencyKey,
        reservedItems: stockData.data.items, // the successfully reserved things
        status: 'PENDING_KITCHEN',
        timestamp: new Date().toISOString()
    };

    await publishToQueue('kitchen_orders', orderPayload);

    // 5. Cache the success response at edge to stop retries dead in their tracks
    const finalResponse = {
        success: true,
        message: 'Order accepted and sent to kitchen',
        orderEstimate: '10-15 mins', // Usually kitchen predicts this, but hardcoded for now
        details: orderPayload
    };

    await safeRedisSetEx(cacheKey, 60 * 60, JSON.stringify(finalResponse));

    return finalResponse;
}

module.exports = {
    orchestrateOrder
};
