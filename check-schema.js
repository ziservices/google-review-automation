require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('app_settings').select('*').limit(1);
  if (error) {
    console.error('app_settings error:', error.message);
  } else {
    console.log('app_settings exists:', data);
  }

  const { data: bData, error: bError } = await supabase.from('businesses').select('*').limit(1);
  console.log('businesses exists:', !bError);
}
check();
