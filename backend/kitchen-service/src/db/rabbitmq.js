const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();
        await channel.assertQueue('kitchen_orders', { durable: true });
        await channel.assertQueue('status_updates', { durable: true });
        channel.prefetch(1);
        console.log('✅ Kitchen RabbitMQ Consumer Connected');
        return channel;
    } catch (error) {
        console.error('❌ Kitchen RabbitMQ Connection Error:', error.message);
        console.warn('⚠️ Kitchen service will continue in manual/headless mode.');
        return null;
    }
}

function publishStatusUpdate(data) {
    if (!channel || channel.isMock) return;
    return channel.sendToQueue('status_updates', Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

async function startConsuming(onOrderReceived) {
    if (!channel) {
        console.warn('⚠️ No kitchen channel to consume from.');
        return;
    }

    channel.consume('kitchen_orders', async (msg) => {
        if (msg !== null) {
            const orderData = JSON.parse(msg.content.toString());
            try {
                await onOrderReceived(orderData);
                channel.ack(msg);
            } catch (error) {
                console.error(`[Kitchen] Error during consumption:`, error);
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
