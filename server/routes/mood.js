/**
 * Mood Tracking Routes
 * POST   /api/mood       – Log a new mood entry
 * GET    /api/mood       – Get mood history for current user
 * GET    /api/mood/stats – Get mood statistics/analytics
 * DELETE /api/mood/:id   – Delete a mood entry
 */

const express = require('express');
const Mood = require('../models/Mood');
const authMiddleware = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

/**
 * POST /api/mood/detect
 * Detect mood from user input text using Gemini AI
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide more details for accurate detection.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI detection is currently unavailable (API key missing).' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze the following user's questionnaire responses and detect their current mood and its intensity.
      Categorize the mood into EXACTLY ONE of these categories: happy, sad, stressed, angry, calm, anxious.
      Estimate the intensity of this mood on a scale of 1 to 10.
      
      User Questionnaire Data:
      ${text}
      
      Respond STRICTLY in JSON format with two fields: "emotion" and "intensity".
      Example: {"emotion": "happy", "intensity": 8}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();
    
    // Extract JSON from response (sometimes Gemini wraps it in markdown)
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const detected = JSON.parse(jsonMatch[0]);
    
    // Validate detected emotion
    const validEmotions = ['happy', 'sad', 'stressed', 'angry', 'calm', 'anxious'];
    if (!validEmotions.includes(detected.emotion.toLowerCase())) {
        detected.emotion = 'calm'; // Fallback
    }

    res.json({
      emotion: detected.emotion.toLowerCase(),
      intensity: Math.min(Math.max(parseInt(detected.intensity) || 5, 1), 10),
      message: 'Mood detected! ✨'
    });

  } catch (err) {
    console.error('AI Mood Detection Error:', err);
    res.status(500).json({ error: 'Failed to detect mood using AI.' });
  }
});

// All mood routes below require authentication
router.use(authMiddleware);

/**
 * POST /api/mood
 * Log a new mood entry
 */
router.post('/', async (req, res) => {
  try {
    const { emotion, intensity, note } = req.body;

    if (!emotion) {
      return res.status(400).json({ error: 'Emotion is required.' });
    }

    const mood = new Mood({
      userId: req.userId,
      emotion,
      intensity: intensity || 5,
      note: note || ''
    });

    await mood.save();
    res.status(201).json({ message: 'Mood logged successfully! 📊', mood });
  } catch (err) {
    console.error('Mood creation error:', err);
    res.status(500).json({ error: 'Failed to log mood.' });
  }
});

/**
 * GET /api/mood
 * Get mood history for the authenticated user
 * Query params: ?limit=30&offset=0
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;

    const moods = await Mood.find({ userId: req.userId })
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Mood.countDocuments({ userId: req.userId });

    res.json({ moods, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood history.' });
  }
});

/**
 * GET /api/mood/stats
 * Get mood analytics for the current user
 * Returns emotion distribution and daily averages
 */
router.get('/stats', async (req, res) => {
  try {
    // Get mood distribution (count per emotion)
    const distribution = await Mood.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.userId.toString()) } },
      { $group: { _id: '$emotion', count: { $sum: 1 }, avgIntensity: { $avg: '$intensity' } } },
      { $sort: { count: -1 } }
    ]);

    // Get moods from last 7 days for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoods = await Mood.find({
      userId: req.userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // Total mood entries
    const totalEntries = await Mood.countDocuments({ userId: req.userId });

    res.json({
      distribution,
      recentMoods,
      totalEntries,
      message: 'Mood analytics loaded 📈'
    });
  } catch (err) {
    console.error('Mood stats error:', err);
    res.status(500).json({ error: 'Failed to fetch mood statistics.' });
  }
});

/**
 * DELETE /api/mood/:id
 * Delete a specific mood entry
 */
router.delete('/:id', async (req, res) => {
  try {
    const mood = await Mood.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!mood) {
      return res.status(404).json({ error: 'Mood entry not found.' });
    }

    res.json({ message: 'Mood entry deleted.', mood });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mood entry.' });
  }
});

module.exports = router;
