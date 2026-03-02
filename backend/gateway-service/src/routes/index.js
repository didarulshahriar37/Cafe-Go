const express = require('express');
const router = express.Router();
const { verifyAuthToken } = require('../middleware/auth');
const { handlePlaceOrder, handleGetOrder } = require('../controllers/order.ctrl');

// Protected API routes
router.post('/orders', verifyAuthToken, handlePlaceOrder);
router.get('/orders/:id', verifyAuthToken, handleGetOrder);

module.exports = router;
