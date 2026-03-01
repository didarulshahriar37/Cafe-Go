const { reserveStock, getInventory } = require('../services/stock.srv');

async function listItems(req, res, next) {
    try {
        const items = await getInventory();
        return res.status(200).json(items);
    } catch (error) {
        next(error);
    }
}

async function handleCheckout(req, res, next) {
    try {
        const { items } = req.body;
        const idempotencyKey = req.headers['idempotency-key'];

        if (!idempotencyKey) {
            return res.status(400).json({ error: 'Idempotency-Key header is required' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Array of items is required' });
        }

        const reservationResult = await reserveStock(items, idempotencyKey);

        return res.status(200).json({
            message: 'Stock successfully reserved.',
            data: reservationResult
        });
    } catch (error) {
        if (error.message.includes('Insufficient stock')) {
            return res.status(409).json({ error: 'Conflict', message: error.message });
        }
        next(error);
    }
}

module.exports = {
    handleCheckout,
    listItems
};
