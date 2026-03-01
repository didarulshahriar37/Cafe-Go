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
        console.error('❌ Notification RabbitMQ Connection Error:', error);
        process.exit(1);
    }
}

function startConsuming(onStatusUpdate) {
    if (!channel) return;

    channel.consume('status_updates', (msg) => {
        if (msg !== null) {
            const data = JSON.parse(msg.content.toString());
            onStatusUpdate(data);
            channel.ack(msg);
        }
    });
}

module.exports = {
    connectRabbitMQ,
    startConsuming
};
