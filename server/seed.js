/**
 * Database Seed Script
 * Run with: npm run seed
 * Populates the database with sample products for the mental health shop.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindspace3d';

// Sample products for the mental health shop
const sampleProducts = [
  {
    name: 'Calm Stress Ball Set (3-Pack)',
    description: 'Soft, squeezable stress balls in calming colors. Perfect for desk use to relieve tension and anxiety throughout the day.',
    price: 1099,
    category: 'stress-relief',
    image: 'https://thumbs.dreamstime.com/b/hand-holding-stress-ball-labeled-relax-used-emotional-control-mental-health-practice-helping-reduce-tension-improve-mood-394852723.jpg',
    rating: 5,
    tags: ['stress-ball', 'fidget', 'anxiety-relief', 'desk-toy']
  },
  {
    name: 'Premium Fidget Cube',
    description: 'Six-sided fidget cube with buttons, switches, and spinners. Helps reduce stress and improve focus during work or study.',
    price: 849,
    category: 'stress-relief',
    image: 'https://rukminim2.flixcart.com/image/480/640/xif0q/puzzle/u/4/n/1-infinity-cube-fidget-toy-stress-anxiety-relief-handheld-original-imagy9dqg3z5hzez.jpeg?q=90',
    rating: 4,
    tags: ['fidget', 'focus', 'anxiety', 'desk-toy']
  },
  {
    name: 'Mindfulness Journal – 365 Prompts',
    description: 'Guided journal with daily prompts for gratitude, reflection, and self-discovery. Beautiful hardcover with ribbon bookmark.',
    price: 2099,
    category: 'journal',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600&h=400',
    rating: 5,
    tags: ['journal', 'writing', 'mindfulness', 'gratitude']
  },
  {
    name: 'Bamboo Meditation Cushion',
    description: 'Ergonomic meditation cushion with organic buckwheat filling. Supports proper posture for comfortable meditation sessions.',
    price: 3349,
    category: 'meditation',
    image: 'https://img.freepik.com/free-photo/still-life-foam-roller_23-2151817452.jpg?semt=ais_rp_50_assets&w=740&q=80',
    rating: 5,
    tags: ['meditation', 'cushion', 'yoga', 'comfort']
  },
  {
    name: 'Lavender Essential Oil Set',
    description: 'Pure lavender essential oil kit with diffuser. Promotes relaxation, reduces anxiety, and improves sleep quality naturally.',
    price: 2499,
    category: 'aromatherapy',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600&h=400',
    rating: 4,
    tags: ['essential-oil', 'lavender', 'relaxation', 'sleep']
  },
  {
    name: 'Yoga Mat – Extra Thick Comfort',
    description: 'Premium 6mm thick yoga mat with alignment lines. Non-slip surface perfect for yoga, stretching, and meditation.',
    price: 2949,
    category: 'fitness',
    image: 'https://yuneyoga.com/cdn/shop/articles/thumbnail_a3aa658c-2d56-400b-83d6-73717696f863.jpg?v=1744563546&width=2048',
    rating: 5,
    tags: ['yoga', 'exercise', 'mat', 'fitness']
  },
  {
    name: 'The Anxiety Toolkit (Book)',
    description: 'Practical guide with evidence-based strategies for managing anxiety. Written by a clinical psychologist with actionable exercises.',
    price: 1449,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600&h=400',
    rating: 4,
    tags: ['book', 'anxiety', 'self-help', 'psychology']
  },
  {
    name: 'Weighted Blanket – 15 lbs',
    description: 'Glass bead weighted blanket that provides deep pressure stimulation. Reduces anxiety and promotes deeper, more restful sleep.',
    price: 4999,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&q=80&w=600&h=400',
    rating: 5,
    tags: ['weighted-blanket', 'sleep', 'anxiety', 'comfort']
  },
  {
    name: 'Singing Bowl – Tibetan Meditation',
    description: 'Hand-hammered Tibetan singing bowl with wooden mallet. Creates soothing tones for meditation and sound healing.',
    price: 3749,
    category: 'meditation',
    image: 'https://pillowfights.co.in/cdn/shop/files/U9A0855-_1_c276323b-4be8-49dd-891b-92e292b21b6f.webp?v=1764721898&width=2048',
    rating: 5,
    tags: ['singing-bowl', 'meditation', 'sound-healing', 'tibetan']
  },
  {
    name: 'Resistance Band Set – 5 Levels',
    description: 'Color-coded resistance bands for exercise and physical therapy. Great for stress-relieving workouts at home or on the go.',
    price: 1649,
    category: 'fitness',
    image: 'https://5.imimg.com/data5/SELLER/Default/2022/1/YP/DZ/PW/85106980/resistance-band-tube-home-gym-workout-exercise-training-for-men-original-imag2fwsxcsgnchg-500x500.jpeg',
    rating: 4,
    tags: ['resistance-bands', 'exercise', 'fitness', 'workout']
  },
  {
    name: 'Aromatherapy Candle Set',
    description: 'Set of 4 soy wax candles in calming scents: Lavender, Eucalyptus, Chamomile, and Vanilla. Burns for 25+ hours each.',
    price: 2349,
    category: 'aromatherapy',
    image: 'https://images.unsplash.com/photo-1602607688066-0ff1a425bcc5?auto=format&fit=crop&q=80&w=600&h=400',
    rating: 4,
    tags: ['candles', 'aromatherapy', 'relaxation', 'scented']
  },
  {
    name: 'Gratitude Card Deck – 52 Prompts',
    description: 'Weekly gratitude prompts in a beautiful card deck. Perfect for mindful mornings and building a positive thinking habit.',
    price: 1249,
    category: 'journal',
    image: 'https://shop.mindful.org/cdn/shop/files/InstagramPost-1_720x.png?v=1745468135',
    rating: 4,
    tags: ['gratitude', 'cards', 'mindfulness', 'positive-thinking']
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${sampleProducts.length} products successfully!`);

    await mongoose.disconnect();
    console.log('📦 Database seeding complete. Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
