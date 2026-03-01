const express = require('express');
const router = express.Router();
const { getChaosState, toggleChaos } = require('../utils/chaos');

router.get('/health', (req, res) => {
    const isChaos = getChaosState();
    if (isChaos) {
        return res.status(500).json({ status: 'DOWN', chaos: true, service: 'gateway-service' });
    }
    res.status(200).json({ status: 'UP', service: 'gateway-service' });
});

router.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Gateway: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

module.exports = router;
