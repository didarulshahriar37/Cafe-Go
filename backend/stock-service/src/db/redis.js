const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = createClient({ url: redisUrl });
let isFallbackMock = false;

// Mock to prevent service start failure
const mockRedis = {
    isOpen: true,
    connect: async () => { },
    get: async () => null,
    set: async () => 'OK',
    setEx: async () => 'OK',
    ping: async () => 'PONG'
};

redisClient.on('error', (err) => {
    console.error('❌ Redis Stock Client Error:', err.message);
    isFallbackMock = true;
});

async function connectRedis() {
    if (isFallbackMock) return mockRedis;
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (e) {
        console.warn('⚠️ Stock Redis connection failed. Entering fallback mode.');
        isFallbackMock = true;
    }
    return isFallbackMock ? mockRedis : redisClient;
}

function getRedis() {
    if (isFallbackMock) return mockRedis;
    if (!redisClient.isOpen) return mockRedis;
    return redisClient;
}

module.exports = {
    connectRedis,
    getRedis
};
