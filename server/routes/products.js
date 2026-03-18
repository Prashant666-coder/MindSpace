/**
 * Product Routes
 * GET /api/products          – Get all products (public)
 * GET /api/products/:id      – Get a single product
 * GET /api/products/category/:cat – Get products by category
 */

const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Fallback data to keep UI stable when DB is unavailable
const fallbackProducts = [
  { name: 'Calm Stress Ball Set', description: 'Soft, squeezable stress balls in calming colors.', price: 1099, category: 'stress-relief', rating: 5, image: 'https://thumbs.dreamstime.com/b/hand-holding-stress-ball-labeled-relax-used-emotional-control-mental-health-practice-helping-reduce-tension-improve-mood-394852723.jpg' },
  { name: 'Premium Fidget Cube', description: 'Six-sided fidget cube with buttons, switches, and spinners.', price: 849, category: 'stress-relief', rating: 4, image: 'https://rukminim2.flixcart.com/image/480/640/xif0q/puzzle/u/4/n/1-infinity-cube-fidget-toy-stress-anxiety-relief-handheld-original-imagy9dqg3z5hzez.jpeg?q=90' },
  { name: 'Mindfulness Journal', description: 'Guided journal with daily prompts for gratitude and reflection.', price: 2099, category: 'journal', rating: 5, image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600&h=400' },
  { name: 'Bamboo Meditation Cushion', description: 'Ergonomic meditation cushion with organic buckwheat filling.', price: 3349, category: 'meditation', rating: 5, image: 'https://img.freepik.com/free-photo/still-life-foam-roller_23-2151817452.jpg?semt=ais_rp_50_assets&w=740&q=80' },
  { name: 'Lavender Essential Oil Set', description: 'Pure lavender essential oil kit with diffuser.', price: 2499, category: 'aromatherapy', rating: 4, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600&h=400' },
  { name: 'Yoga Mat – Extra Thick', description: 'Premium 6mm thick yoga mat with alignment lines.', price: 2949, category: 'fitness', rating: 5, image: 'https://yuneyoga.com/cdn/shop/articles/thumbnail_a3aa658c-2d56-400b-83d6-73717696f863.jpg?v=1744563546&width=2048' },
  { name: 'The Anxiety Toolkit', description: 'Practical guide with evidence-based strategies for managing anxiety.', price: 1449, category: 'books', rating: 4, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600&h=400' },
  { name: 'Weighted Blanket – 15 lbs', description: 'Glass bead weighted blanket for deep pressure stimulation.', price: 4999, category: 'accessories', rating: 5, image: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&q=80&w=600&h=400' },
  { name: 'Tibetan Singing Bowl', description: 'Hand-hammered singing bowl for meditation and sound healing.', price: 3749, category: 'meditation', rating: 5, image: 'https://pillowfights.co.in/cdn/shop/files/U9A0855-_1_c276323b-4be8-49dd-891b-92e292b21b6f.webp?v=1764721898&width=2048' },
  { name: 'Resistance Band Set', description: 'Color-coded resistance bands for stress-relieving workouts.', price: 1649, category: 'fitness', rating: 4, image: 'https://5.imimg.com/data5/SELLER/Default/2022/1/YP/DZ/PW/85106980/resistance-band-tube-home-gym-workout-exercise-training-for-men-original-imag2fwsxcsgnchg-500x500.jpeg' },
  { name: 'Aromatherapy Candle Set', description: 'Set of 4 soy wax candles in calming scents.', price: 2349, category: 'aromatherapy', rating: 4, image: 'https://images.unsplash.com/photo-1602607688066-0ff1a425bcc5?auto=format&fit=crop&q=80&w=600&h=400' },
  { name: 'Gratitude Card Deck', description: 'Weekly gratitude prompts in a beautiful card deck.', price: 1249, category: 'journal', rating: 4, image: 'https://shop.mindful.org/cdn/shop/files/InstagramPost-1_720x.png?v=1745468135' }
];

/**
 * GET /api/products
 * Get all products, with optional category filter
 * Query params: ?category=stress-relief&limit=20
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    const filter = category ? { category } : {};

    const products = await Product.find(filter)
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({ products, total: products.length });
  } catch (err) {
    // Serve fallback data to keep UI stable
    const { category } = req.query;
    const filtered = category
      ? fallbackProducts.filter(p => p.category === category)
      : fallbackProducts;
    res.json({ products: filtered, total: filtered.length, source: 'fallback' });
  }
});

/**
 * GET /api/products/category/:cat
 * Get products by specific category
 */
router.get('/category/:cat', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.cat })
      .sort({ rating: -1 });

    res.json({ products, category: req.params.cat });
  } catch (err) {
    const filtered = fallbackProducts.filter(p => p.category === req.params.cat);
    res.json({ products: filtered, category: req.params.cat, source: 'fallback' });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    const product = fallbackProducts[0];
    res.json({ product, source: 'fallback' });
  }
});

module.exports = router;
