require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db/mongo');
const { connectRabbitMQ, startConsuming } = require('./db/rabbitmq');
const { processOrder } = require('./services/kitchen.srv');

const PORT = process.env.PORT || 3002;

async function startServer() {
    try {
        await connectDB('cafe_orders');

        try {
            await connectRabbitMQ();
            await startConsuming(processOrder);
        } catch (e) {
            console.warn('⚠️ Kitchen RabbitMQ connection failed. Service is up but idle.');
        }

        app.listen(PORT, () => {
            console.log(`🍳 Kitchen Service active on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start Kitchen Service:', error);
        process.exit(1);
    }
}

startServer();
