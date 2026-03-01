const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`📡 New WebSocket connection: ${socket.id}`);

        // Students join a room based on their orderId
        socket.on('subscribe_order', (orderId) => {
            socket.join(orderId);
            console.log(`🔗 Socket ${socket.id} subscribed to order: ${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

function notifyStatusUpdate(data) {
    if (!io) return;

    const { orderId, status } = data;
    console.log(`📣 Pushing update for order ${orderId}: ${status}`);

    // Emit only to the specific room (the student watching this orderId)
    io.to(orderId).emit('order_status_updated', data);
}

module.exports = {
    initSocket,
    notifyStatusUpdate
};
