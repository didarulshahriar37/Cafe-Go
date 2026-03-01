require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket, notifyStatusUpdate } = require('./socket');
const { connectRabbitMQ, startConsuming } = require('./db/rabbitmq');

const PORT = process.env.PORT || 3003;

const server = http.createServer(app);

async function startServer() {
    try {
        // Initialize WebSockets
        initSocket(server);

        // Connect to RabbitMQ
        await connectRabbitMQ();

        // Start consuming messages and pipe them to WebSockets
        startConsuming(notifyStatusUpdate);

        server.listen(PORT, () => {
            console.log(`🔔 Notification Service (WebSocket) active on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start Notification Service:', error);
        process.exit(1);
    }
}

startServer();
