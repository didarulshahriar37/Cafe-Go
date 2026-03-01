const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { metricsMiddleware, getMetrics } = require('./utils/metrics');

const app = express();
app.use(metricsMiddleware);
app.use(helmet());
app.use(cors());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'notification-service' });
});

app.get('/metrics', (req, res) => {
    res.json(getMetrics('notification-service'));
});

module.exports = app;
