const { safeRedisGet, safeRedisSetEx } = require('../db/redis-safe');
const { publishToQueue } = require('../db/rabbitmq');
const { checkStockWithCache } = require('./stock-cache.srv');

async function orchestrateOrder(user, items, idempotencyKey) {
    const cacheKey = `gateway:idempotency:${idempotencyKey}`;
    const cachedResponse = await safeRedisGet(cacheKey);
    if (cachedResponse) {
        console.log(`[Gateway] Found cached order for ID: ${idempotencyKey}`);
        return JSON.parse(cachedResponse);
    }

    // read-only availability check, safe to cache
    console.log(`[Gateway] Checking stock availability for items...`);
    await checkStockWithCache(items);

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
        throw new Error(JSON.stringify({
            status: response.status,
            data: stockData,
            message: `Gateway Reservation failed: ${stockData.message || response.statusText}`
        }));
    }

    // stock confirmed - publish to kitchen queue
    const orderPayload = {
        userId: user.uid,
        userEmail: user.email,
        idempotencyKey,
        reservedItems: stockData.data.items,
        status: 'PENDING_KITCHEN',
        timestamp: new Date().toISOString()
    };

    await publishToQueue('kitchen_orders', orderPayload);

    const finalResponse = {
        success: true,
        message: 'Order accepted and sent to kitchen',
        orderEstimate: '10-15 mins',
        details: orderPayload
    };

    await safeRedisSetEx(cacheKey, 60 * 60, JSON.stringify(finalResponse));

    return finalResponse;
}

module.exports = {
    orchestrateOrder
};
