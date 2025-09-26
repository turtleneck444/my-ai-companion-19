
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// TODO: Replace with your NEW Supabase project credentials
const NEW_SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL_HERE';
const NEW_SUPABASE_ANON_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY_HERE';

const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY);

async function restoreAllData() {
  console.log('🔄 Starting data restore to new Supabase project...');
  
  const backupFiles = fs.readdirSync('./supabase-backup')
    .filter(file => file.endsWith('.json') && file !== 'auth_users.json');

  for (const file of backupFiles) {
    const tableName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join('./supabase-backup', file), 'utf8'));
    
    if (data.length > 0) {
      console.log(`📊 Restoring ${data.length} records to ${tableName}...`);
      
      const { error } = await newSupabase
        .from(tableName)
        .insert(data);
        
      if (error) {
        console.log(`⚠️ Error restoring ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Successfully restored ${tableName}`);
      }
    }
  }
  
  console.log('🎉 Data restore completed!');
}

restoreAllData().catch(console.error);
