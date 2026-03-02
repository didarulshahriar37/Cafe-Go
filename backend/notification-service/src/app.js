const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { metricsMiddleware, getMetrics } = require('./utils/metrics');
const { chaosMiddleware, toggleChaos, getChaosState } = require('./utils/chaos');

// Infrastructure Connections
const { connectRabbitMQ, startConsuming } = require('./db/rabbitmq');
const { notifyStatusUpdate } = require('./socket');

async function initNotification() {
    await connectRabbitMQ().catch(err => console.warn('Notification RabbitMQ failed.'));
    // Consumer setup
    startConsuming(notifyStatusUpdate);
}

initNotification();

const app = express();
app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route for deployment verification
app.get('/', (req, res) => res.json({ status: 'Notification Service is Live' }));

app.get('/health', (req, res) => {
    if (getChaosState()) {
        return res.status(500).json({ status: 'DOWN', chaos: true, service: 'notification-service' });
    }
    res.status(200).json({ status: 'UP', service: 'notification-service' });
});

app.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Notifications: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

app.get('/metrics', (req, res) => {
    res.json(getMetrics('notification-service'));
});

module.exports = app;
