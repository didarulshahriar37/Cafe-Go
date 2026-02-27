import React, { useState } from 'react';
import { placeOrder } from '../api/orderService';

function Dashboard({ token }) {
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        try {
            const data = await placeOrder({ item: 'coffee', quantity: 1 });
            setMessage(data.message || 'Order placed');
        } catch (err) {
            setMessage(err.response?.data?.message || err.message);
        }
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <button onClick={handleSubmit}>Place Order</button>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Dashboard;
