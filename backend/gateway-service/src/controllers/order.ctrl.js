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

module.exports = {
    handlePlaceOrder
};
