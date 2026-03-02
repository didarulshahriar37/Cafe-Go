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

        const errors = [];
        let dbStatus = 'DOWN';
        let redisStatus = 'DOWN';

        try {
            const db = await getDB();
            await db.command({ ping: 1 });
            dbStatus = 'UP';
        } catch (e) {
            errors.push(`MongoDB: ${e.message}`);
        }

        try {
            const redis = getRedis();
            await redis.ping();
            redisStatus = 'UP';
        } catch (e) {
            errors.push(`Redis: ${e.message}`);
        }

        if (dbStatus === 'UP' && redisStatus === 'UP') {
            return res.status(200).json({ status: 'UP', service: 'stock-service', db: dbStatus, redis: redisStatus });
        }

        res.status(503).json({ status: 'DOWN', service: 'stock-service', db: dbStatus, redis: redisStatus, errors });
    } catch (error) {
        res.status(503).json({ status: 'DOWN', service: 'stock-service', error: error.message });
    }
});

router.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Stock: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

module.exports = router;
