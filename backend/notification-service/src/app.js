const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');

const app = express();
app.use(helmet());
app.use(cors());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'notification-service' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

module.exports = app;
