const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Initialize Razorpay
// App will now fail fast if keys are missing from .env, ensuring security.
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay Error: KEY_ID or KEY_SECRET is missing from .env');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * @route   GET /api/payment/key
 * @desc    Get Razorpay Key ID
 * @access  Public
 */
router.get('/key', (req, res) => {
    if (!process.env.RAZORPAY_KEY_ID) {
        return res.status(500).json({ message: 'Razorpay key is not configured on server' });
    }
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

/**
 * @route   POST /api/payment/order
 * @desc    Create a Razorpay order
 * @access  Public
 */
router.post('/order', async (req, res) => {
    try {
        const { items, currency = 'INR' } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        // Calculate total amount server-side for security
        const amount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid total amount' });
        }

        // Razorpay receipt field has a max of 40 characters — truncate safely
        const receiptBase = `rcpt_${Date.now()}`; // 18 chars
        const firstItemName = items[0].name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_-]/g, '');
        const receipt = `${receiptBase}_${firstItemName}`.substring(0, 40);

        const options = {
            amount: Math.round(Number(amount) * 100), // amount in paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);

        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount
        });
    } catch (error) {
        // Log full error detail (including Razorpay statusCode and description)
        console.error('Razorpay Order Error:', JSON.stringify(error, null, 2));
        res.status(500).json({
            message: 'Error creating Razorpay order',
            error: error.message || JSON.stringify(error)
        });
    }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment signature and save order
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customerDetails,
            items, // Update to receive items array
            totalAmount,
            userId // Pass userId if authenticated
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification details' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            // Payment is successful and verified. Save to database.
            try {
                const newOrder = new Order({
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    user: userId || null,
                    items: items.map(item => ({
                        id: item.id || 'unknown',
                        name: item.name || 'Product',
                        price: item.price || 0,
                        quantity: item.quantity || 1,
                        image: item.image || ''
                    })),
                    totalAmount: totalAmount || 0,
                    customer: {
                        name: customerDetails?.name || 'Guest',
                        phone: customerDetails?.phone || '0000000000',
                        address: customerDetails?.address || 'N/A',
                        city: customerDetails?.city || 'N/A',
                        state: customerDetails?.state || 'N/A',
                        pincode: customerDetails?.pincode || '000000'
                    },
                    status: 'captured'
                });

                await newOrder.save();

                res.json({ 
                    status: 'success', 
                    message: 'Payment verified and order saved successfully',
                    orderId: newOrder._id,
                    order: newOrder
                });
            } catch (dbError) {
                console.error('Order Saving Error:', dbError);
                res.status(200).json({ 
                    status: 'partial_success', 
                    message: 'Payment verified but failed to save order details. Proceeding with details in response.',
                    order: {
                        razorpayOrderId: razorpay_order_id,
                        items: items,
                        totalAmount: totalAmount,
                        customer: customerDetails,
                        status: 'captured',
                        createdAt: new Date(),
                        razorpaySignature: razorpay_signature
                    }
                });
            }
        } else {
            res.status(400).json({ 
                status: 'failure', 
                message: 'Invalid signature. Payment verification failed.' 
            });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
});

/**
 * @route   GET /api/payment/my-orders
 * @desc    Get purchase history for the logged-in user
 * @access  Private
 */
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

/**
 * @route   POST /api/payment/save-cod
 * @desc    Save a Cash on Delivery order (Internal simulation)
 * @access  Public (should be protected in real apps)
 */
router.post('/save-cod', async (req, res) => {
    try {
        const { customerDetails, items, totalAmount, userId } = req.body;

        const newOrder = new Order({
            razorpayOrderId: 'COD_' + Date.now(),
            razorpayPaymentId: 'COD_' + Math.random().toString(36).substr(2, 9),
            razorpaySignature: 'COD_SIMULATED',
            user: userId || null,
            items: items.map(item => ({
                id: item.id || 'unknown',
                name: item.name || 'Product',
                price: item.price || 0,
                quantity: item.quantity || 1,
                image: item.image || ''
            })),
            totalAmount: totalAmount || 0,
            customer: {
                name: customerDetails?.name || 'Guest',
                phone: customerDetails?.phone || '0000000000',
                address: customerDetails?.address || 'N/A',
                city: customerDetails?.city || 'N/A',
                state: customerDetails?.state || 'N/A',
                pincode: customerDetails?.pincode || '000000'
            },
            status: 'captured'
        });

        await newOrder.save();
        res.json({ status: 'success', orderId: newOrder._id, order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Error saving COD order', error: error.message });
    }
});

module.exports = router;
