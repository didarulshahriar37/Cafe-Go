const amqp = require('amqplib');
const { getDB } = require('./mongo');

let channel = null;

async function connectRabbitMQ() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        await channel.assertQueue('kitchen_orders', { durable: true });
        await channel.assertQueue('status_updates', { durable: true });
        // Fair dispatch
        channel.prefetch(1);

        console.log('✅ Kitchen RabbitMQ Consumer Connected');
        return channel;
    } catch (error) {
        console.error('❌ Kitchen RabbitMQ Connection Error:', error);
        process.exit(1);
    }
}

function publishStatusUpdate(data) {
    if (!channel) return;
    return channel.sendToQueue('status_updates', Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

async function startConsuming(onOrderReceived) {
    if (!channel) throw new Error('RabbitMQ channel not initialized');

    console.log('🍳 Kitchen is waiting for orders...');

    channel.consume('kitchen_orders', async (msg) => {
        if (msg !== null) {
            const orderData = JSON.parse(msg.content.toString());
            console.log(`[Kitchen] Received order for: ${orderData.userEmail} (ID: ${orderData.idempotencyKey})`);

            try {
                // Process order
                await onOrderReceived(orderData);

                // Acknowledge the message - this removes it from the queue
                channel.ack(msg);
                console.log(`[Kitchen] Order processed and ACKed: ${orderData.idempotencyKey}`);
            } catch (error) {
                console.error(`[Kitchen] Error processing order ${orderData.idempotencyKey}:`, error);

                // Negative Acknowledgment: Re-queue the message so another worker can try (or retry later)
                // In a production app, we might use a Dead Letter Exchange after X retries
                channel.nack(msg, false, true);
            }
        }
    });
}

module.exports = {
    connectRabbitMQ,
    startConsuming,
    publishStatusUpdate
};
