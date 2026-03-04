const { getRedis } = require('../db/redis');

// returns null if redis is down so callers can degrade gracefully
function getSafeRedis() {
    try {
        return getRedis();
    } catch (error) {
        console.warn(`[Redis Safe Access] ⚠️  Redis unavailable: ${error.message}`);
        return null;
    }
}

async function safeRedisGet(key) {
    const redis = getSafeRedis();
    if (!redis) return null;

    try {
        return await redis.get(key);
    } catch (error) {
        console.warn(`[Redis Safe Get] ⚠️  Failed to get key "${key}": ${error.message}`);
        return null;
    }
}

async function safeRedisSetEx(key, ttl, value) {
    const redis = getSafeRedis();
    if (!redis) return false;

    try {
        await redis.setEx(key, ttl, value);
        return true;
    } catch (error) {
        console.warn(`[Redis Safe SetEx] ⚠️  Failed to set key "${key}": ${error.message}`);
        return false;
    }
}

module.exports = {
    getSafeRedis,
    safeRedisGet,
    safeRedisSetEx
};
