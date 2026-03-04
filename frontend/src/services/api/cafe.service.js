import apiClient from './axios.client';

const CafeService = {
    // fetches all menu items with current stock levels
    checkStock: async () => {
        try {
            const response = await apiClient.get('/stock');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            if (data && Array.isArray(data.items)) {
                return data.items;
            }
            return [];
        } catch (error) {
            throw error;
        }
    },

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
