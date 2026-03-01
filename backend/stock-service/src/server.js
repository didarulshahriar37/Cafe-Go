require('dotenv').config();
const app = require('./app');
const { connectDB, closeDB } = require('./db/mongo');
const { connectRedis } = require('./db/redis');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await connectDB('cafe_inventory');

        try {
            await connectRedis();
        } catch (e) {
            console.warn('⚠️ Stock Service Redis connection failed. Cache disabled.');
        }

        const server = app.listen(PORT, () => {
            console.log(`🚀 Stock Service is running on port ${PORT}`);
        });

        const shutdown = async () => {
            console.log('🛑 Shutting down gracefully...');
            server.close(async () => {
                await closeDB();
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('❌ Failed to start the server:', error);
        process.exit(1);
    }
}

startServer();
