const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

/**
 * @route   GET /api/payment/key
 * @desc    Get Razorpay Key ID
 * @access  Public
 */
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id' });
});

/**
 * @route   POST /api/payment/order
 * @desc    Create a Razorpay order
 * @access  Private (Guest/User)
 */
router.post('/order', async (req, res) => {
    try {
        const { amount, currency = 'INR', productId } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise for INR)
            currency,
            receipt: `receipt_${Date.now()}_${productId || 'shop'}`,
        };

        const order = await razorpay.orders.create(options);

        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount
        });
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ message: 'Error creating Razorpay order', error: error.message });
    }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
            .update(body.toString())
            .digest('hex');

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            // Payment is successful and verified
            // Here you would typically save the order to your database
            res.json({ 
                status: 'success', 
                message: 'Payment verified successfully' 
            });
        } else {
            res.status(400).json({ 
                status: 'failure', 
                message: 'Invalid signature' 
            });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
});

module.exports = router;
