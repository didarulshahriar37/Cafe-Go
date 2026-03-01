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

const app = express();

app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
// Exclude proxy routes from body-parser since proxying requires streaming bodies
app.use(morgan('combined'));

// Standard routes
app.use('/', healthRoute);
app.use('/', metricsRoute);

// Order flow logic (with JSON parser since this route expects req.body)
app.use('/api', express.json(), apiRoutes);

// Reverse Proxy for catalog browsing (no business logic in Gateway for this)
// Routes directly to stock-service
app.use('/api/stock', createProxyMiddleware({
    target: process.env.STOCK_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true
}));

app.use((err, req, res, next) => {
    console.error('Unhandled Gateway Error:', err);
    res.status(500).json({ error: 'Internal Gateway Error' });
});

module.exports = app;
