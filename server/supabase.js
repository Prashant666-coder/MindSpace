/**
 * Supabase Client for MindSpace 3D Backend
 * 
 * Exports:
 * - supabase: Base client (for unauthenticated ops like products listing)
 * - getSupabase(token): Returns a client with the user's JWT set,
 *   so RLS policies (auth.uid()) work correctly.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase credentials missing in .env (SUPABASE_URL, SUPABASE_ANON_KEY)')
}

// Base client — used for public operations (no user context)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Returns a Supabase client that impersonates the given user.
 * RLS policies using auth.uid() will resolve to this user's ID.
 * 
 * @param {string} accessToken - The user's Supabase access_token (JWT)
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function getSupabase(accessToken) {
  if (!accessToken) return supabase // fallback to base client

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}

module.exports = { supabase, getSupabase }