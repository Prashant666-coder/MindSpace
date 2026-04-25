/**
 * Authentication Routes (Supabase Migration)
 * GET  /api/auth/me – Get current user profile (protected)
 * 
 * Note: Login and Registration are handled directly by the frontend using Supabase SDK.
 */

const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/auth/me
 * Get current authenticated user's profile from the Supabase session
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is attached by the authMiddleware after verifying the Supabase token
    if (!req.user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.json({ 
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name || req.user.email.split('@')[0],
        lastSignIn: req.user.last_sign_in_at
      }
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Server error fetching user profile.' });
  }
});

module.exports = router;
