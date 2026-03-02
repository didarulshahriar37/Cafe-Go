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

// Database and Infrastructure Connections (Idempotent for Serverless)
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

// Root route for deployment verification
app.get('/', (req, res) => res.json({ status: 'Gateway Service is Live' }));

// Standard routes
app.use('/', healthRoute);
app.use('/', metricsRoute);

// Reverse Proxy for catalog browsing (no business logic in Gateway for this)
// Routes directly to stock-service
// We put this BEFORE express.json() to prevent body-parser from consuming the stream
// Reverse Proxy for catalog browsing
app.use(createProxyMiddleware({
    pathFilter: '/api/stock',
    target: process.env.STOCK_SERVICE_URL || 'http://127.0.0.1:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/stock': '' }
}));

// Route /api/login to dedicated Identity Service
// Route /api/login to dedicated Identity Service
app.use(createProxyMiddleware({
    pathFilter: '/api/login',
    target: process.env.IDENTITY_SERVICE_URL || 'http://127.0.0.1:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/login': '/login' }
}));

// Order flow logic (with JSON parser since this route expects req.body)
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
