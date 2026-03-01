import axios from 'axios';
import { auth } from '../firebase/firebase.config';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Firebase ID Token automatically
apiClient.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            try {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            } catch (error) {
                console.error("Failed to get Firebase token", error);
            }
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
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

        // Log errors centrally for observability
        console.error(`[API Error] ${error.config?.url}:`, message);

        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., redirect to login or show modal)
            console.warn('Session expired or unauthorized. Please re-authenticate.');
        }

        if (error.response?.status === 409) {
            // Specific handling for stock conflicts
            console.warn('Concurrency conflict or insufficient stock.');
        }

        return Promise.reject({
            status: error.response?.status,
            message: message,
            originalError: error
        });
    }
);

export default apiClient;
