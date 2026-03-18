/**
 * MindSpace 3D – AI Mental Wellness Platform
 * Main Server Entry Point
 * 
 * This file initializes Express server, connects to MongoDB,
 * sets up middleware, and registers all API routes.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import route modules
const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const journalRoutes = require('./routes/journal');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');

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
app.use('/api/auth', authRoutes);       // Authentication (register, login)
app.use('/api/mood', moodRoutes);       // Mood tracking CRUD
app.use('/api/journal', journalRoutes); // Journal entries CRUD
app.use('/api/products', productRoutes); // Shop products listing
app.use('/api', chatRoutes);            // Chatbot endpoint

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MindSpace 3D API is running 🧠✨' });
});

// Serve the frontend for any non-API route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── MongoDB Connection ──────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindspace3d';

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    // Start the server after DB connection
    app.listen(PORT, () => {
      console.log(`🧠 MindSpace 3D server running at http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running locally or update MONGODB_URI in .env');
    // Start server even without DB for frontend development
    app.listen(PORT, () => {
      console.log(`⚠️  Server running WITHOUT database at http://localhost:${PORT}`);
    });
  });

module.exports = app;
