/**
 * Supabase Authentication Middleware
 * Verifies the user's Supabase JWT from the Authorization header.
 * Attaches userId, user object, and raw token to the request.
 */

const { supabase } = require('../supabase')

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    // Attach to request for downstream use
    req.userId = user.id
    req.user = user
    req.supabaseToken = token  // Routes need this to create user-scoped Supabase clients
    next()
  } catch (err) {
    console.error('Auth Middleware Error:', err)
    return res.status(500).json({ error: 'Internal server error during authentication.' })
  }
}

module.exports = authMiddleware
