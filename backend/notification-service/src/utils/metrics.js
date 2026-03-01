const metrics = {
    totalRequests: 0,
    failures: 0,
    totalResponseTime: 0,
    avgResponseTime: 0,
    startTime: Date.now()
};

const metricsMiddleware = (req, res, next) => {
    const start = process.hrtime();
    metrics.totalRequests++;

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6);
        metrics.totalResponseTime += timeInMs;
        metrics.avgResponseTime = metrics.totalResponseTime / metrics.totalRequests;

        if (res.statusCode >= 400) {
            metrics.failures++;
        }
    });

    next();
};

const getMetrics = (serviceName) => {
    return {
        service: serviceName,
        uptime: `${Math.round((Date.now() - metrics.startTime) / 1000)}s`,
        total_requests: metrics.totalRequests,
        failed_requests: metrics.failures,
        avg_response_time_ms: metrics.avgResponseTime.toFixed(2),
        success_rate: metrics.totalRequests > 0
            ? `${(((metrics.totalRequests - metrics.failures) / metrics.totalRequests) * 100).toFixed(2)}%`
            : '100%'
    };
};

module.exports = { metricsMiddleware, getMetrics };