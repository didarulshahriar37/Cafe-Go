let isChaosActive = false;

const chaosMiddleware = (req, res, next) => {
    if (isChaosActive && !req.path.startsWith('/chaos')) {
        return res.status(503).json({
            error: "Service unavailable due to internal maintenance.",
            chaos: true
        });
    }
    next();
};

const toggleChaos = (state) => {
    isChaosActive = state !== undefined ? state : !isChaosActive;
    return isChaosActive;
};

const getChaosState = () => isChaosActive;

module.exports = { chaosMiddleware, toggleChaos, getChaosState };
