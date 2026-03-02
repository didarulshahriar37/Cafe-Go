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

    // In serverless, we might already have a connection but it might be closed
    if (channel && channel.connection && channel.connection.close) {
        return channel;
    }

    try {
        console.log(`[Gateway] Attempting to connect to RabbitMQ at ${rabbitUrl.split('@')[1]}...`);
        const connection = await amqp.connect(rabbitUrl, { timeout: 10000 });
        channel = await connection.createChannel();
        await channel.assertQueue('kitchen_orders', { durable: true });
        console.log('✅ Gateway RabbitMQ Publisher Connected');
        isFallbackMock = false;
        return channel;
    } catch (error) {
        console.error('❌ Gateway RabbitMQ Connection Error:', error.message);

        // Only use mock in LOCAL development or if explicitly allowed (unlikely for production)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            console.warn('⚠️ Switching to Mock RabbitMQ for local continuity.');
            isFallbackMock = true;
            channel = mockChannel;
            return channel;
        }

        throw new Error(`Production messaging system failure: ${error.message}`);
    }
}

async function publishToQueue(queueName, data) {
    if (!channel || isFallbackMock) {
        // Try to re-connect if channel is missing or was mock
        await connectRabbitMQ().catch(e => {
            if (!isFallbackMock) throw e;
        });
    }

    if (isFallbackMock && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
        return mockChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    }

    if (!channel) throw new Error('RabbitMQ channel unavailable');

    return channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

module.exports = {
    connectRabbitMQ,
    publishToQueue
};
