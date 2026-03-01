const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();
        await channel.assertQueue('status_updates', { durable: true });
        console.log('✅ Notification RabbitMQ Consumer Connected');
        return channel;
    } catch (error) {
        console.error('❌ Notification RabbitMQ Connection Error:', error.message);
        console.warn('⚠️ Notification service will continue without RabbitMQ fallback.');
        return null;
    }
}

function startConsuming(onStatusUpdate) {
    if (!channel) {
        console.warn('⚠️ No RabbitMQ channel to consume from.');
        return;
    }

    try {
        channel.consume('status_updates', (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                onStatusUpdate(data);
                channel.ack(msg);
            }
        });
    } catch (err) {
        console.error('❌ Error during consumption:', err);
    }
}

module.exports = {
    connectRabbitMQ,
    startConsuming
};
