const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const stockRoutes = require('./routes/index');
const healthRoute = require('./routes/health');
const metricsRoute = require('./routes/metrics');

const { metricsMiddleware } = require('./utils/metrics');
const { chaosMiddleware } = require('./utils/chaos');

const app = express();

// Middleware
app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRoute);
app.use('/', metricsRoute);
app.use('/', stockRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
