import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// attach jwt from storage on every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('cafe_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// centralized error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';

        console.error(`[API Error] ${error.config?.url}:`, message);

        if (error.response?.status === 401) {
            console.warn('Session expired or unauthorized. Logging out.');
        }

        return Promise.reject({
            status: error.response?.status,
            message: message,
            originalError: error
        });
    }
);

export default apiClient;
