const { createClient } = require('@supabase/supabase-js');

// Use the correct Supabase configuration
const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
// You'll need to replace this with your actual service role key
const SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupCharacterCreation() {
  console.log('🔧 Setting up character creation...');

  try {
    // 1. Create avatars storage bucket
    console.log('🪣 Creating avatars storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating avatars bucket:', bucketError);
    } else {
      console.log('✅ Avatars bucket ready');
    }

    // 2. Test game_memory table access
    console.log('📊 Testing game_memory table...');
    const { data: testData, error: testError } = await supabase
      .from('game_memory')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️ Game memory table needs to be created. Please run the game-memory-schema.sql in your Supabase SQL editor.');
    } else {
      console.log('✅ Game memory table ready');
    }

    console.log('🎉 Setup completed!');
    console.log('📝 Next steps:');
    console.log('1. Run the game-memory-schema.sql in your Supabase SQL editor');
    console.log('2. Test character creation');

  } catch (error) {
    console.error('❌ Error setting up character creation:', error);
  }
}

// Run the setup
setupCharacterCreation(); 