jest.mock('../src/db/rabbitmq');
jest.mock('../src/services/stock-cache.srv');
jest.mock('../src/db/redis-safe', () => ({
    safeRedisGet: jest.fn().mockResolvedValue(null),
    safeRedisSetEx: jest.fn().mockResolvedValue('OK')
}));

const { orchestrateOrder } = require('../src/services/order.srv');
const { publishToQueue } = require('../src/db/rabbitmq');
const { checkStockWithCache } = require('../src/services/stock-cache.srv');

// Mock fetch globally
global.fetch = jest.fn();

describe('Order Orchestration Logic', () => {
    const user = { uid: 'u123', email: 'test@example.com' };
    const items = [{ itemId: 'i1', quantity: 1 }];
    const idempotencyKey = 'id-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully orchestrate an order when stock is available', async () => {
        // 1. Stock cache check passes
        checkStockWithCache.mockResolvedValue({ available: true });

        // 2. Fetch from stock-service succeeds
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: { items: [{ itemId: 'i1', quantity: 1, title: 'Test Item' }] }
            })
        });

        const result = await orchestrateOrder(user, items, idempotencyKey);

        expect(result.success).toBe(true);
        expect(publishToQueue).toHaveBeenCalledWith('kitchen_orders', expect.objectContaining({
            userId: 'u123',
            idempotencyKey: 'id-123'
        }));
    });

    test('should reject order if stock reservation fails', async () => {
        checkStockWithCache.mockResolvedValue({ available: true });

        fetch.mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Insufficient stock' })
        });

        await expect(orchestrateOrder(user, items, idempotencyKey)).rejects.toThrow();
    });
});
