const { supabase } = require('./server/supabase');

async function test() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
    } else {
      console.log('✅ Successfully connected to Supabase! Fetched data:', data);
    }
  } catch (err) {
    console.error('❌ Unhandled Exception:', err);
  }
}
test();
