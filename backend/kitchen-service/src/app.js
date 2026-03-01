const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { metricsMiddleware, getMetrics } = require('./utils/metrics');
const { chaosMiddleware, toggleChaos, getChaosState } = require('./utils/chaos');

const app = express();
app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    if (getChaosState()) {
        return res.status(500).json({ status: 'DOWN', chaos: true, service: 'kitchen-service' });
    }
    res.status(200).json({ status: 'UP', service: 'kitchen-service' });
});

app.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Kitchen: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

app.get('/metrics', (req, res) => {
    res.json(getMetrics('kitchen-service'));
});

module.exports = app;
