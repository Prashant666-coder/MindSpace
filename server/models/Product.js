/**
 * Product Model
 * Stores mental health shop products like stress balls,
 * fidget toys, journals, and wellness accessories.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Product name
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
  },
  // Product description
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // Price in INR
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Product category
  category: {
    type: String,
    required: true,
    enum: ['stress-relief', 'meditation', 'journal', 'aromatherapy', 'fitness', 'books', 'accessories'],
    lowercase: true
  },
  // Image URL for the product
  image: {
    type: String,
    default: ''
  },
  // Star rating (1-5)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4
  },
  // Whether product is in stock
  inStock: {
    type: Boolean,
    default: true
  },
  // Tags for search and filtering
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
