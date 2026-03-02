jest.mock('../src/db/mongo');
jest.mock('../src/db/redis');

const { reserveStock } = require('../src/services/stock.srv');
const { getDB } = require('../src/db/mongo');
const { getRedis } = require('../src/db/redis');
const { ObjectId } = require('mongodb');

describe('Stock Deduction Logic (Optimistic Locking)', () => {
    let mockCollection;
    let mockRedis;

    beforeEach(() => {
        mockCollection = {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            updateOne: jest.fn(),
        };
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        };
        getDB.mockResolvedValue(mockDb);

        mockRedis = {
            get: jest.fn().mockResolvedValue(null),
            setEx: jest.fn().mockResolvedValue('OK'),
        };
        getRedis.mockReturnValue(mockRedis);
    });

    test('should successfully reserve stock when available', async () => {
        const itemId = new ObjectId().toString();
        const items = [{ itemId, quantity: 2 }];
        const idempotencyKey = 'test-key';

        mockCollection.findOne.mockResolvedValue({
            _id: new ObjectId(itemId),
            title: 'Test Item',
            stock: 10,
            version: 1
        });

        mockCollection.findOneAndUpdate.mockResolvedValue({
            title: 'Test Item',
            stock: 8,
            version: 2
        });

        const result = await reserveStock(items, idempotencyKey);

        expect(result.success).toBe(true);
        expect(result.items[0].remainingStock).toBe(8);
        expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ version: 1 }),
            expect.objectContaining({ $inc: { stock: -2, version: 1 } }),
            expect.any(Object)
        );
    });

    test('should fail and rollback if stock is insufficient', async () => {
        const itemId = new ObjectId().toString();
        const items = [{ itemId, quantity: 20 }];
        const idempotencyKey = 'fail-key';

        mockCollection.findOne.mockResolvedValue({
            _id: new ObjectId(itemId),
            title: 'Test Item',
            stock: 10,
            version: 1
        });

        await expect(reserveStock(items, idempotencyKey)).rejects.toThrow('Insufficient stock');
    });

    test('should retry and eventually succeed on version collision', async () => {
        const itemId = new ObjectId().toString();
        const items = [{ itemId, quantity: 1 }];
        const idempotencyKey = 'retry-key';

        mockCollection.findOne.mockResolvedValue({
            _id: new ObjectId(itemId),
            title: 'Test Item',
            stock: 5,
            version: 1
        });

        // First attempt fails (null return from findOneAndUpdate)
        mockCollection.findOneAndUpdate
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                title: 'Test Item',
                stock: 4,
                version: 2
            });

        const result = await reserveStock(items, idempotencyKey);

        expect(result.success).toBe(true);
        expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
});
