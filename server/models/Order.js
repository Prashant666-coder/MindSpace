/**
 * Order Model
 * Stores details of successful transactions made via Razorpay.
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Unique Razorpay Order ID
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  // Unique Razorpay Payment ID (only after successful payment)
  razorpayPaymentId: {
    type: String,
    required: true
  },
  // Unique Razorpay Signature (only after successful payment)
  razorpaySignature: {
    type: String,
    required: true
  },
  // Reference to the product being purchased
  product: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  // Amount paid in INR
  amount: {
    type: Number,
    required: true
  },
  // Customer details for delivery
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  // Payment status
  status: {
    type: String,
    enum: ['captured', 'failed', 'refunded'],
    default: 'captured'
  },
  // Timestamp of the order
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
