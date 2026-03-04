const { safeRedisSetEx } = require('../db/redis-safe');
const { getSafeRedis } = require('../db/redis-safe');

async function invalidateStockCache(items) {
    const redis = getSafeRedis();
    if (!redis) {
        console.warn('[Stock Cache Invalidation] ⚠️  Redis unavailable, cache invalidation skipped');
        return false;
    }

    try {
        const cacheKeyPrefix = 'gateway:stock:';
        const keys = await redis.keys(`${cacheKeyPrefix}*`);

        const itemIds = items.map(item => item.itemId);
        const keysToDelete = keys.filter(key => {
            return itemIds.some(id => key.includes(id));
        });

        if (keysToDelete.length > 0) {
            await redis.del(keysToDelete);
            console.log(`[Stock Cache Invalidation] 🗑️  Invalidated ${keysToDelete.length} cache entries`);
            return true;
        }

        console.log('[Stock Cache Invalidation] ℹ️  No cache entries to invalidate');
        return true;
    } catch (error) {
        console.warn(`[Stock Cache Invalidation] ⚠️  Failed to invalidate cache: ${error.message}`);
        return false;
    }
}

// wipe all cached stock entries - handy for debugging or after major inventory changes
async function clearAllStockCache() {
    const redis = getSafeRedis();
    if (!redis) {
        console.warn('[Stock Cache Clear] ⚠️  Redis unavailable, cache clear skipped');
        return false;
    }

    try {
        const cacheKeyPrefix = 'gateway:stock:';
        const keys = await redis.keys(`${cacheKeyPrefix}*`);

        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`[Stock Cache Clear] 🗑️  Cleared ${keys.length} cache entries`);
            return true;
        }

        console.log('[Stock Cache Clear] ℹ️  No cache entries to clear');
        return true;
    } catch (error) {
        console.warn(`[Stock Cache Clear] ⚠️  Failed to clear cache: ${error.message}`);
        return false;
    }
}

module.exports = {
    invalidateStockCache,
    clearAllStockCache
};
