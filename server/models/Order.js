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
  // Reference to the user who placed the order (optional for guests)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Sub-items in the order
  items: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    image: {
      type: String
    }
  }],
  // Final total amount paid in INR
  totalAmount: {
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
