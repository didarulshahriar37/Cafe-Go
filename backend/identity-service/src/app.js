const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { metricsMiddleware, getMetrics, resetMetrics } = require('./utils/metrics');
const { chaosMiddleware, toggleChaos, getChaosState } = require('./utils/chaos');
const authCtrl = require('./controllers/auth.ctrl');

const app = express();

// Rate Limiter for Login (Bonus Challenge)
// Restricts to 3 attempts per minute per email/IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.body.email || req.ip,
    message: { error: 'Too many login attempts. Please try again after a minute.' },
    skip: (req) => process.env.NODE_ENV === 'test'
});

// Middleware
app.use(metricsMiddleware);
app.use(chaosMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Public Routes
app.post('/login', loginLimiter, authCtrl.login);
app.post('/verify', authCtrl.verifyToken);

// Observability
app.get('/health', (req, res) => {
    if (getChaosState()) {
        return res.status(500).json({ status: 'DOWN', chaos: true, service: 'identity-service' });
    }
    res.status(200).json({ status: 'UP', service: 'identity-service' });
});

app.post('/chaos/toggle', (req, res) => {
    const newState = toggleChaos();
    res.json({ message: `Chaos toggle for Identity: ${newState ? 'ACTIVE' : 'INACTIVE'}`, active: newState });
});

app.get('/metrics', (req, res) => {
    res.json(getMetrics('identity-service'));
});

app.post('/metrics/reset', (req, res) => {
    resetMetrics();
    res.json({ message: 'Metrics reset successfully' });
});

// Root check
app.get('/', (req, res) => res.json({ status: 'Identity Provider is Live' }));

module.exports = app;
