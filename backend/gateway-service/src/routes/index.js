const express = require('express');
const router = express.Router();
const { verifyAuthToken } = require('../middleware/auth');
const { handlePlaceOrder } = require('../controllers/order.ctrl');
const { syncUser } = require('../controllers/user.ctrl');

// API routes inside Gateway
router.post('/users/sync', verifyAuthToken, syncUser);
router.post('/orders', verifyAuthToken, handlePlaceOrder);

module.exports = router;
