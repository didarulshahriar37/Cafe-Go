const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { metricsMiddleware, getMetrics } = require('./utils/metrics');
const { chaosMiddleware, toggleChaos, getChaosState } = require('./utils/chaos');

// Database and Infrastructure Connections
const { getDB, connectDB } = require('./db/mongo');
const { connectRabbitMQ, startConsuming } = require('./db/rabbitmq');
const { processOrder } = require('./services/kitchen.srv');

async function initKitchen() {
    await connectDB('cafe_orders').catch(err => console.error('Kitchen DB connection failed:', err));
    const channel = await connectRabbitMQ().catch(err => console.warn('Kitchen RabbitMQ connection failed.'));
    if (channel) {
        await startConsuming(processOrder).catch(err => console.error('Kitchen consumer start failed:', err));
    }
}

initKitchen();

const app = express();
app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route for deployment verification
app.get('/', (req, res) => res.json({ status: 'Kitchen Service is Live' }));

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

app.get('/orders/:id', async (req, res) => {
    try {
        const db = getDB();
        const order = await db.collection('orders').findOne({ idempotencyKey: req.params.id });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
