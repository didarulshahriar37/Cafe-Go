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

    // 1. Initial status: UPDATING TO 'COOKING'
    await ordersCollection.updateOne(
        { idempotencyKey: orderData.idempotencyKey },
        {
            $set: {
                ...orderData,
                status: 'COOKING',
                updatedAt: new Date()
            }
        },
        { upsert: true } // Create if doesn't exist (first time kitchen sees it)
    );

    publishStatusUpdate({
        orderId: orderData.idempotencyKey,
        status: 'COOKING',
        userEmail: orderData.userEmail
    });

    // 2. Simulate Culinary Magic (3-5 seconds)
    const delay = Math.floor(Math.random() * (5000 - 3000 + 1) + 3000);
    console.log(`[Kitchen] Cooking order ${orderData.idempotencyKey}... (${delay}ms)`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // 3. Final status: COMPLETED
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

    console.log(`[Kitchen] Order ${orderData.idempotencyKey} is READY!`);
}

module.exports = {
    processOrder
};
