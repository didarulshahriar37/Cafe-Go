import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT Token automatically from localStorage
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

// Response Interceptor: Centralized Error Handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';

        // Log errors centrally for observability
        console.error(`[API Error] ${error.config?.url}:`, message);

        if (error.response?.status === 401) {
            // Handle unauthorized (session expired or invalid token)
            console.warn('Session expired or unauthorized. Logging out.');
            // We can't use useAuth here, but we can clear storage and reload or redirect if needed
            // localStorage.clear(); 
            // window.location.href = '/login';
        }

        return Promise.reject({
            status: error.response?.status,
            message: message,
            originalError: error
        });
    }
);

export default apiClient;
