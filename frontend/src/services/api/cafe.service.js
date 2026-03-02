import apiClient from './axios.client';

/**
 * Service to handle cafeteria related API calls
 */
const CafeService = {
    /**
     * Retrieve the full inventory and current stock levels
     * Proxied through Gateway -> Stock Service
     */
    checkStock: async () => {
        try {
            const response = await apiClient.get('/stock');
            // some deployments may wrap the array inside an object, so
            // normalize the output here as well.  This keeps callers easy.
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            if (data && Array.isArray(data.items)) {
                return data.items;
            }
            // fall back to empty list so the UI doesn't crash
            return [];
        } catch (error) {
            // Error is already formatted by axios interceptor
            throw error;
        }
    },

    /**
     * Place an order
     * Handled by Gateway Orchestration -> RabbitMQ
     * 
     * @param {Array} items - [{ itemId: string, quantity: number }]
     * @param {string} idempotencyKey - Unique key to prevent duplicate processing
     */
    placeOrder: async (items, idempotencyKey) => {
        try {
            const response = await apiClient.post('/orders',
                { items },
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default CafeService;
