/**
 * Mood Tracking Routes
 * POST   /api/mood       – Log a new mood entry
 * GET    /api/mood       – Get mood history for current user
 * GET    /api/mood/stats – Get mood statistics/analytics
 * DELETE /api/mood/:id   – Delete a mood entry
 */

const express = require('express')
const { getSupabase } = require('../supabase')
const authMiddleware = require('../middleware/auth')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const router = express.Router()

/**
 * POST /api/mood/detect
 * Detect mood from user input text using Gemini AI (public, no auth needed)
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body

    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide more details for accurate detection.' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI detection is currently unavailable (API key missing).' })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    const prompt = `
      Analyze the following user's questionnaire responses and detect their current mood and its intensity.
      Categorize the mood into EXACTLY ONE of these categories: happy, sad, stressed, angry, calm, anxious.
      Estimate the intensity of this mood on a scale of 1 to 10.
      
      User Questionnaire Data:
      ${text}
      
      Respond STRICTLY in JSON format with two fields: "emotion" and "intensity".
      Example: {"emotion": "happy", "intensity": 8}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text().trim()

    const jsonMatch = responseText.match(/\{.*\}/s)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const detected = JSON.parse(jsonMatch[0])

    const validEmotions = ['happy', 'sad', 'stressed', 'angry', 'calm', 'anxious']
    if (!validEmotions.includes(detected.emotion.toLowerCase())) {
      detected.emotion = 'calm'
    }

    res.json({
      emotion: detected.emotion.toLowerCase(),
      intensity: Math.min(Math.max(parseInt(detected.intensity) || 5, 1), 10),
      message: 'Mood detected! ✨'
    })
  } catch (err) {
    console.error('AI Mood Detection Error:', err)
    res.status(500).json({ error: 'Failed to detect mood using AI.' })
  }
})

// All mood routes below require authentication
router.use(authMiddleware)

/**
 * POST /api/mood
 */
router.post('/', async (req, res) => {
  try {
    const { emotion, intensity, note } = req.body
    if (!emotion) return res.status(400).json({ error: 'Emotion is required.' })

    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('moods')
      .insert([{
        userId: req.userId,
        emotion: emotion.toLowerCase(),
        intensity: intensity || 5,
        note: note || '',
        date: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    res.status(201).json({ message: 'Mood logged successfully! 📊', mood: data[0] })
  } catch (err) {
    console.error('Mood creation error:', err)
    res.status(500).json({ error: 'Failed to log mood.' })
  }
})

/**
 * GET /api/mood
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30
    const offset = parseInt(req.query.offset) || 0

    const sb = getSupabase(req.supabaseToken)

    const { data, error, count } = await sb
      .from('moods')
      .select('*', { count: 'exact' })
      .eq('userId', req.userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({ moods: data || [], total: count, limit, offset })
  } catch (err) {
    console.error('Mood fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch mood history.' })
  }
})

/**
 * GET /api/mood/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const sb = getSupabase(req.supabaseToken)

    const { data: allMoods, error } = await sb
      .from('moods')
      .select('*')
      .eq('userId', req.userId)

    if (error) throw error

    // Calculate distribution
    const moodCounts = {}
    ;(allMoods || []).forEach(m => {
      if (!moodCounts[m.emotion]) {
        moodCounts[m.emotion] = { emotion: m.emotion, count: 0, sumIntensity: 0 }
      }
      moodCounts[m.emotion].count++
      moodCounts[m.emotion].sumIntensity += m.intensity
    })

    const distribution = Object.values(moodCounts).map(m => ({
      _id: m.emotion,
      count: m.count,
      avgIntensity: m.sumIntensity / m.count
    })).sort((a, b) => b.count - a.count)

    // Filter recent moods (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentMoods = (allMoods || [])
      .filter(m => new Date(m.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    res.json({
      distribution,
      recentMoods,
      totalEntries: (allMoods || []).length,
      message: 'Mood analytics loaded 📈'
    })
  } catch (err) {
    console.error('Mood stats error:', err)
    res.status(500).json({ error: 'Failed to fetch mood statistics.' })
  }
})

/**
 * DELETE /api/mood/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('moods')
      .delete()
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found.' })
    }

    res.json({ message: 'Mood entry deleted.', mood: data[0] })
  } catch (err) {
    console.error('Mood deletion error:', err)
    res.status(500).json({ error: 'Failed to delete mood entry.' })
  }
})

module.exports = router
