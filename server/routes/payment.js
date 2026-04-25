const express = require('express')
const router = express.Router()
const Razorpay = require('razorpay')
const crypto = require('crypto')
// Removed supabase require since orders are now handled on frontend

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay Error: KEY_ID or KEY_SECRET is missing from .env')
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

/**
 * GET /api/payment/key
 */
router.get('/key', (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ message: 'Razorpay key is not configured on server' })
  }
  res.json({ key: process.env.RAZORPAY_KEY_ID })
})

/**
 * POST /api/payment/order
 */
router.post('/order', async (req, res) => {
  try {
    const { items, currency = 'INR' } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' })
    }

    const amount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' })
    }

    const receiptBase = `rcpt_${Date.now()}`
    const firstItemName = items[0].name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_-]/g, '')
    const receipt = `${receiptBase}_${firstItemName}`.substring(0, 40)

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
    }

    const order = await razorpay.orders.create(options)

    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount
    })
  } catch (error) {
    console.error('Razorpay Order Error:', error)
    res.status(500).json({
      message: 'Error creating Razorpay order',
      error: error.message
    })
  }
})

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature only. Frontend handles database insert.
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' })
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature === razorpay_signature) {
      res.json({ status: 'success', message: 'Signature verified successfully' })
    } else {
      res.status(400).json({ status: 'failure', message: 'Invalid signature. Payment verification failed.' })
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error)
    res.status(500).json({ message: 'Error verifying payment process', error: error.message })
  }
})

// /my-orders and /save-cod removed as per frontend migration

module.exports = router
