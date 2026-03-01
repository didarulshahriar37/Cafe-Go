const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { metricsMiddleware, getMetrics } = require('./utils/metrics');

const app = express();
app.use(metricsMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'kitchen-service' });
});

app.get('/metrics', (req, res) => {
    res.json(getMetrics('kitchen-service'));
});

module.exports = app;
