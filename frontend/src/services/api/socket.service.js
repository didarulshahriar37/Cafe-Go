import { io } from 'socket.io-client';

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(NOTIFICATION_SERVICE_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to Notification WebSocket');
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Socket Connection Error:', error);
            });
        }
        return this.socket;
    }

    subscribeToOrder(orderId, onUpdate) {
        const socket = this.connect();

        console.log(`📡 Subscribing to order: ${orderId}`);
        socket.emit('subscribe_order', orderId);

        // Remove listener if it already exists to avoid duplicates
        socket.off('order_status_updated');

        socket.on('order_status_updated', (data) => {
            console.log('📣 Update received:', data);
            if (data.orderId === orderId) {
                onUpdate(data);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
