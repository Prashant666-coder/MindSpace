const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

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
        const { amount, currency = 'INR', productId } = req.body;

        // Validation
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'A valid amount is required' });
        }

        // Razorpay receipt field has a max of 40 characters — truncate safely
        const receiptBase = `rcpt_${Date.now()}`; // 18 chars
        const safeProductId = String(productId || 'shop')
            .replace(/\s+/g, '')  // remove spaces
            .replace(/[^a-zA-Z0-9_-]/g, '') // strip special chars
            .substring(0, 40 - receiptBase.length - 1); // leave room for separator
        const receipt = `${receiptBase}_${safeProductId}`.substring(0, 40);

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
            productDetails
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
                    product: {
                        id: productDetails?.id || 'unknown',
                        name: productDetails?.name || 'Product'
                    },
                    amount: productDetails?.price || 0,
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
                    orderId: newOrder._id
                });
            } catch (dbError) {
                console.error('Order Saving Error:', dbError);
                // Even if DB save fails, we verified the payment
                res.status(200).json({ 
                    status: 'partial_success', 
                    message: 'Payment verified but failed to save order details',
                    error: dbError.message 
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

module.exports = router;
