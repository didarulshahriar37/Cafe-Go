const express = require('express');
const router = express.Router();
const { getMetrics } = require('../utils/metrics');

router.get('/metrics', (req, res) => {
    res.json(getMetrics('stock-service'));
});

module.exports = router;
