const amqp = require('amqplib');

let channel = null;
let isFallbackMock = false;

// Mock to prevent service start failure from RabbitMQ unavailability
const mockChannel = {
    assertQueue: async () => { },
    sendToQueue: (name, data) => {
        console.log(`[MOCK RabbitMQ] Message sent to ${name}:`, JSON.parse(data.toString()));
        return true;
    }
};

async function connectRabbitMQ() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();
        await channel.assertQueue('kitchen_orders', { durable: true });
        console.log('✅ Gateway RabbitMQ Publisher Connected');
        return channel;
    } catch (error) {
        console.error('❌ Gateway RabbitMQ Connection Error:', error.message);
        console.warn('⚠️ Switching to Mock RabbitMQ for continuity.');
        isFallbackMock = true;
        channel = mockChannel;
        return channel;
    }
}

function publishToQueue(queueName, data) {
    if (!channel) {
        if (isFallbackMock) return mockChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
        throw new Error('RabbitMQ channel not initialized');
    }
    return channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

module.exports = {
    connectRabbitMQ,
    publishToQueue
};
