/**
 * Product Routes
 * GET /api/products          – Get all products (public)
 * GET /api/products/:id      – Get a single product
 * GET /api/products/category/:cat – Get products by category
 */

const express = require('express');
const { supabase } = require('../supabase');

const router = express.Router();

/**
 * GET /api/products
 * Get all products, with optional category filter
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let query = supabase.from('products').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: products, error } = await query
      .order('rating', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ products: products || [], total: (products || []).length });
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ products: [], total: 0, error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/category/:cat
 */
router.get('/category/:cat', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', req.params.cat)
      .order('rating', { ascending: false });

    if (error) throw error;

    res.json({ products: products || [], category: req.params.cat });
  } catch (err) {
    console.error('Category fetch error:', err);
    res.status(500).json({ products: [], category: req.params.cat, error: 'Failed to fetch category products' });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ product });
  } catch (err) {
    console.error('Product get by id error:', err);
    res.status(404).json({ error: 'Product not found' });
  }
});

module.exports = router;
