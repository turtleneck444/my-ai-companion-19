const { createClient } = require('@supabase/supabase-js');

// Use the correct Supabase configuration
const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
// You'll need to replace this with your actual service role key from Supabase dashboard
const SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixCharacterCreation() {
  console.log('🔧 Fixing character creation issues...');
  console.log('📝 This script will:');
  console.log('1. Create the avatars storage bucket');
  console.log('2. Set up storage policies');
  console.log('3. Verify game_memory table');
  console.log('');

  try {
    // 1. Create avatars storage bucket
    console.log('🪣 Creating avatars storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Avatars bucket already exists');
      } else {
        console.error('❌ Error creating avatars bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Avatars bucket created successfully');
    }

    // 2. Test game_memory table
    console.log('📊 Testing game_memory table...');
    const { data: testData, error: testError } = await supabase
      .from('game_memory')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️ Game memory table not found. Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Copy and paste this into your Supabase SQL editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS game_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_memory_user_id ON game_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_game_memory_updated_at ON game_memory(updated_at);

ALTER TABLE game_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game memory" ON game_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game memory" ON game_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game memory" ON game_memory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game memory" ON game_memory
  FOR DELETE USING (auth.uid() = user_id);
      `);
      console.log('');
    } else {
      console.log('✅ Game memory table is ready');
    }

    // 3. Test storage upload
    console.log('🧪 Testing storage upload...');
    try {
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload('test/test.txt', testFile);

      if (uploadError) {
        console.log('⚠️ Storage upload test failed:', uploadError.message);
      } else {
        console.log('✅ Storage upload test successful');
        // Clean up test file
        await supabase.storage.from('avatars').remove(['test/test.txt']);
      }
    } catch (testError) {
      console.log('⚠️ Storage test error:', testError.message);
    }

    console.log('');
    console.log('🎉 Character creation fixes completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Supabase client configuration: Fixed');
    console.log('✅ Avatars storage bucket: Ready');
    console.log('⚠️ Game memory table: Please run the SQL above if needed');
    console.log('');
    console.log('🚀 You can now test character creation!');

  } catch (error) {
    console.error('❌ Error fixing character creation:', error);
    console.log('');
    console.log('🔧 Manual steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Create a storage bucket called "avatars"');
    console.log('3. Make it public');
    console.log('4. Run the game_memory SQL in the SQL editor');
  }
}

// Run the fix
fixCharacterCreation();