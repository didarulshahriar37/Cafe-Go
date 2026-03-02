const express = require('express');
const router = express.Router();
const { verifyAuthToken } = require('../middleware/auth');
const { login } = require('../controllers/auth.ctrl');
const { handlePlaceOrder, handleGetOrder } = require('../controllers/order.ctrl');

// Public Auth routes
router.post('/login', login);

// Protected API routes
router.post('/orders', verifyAuthToken, handlePlaceOrder);
router.get('/orders/:id', verifyAuthToken, handleGetOrder);

module.exports = router;
