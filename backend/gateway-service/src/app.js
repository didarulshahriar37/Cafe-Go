const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiRoutes = require('./routes/index');
const healthRoute = require('./routes/health');
const metricsRoute = require('./routes/metrics');

const { metricsMiddleware } = require('./utils/metrics');
const { chaosMiddleware } = require('./utils/chaos');

const { connectRedis } = require('./db/redis');
const { connectRabbitMQ } = require('./db/rabbitmq');

connectRedis().catch(err => console.warn('Redis not available initially.'));
connectRabbitMQ().catch(err => console.warn('RabbitMQ not available initially.'));

const app = express();

app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
// Exclude proxy routes from body-parser since proxying requires streaming bodies
app.use(morgan('combined'));

app.get('/', (req, res) => res.json({ status: 'Gateway Service is Live' }));

app.use('/', healthRoute);
app.use('/', metricsRoute);

// proxy to stock-service - must come before express.json() or body gets consumed
app.use(createProxyMiddleware({
    pathFilter: '/api/stock',
    target: process.env.STOCK_SERVICE_URL || 'http://127.0.0.1:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/stock': '' }
}));

app.use(createProxyMiddleware({
    pathFilter: '/api/login',
    target: process.env.IDENTITY_SERVICE_URL || 'http://127.0.0.1:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/login': '/login' }
}));

app.use('/api', express.json(), apiRoutes);

app.use((err, req, res, next) => {
    console.error('❌ Unhandled Gateway Error:', err.message || err);
    if (err.stack) console.error(err.stack);
    res.status(500).json({
        error: 'Internal Gateway Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
