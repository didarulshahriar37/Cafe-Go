require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db/mongo');

const PORT = process.env.PORT || 3004;

async function startServer() {
    try {
        await connectDB('cafe_platform');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🔐 Identity Provider active on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start Identity Service:', error);
        process.exit(1);
    }
}

startServer();
