const express = require('express');
const router = express.Router();
const { getDB } = require('../db/mongo');
const { getRedis } = require('../db/redis');
const { getChaosState, toggleChaos } = require('../utils/chaos');

router.get('/health', async (req, res) => {
    try {
        if (getChaosState()) {
            return res.status(500).json({ status: 'DOWN', chaos: true, service: 'stock-service' });
        }

        const db = getDB();
        const redis = getRedis();

        // Check Connections
        await db.command({ ping: 1 });
        await redis.ping();

        res.status(200).json({ status: 'UP', service: 'stock-service' });
    } catch (error) {
        res.status(503).json({ status: 'DOWN', error: error.message });
    }
});

router.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Stock: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

module.exports = router;
