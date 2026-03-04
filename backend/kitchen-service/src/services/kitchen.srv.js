const { getDB } = require('../db/mongo');
const { publishStatusUpdate } = require('../db/rabbitmq');
const client = require('prom-client');

// Metrics
const ordersProcessedCounter = new client.Counter({
    name: 'kitchen_orders_processed_total',
    help: 'Total number of orders successfully processed by the kitchen'
});

const processingTimeHistogram = new client.Histogram({
    name: 'kitchen_order_processing_seconds',
    help: 'Time spent processing orders in seconds',
    buckets: [1, 3, 5, 10]
});

async function processOrder(orderData) {
    const end = processingTimeHistogram.startTimer();
    const db = getDB();
    const ordersCollection = db.collection('orders');

    // save initial state immediately so clients can start polling
    console.log(`[Kitchen] 📝 Saving order ${orderData.idempotencyKey} to database...`);
    await ordersCollection.updateOne(
        { idempotencyKey: orderData.idempotencyKey },
        {
            $set: {
                ...orderData,
                status: 'PENDING_KITCHEN',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    console.log(`[Kitchen] ⏳ Order ${orderData.idempotencyKey} received. Waiting in queue (5s)...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    await ordersCollection.updateOne(
        { idempotencyKey: orderData.idempotencyKey },
        {
            $set: {
                status: 'COOKING',
                updatedAt: new Date()
            }
        }
    );

    publishStatusUpdate({
        orderId: orderData.idempotencyKey,
        status: 'COOKING',
        userEmail: orderData.userEmail
    });

    console.log(`[Kitchen] 🍳 COOKING order ${orderData.idempotencyKey}... (7s)`);
    await new Promise(resolve => setTimeout(resolve, 7000));

    await ordersCollection.updateOne(
        { idempotencyKey: orderData.idempotencyKey },
        {
            $set: {
                status: 'READY_FOR_PICKUP',
                updatedAt: new Date()
            }
        }
    );

    publishStatusUpdate({
        orderId: orderData.idempotencyKey,
        status: 'READY_FOR_PICKUP',
        userEmail: orderData.userEmail
    });

    ordersProcessedCounter.inc();
    end();

    console.log(`[Kitchen] ✅ Order ${orderData.idempotencyKey} is READY!`);
}

module.exports = {
    processOrder
};
