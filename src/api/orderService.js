import axios from 'axios';
import { getIdToken } from '../auth/useAuth';

export async function placeOrder(orderDetails) {
    const token = getIdToken();
    const response = await axios.post('http://localhost:5000/order', orderDetails, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}
