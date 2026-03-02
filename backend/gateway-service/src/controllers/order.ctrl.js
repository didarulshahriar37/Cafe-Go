const { orchestrateOrder } = require('../services/order.srv');
const crypto = require('crypto'); // If no idempotency key provided, fallback to standard UUID creation

async function handlePlaceOrder(req, res, next) {
    try {
        const { items } = req.body;
        // Require Idempotency Key from client, otherwise generate one (though client SHOULD generate it)
        const idempotencyKey = req.headers['idempotency-key'] || crypto.randomUUID();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain valid items.' });
        }

        // Only students can place orders
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Acclaimed account type (Admin) is not permitted to place orders. Please use a student account.' });
        }

        // req.user is guaranteed to exist attached by the verifyAuthToken middleware
        const orderResult = await orchestrateOrder(req.user, items, idempotencyKey);

        return res.status(202).json(orderResult); // 202 Accepted because it's async via RabbitMQ

    } catch (error) {
        try {
            // Attempt to parse if it's the structured error thrown from orchestration
            const parsedError = JSON.parse(error.message);
            return res.status(parsedError.status).json(parsedError.data);
        } catch (_) {
            // Not JSON parsable, meaning it's a completely unexpected system crash
            console.error('❌ Gateway Order Flow Error:', error);
            next(error);
        }
    }
}

async function handleGetOrder(req, res, next) {
    try {
        const { id } = req.params;

        // 1. Try to fetch from Kitchen Service first (the source of truth for active orders)
        const kitchenUrl = process.env.KITCHEN_SERVICE_URL || 'http://127.0.0.1:3002';
        try {
            const response = await fetch(`${kitchenUrl}/orders/${id}`, { timeout: 3000 });
            if (response.ok) {
                const data = await response.json();
                return res.json(data);
            }
        } catch (err) {
            console.warn(`[Gateway] Kitchen Service unavailable, falling back to cache logic for ${id}`);
        }

        // 2. Fallback: Check Gateway-level idempotency cache in Redis
        // This is crucial for the first few seconds after placing an order before the kitchen picks it up
        const { safeRedisGet } = require('../db/redis-safe');
        const cacheKey = `gateway:idempotency:${id}`;
        const cachedResponse = await safeRedisGet(cacheKey);

        if (cachedResponse) {
            const parsed = JSON.parse(cachedResponse);
            console.log(`[Gateway] Tracking fallback: Found cached order for ID: ${id}`);
            // Adapt the cached placement data to match the expected tracking format
            return res.json({
                ...parsed.details,
                status: parsed.details.status || 'PENDING_KITCHEN',
                fromCache: true
            });
        }

        res.status(404).json({ error: 'Order not found.' });

    } catch (error) {
        console.error('❌ Gateway GetOrder Error:', error);
        next(error);
    }
}

module.exports = {
    handlePlaceOrder,
    handleGetOrder
};
