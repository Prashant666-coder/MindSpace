/**
 * Journal Routes
 * POST   /api/journal       – Create a new journal entry
 * GET    /api/journal       – Get all journal entries for current user
 * GET    /api/journal/:id   – Get a single journal entry
 * PUT    /api/journal/:id   – Update a journal entry
 * DELETE /api/journal/:id   – Delete a journal entry
 */

const express = require('express');
const Journal = require('../models/Journal');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All journal routes require authentication
router.use(authMiddleware);

/**
 * POST /api/journal
 * Create a new journal entry
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, mood } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const entry = new Journal({
      userId: req.userId,
      title,
      content,
      mood: mood || ''
    });

    await entry.save();
    res.status(201).json({ message: 'Journal entry saved! 📝', entry });
  } catch (err) {
    console.error('Journal creation error:', err);
    res.status(500).json({ error: 'Failed to save journal entry.' });
  }
});

/**
 * GET /api/journal
 * Get all journal entries for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const entries = await Journal.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Journal.countDocuments({ userId: req.userId });

    res.json({ entries, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entries.' });
  }
});

/**
 * GET /api/journal/:id
 * Get a specific journal entry
 */
router.get('/:id', async (req, res) => {
  try {
    const entry = await Journal.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entry.' });
  }
});

/**
 * PUT /api/journal/:id
 * Update an existing journal entry
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, mood } = req.body;

    const entry = await Journal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, content, mood, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    res.json({ message: 'Journal entry updated! ✏️', entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update journal entry.' });
  }
});

/**
 * DELETE /api/journal/:id
 * Delete a journal entry
 */
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Journal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    res.json({ message: 'Journal entry deleted.', entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete journal entry.' });
  }
});

module.exports = router;
