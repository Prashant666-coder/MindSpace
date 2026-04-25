/**
 * MindSpace 3D – AI Mental Wellness Platform
 * Main Server Entry Point
 * 
 * This file initializes Express server, sets up middleware,
 * and registers all API routes using Supabase for data persistence.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import route modules
const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const journalRoutes = require('./routes/journal');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());                              // Enable CORS for all origins
app.use(morgan('dev'));                       // HTTP request logger
app.use(express.json());                      // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);       // Authentication routes
app.use('/api/mood', moodRoutes);       // Mood tracking CRUD
app.use('/api/journal', journalRoutes); // Journal entries CRUD
app.use('/api/products', productRoutes); // Shop products listing
app.use('/api/payment', paymentRoutes); // Razorpay payment routes
app.use('/api', chatRoutes);            // Chatbot endpoint

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MindSpace 3D API is running 🧠✨ (Supabase Powered)' });
});

// Serve the frontend for any non-API route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🧠 MindSpace 3D server running at http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔗 Connected to Supabase for data persistence`);
  });
}

module.exports = app;
