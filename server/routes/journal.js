/**
 * Journal Routes
 * POST   /api/journal       – Create a new journal entry
 * GET    /api/journal       – Get all journal entries for current user
 * GET    /api/journal/:id   – Get a single journal entry
 * PUT    /api/journal/:id   – Update a journal entry
 * DELETE /api/journal/:id   – Delete a journal entry
 */

const express = require('express')
const { getSupabase } = require('../supabase')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// All journal routes require authentication
router.use(authMiddleware)

/**
 * POST /api/journal
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, mood } = req.body
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('journals')
      .insert([{
        user_id: req.userId,
        title,
        content,
        mood: mood || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    res.status(201).json({ message: 'Journal entry saved! 📝', entry: data[0] })
  } catch (err) {
    console.error('Journal creation error:', err)
    res.status(500).json({ error: 'Failed to save journal entry.' })
  }
})

/**
 * GET /api/journal
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0

    const sb = getSupabase(req.supabaseToken)

    const { data, error, count } = await sb
      .from('journals')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({ entries: data || [], total: count, limit, offset })
  } catch (err) {
    console.error('Journal fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch journal entries.' })
  }
})

/**
 * GET /api/journal/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('journals')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Journal entry not found.' })
      }
      throw error
    }

    res.json({ entry: data })
  } catch (err) {
    console.error('Journal get by id error:', err)
    res.status(500).json({ error: 'Failed to fetch journal entry.' })
  }
})

/**
 * PUT /api/journal/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, mood } = req.body
    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('journals')
      .update({
        title,
        content,
        mood,
        updatedAt: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found.' })
    }

    res.json({ message: 'Journal entry updated! ✏️', entry: data[0] })
  } catch (err) {
    console.error('Journal update error:', err)
    res.status(500).json({ error: 'Failed to update journal entry.' })
  }
})

/**
 * DELETE /api/journal/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const sb = getSupabase(req.supabaseToken)

    const { data, error } = await sb
      .from('journals')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found.' })
    }

    res.json({ message: 'Journal entry deleted.', entry: data[0] })
  } catch (err) {
    console.error('Journal deletion error:', err)
    res.status(500).json({ error: 'Failed to delete journal entry.' })
  }
})

module.exports = router
