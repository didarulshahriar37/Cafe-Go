const { safeRedisGet, safeRedisSetEx } = require('../db/redis-safe');

const STOCK_CACHE_TTL = 60; // seconds

// builds a deterministic cache key regardless of item order in cart
function generateStockCacheKey(items) {
    const sortedItems = items
        .map(item => `${item.itemId}:${item.quantity}`)
        .sort()
        .join('|');
    return `gateway:stock:${sortedItems}`;
}

async function checkStockWithCache(items) {
    const cacheKey = generateStockCacheKey(items);

    const cachedStock = await safeRedisGet(cacheKey);

    if (cachedStock) {
        console.log(`[Stock Cache] ✅ Cache HIT for: ${cacheKey.substring(0, 50)}...`);
        return JSON.parse(cachedStock);
    }

    console.log(`[Stock Cache] ❌ Cache MISS for: ${cacheKey.substring(0, 50)}...`);

    const stockData = await fetchStockFromService(items);

    await safeRedisSetEx(cacheKey, STOCK_CACHE_TTL, JSON.stringify(stockData));

    return stockData;
}

async function fetchStockFromService(items) {
    const stockUrl = process.env.STOCK_SERVICE_URL || 'http://127.0.0.1:3001';

    const response = await fetch(`${stockUrl}/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
    });

    const stockData = await response.json();

    if (!response.ok) {
        throw new Error(JSON.stringify({
            status: response.status,
            data: stockData,
            message: `Gateway StockCheck failed: ${stockData.message || response.statusText}`
        }));
    }

    return stockData;
}

module.exports = {
    checkStockWithCache,
    generateStockCacheKey
};
