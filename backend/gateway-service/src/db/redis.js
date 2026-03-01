const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = createClient({ url: redisUrl });
let isFallbackMock = false;

// Minimal mock implementation
const mockRedis = {
    isOpen: true,
    connect: async () => { console.warn('⚠️ Using Mock Redis - Connectivity lost'); isFallbackMock = true; },
    get: async () => null,
    set: async () => 'OK',
    setEx: async () => 'OK',
    del: async () => 0,
    ping: async () => 'PONG',
    on: () => { },
    quit: async () => { }
};

redisClient.on('error', (err) => {
    console.error('❌ Redis Gateway Client Error:', err.message);
    if (!redisClient.isOpen) {
        console.warn('⚠️ Switching to Mock Redis for continuity.');
        isFallbackMock = true;
    }
});

async function connectRedis() {
    if (isFallbackMock) return mockRedis;
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        return redisClient;
    } catch (e) {
        console.warn('⚠️ Redis Connection Failed. Falling back to Mock.');
        isFallbackMock = true;
        return mockRedis;
    }
}

function getRedis() {
    if (isFallbackMock) return mockRedis;
    if (!redisClient.isOpen) {
        console.warn('⚠️ Redis accessor called before connection. Using Mock.');
        return mockRedis;
    }
    return redisClient;
}

module.exports = {
    connectRedis,
    getRedis
};
