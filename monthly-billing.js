// Monthly Billing Cron Job
// Run this daily to process monthly subscriptions
// Deploy this as a Netlify scheduled function or use a cron service

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processMonthlyBilling() {
  try {
    console.log('🔄 Starting monthly billing process...');
    
    // Call the database function to process billing
    const { data, error } = await supabase.rpc('process_monthly_billing');
    
    if (error) {
      console.error('❌ Billing process failed:', error);
      return;
    }
    
    console.log(`✅ Billing process completed. Processed ${data[0]?.processed_count || 0} subscriptions.`);
    
  } catch (error) {
    console.error('❌ Monthly billing error:', error);
  }
}

// For testing
if (require.main === module) {
  processMonthlyBilling();
}

module.exports = { processMonthlyBilling };
