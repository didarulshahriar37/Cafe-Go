const { orchestrateOrder } = require('../services/order.srv');
const crypto = require('crypto'); // If no idempotency key provided, fallback to standard UUID creation

async function handlePlaceOrder(req, res, next) {
    try {
        const { items } = req.body;
        const idempotencyKey = req.headers['idempotency-key'] || crypto.randomUUID();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain valid items.' });
        }

        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Acclaimed account type (Admin) is not permitted to place orders. Please use a student account.' });
        }

        const orderResult = await orchestrateOrder(req.user, items, idempotencyKey);

        return res.status(202).json(orderResult); // 202 because order is async via RabbitMQ

    } catch (error) {
        try {
            const parsedError = JSON.parse(error.message);
            return res.status(parsedError.status).json(parsedError.data);
        } catch (_) {
            console.error('❌ Gateway Order Flow Error:', error);
            next(error);
        }
    }
}

async function handleGetOrder(req, res, next) {
    try {
        const { id } = req.params;

        // try kitchen first; it's source of truth for active orders
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

        // fallback: check gateway idempotency cache - useful right after placing before kitchen picks it up
        const { safeRedisGet } = require('../db/redis-safe');
        const cacheKey = `gateway:idempotency:${id}`;
        const cachedResponse = await safeRedisGet(cacheKey);

        if (cachedResponse) {
            const parsed = JSON.parse(cachedResponse);
            console.log(`[Gateway] Tracking fallback: Found cached order for ID: ${id}`);
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
