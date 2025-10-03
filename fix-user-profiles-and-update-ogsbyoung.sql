-- First, let's check what columns exist in user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Add the missing columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS messages_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_calls_used INTEGER DEFAULT 0;

-- Update ogsbyoung@gmail.com with 0 messages and 0 calls used
UPDATE user_profiles 
SET 
  messages_used = 0,
  voice_calls_used = 0,
  updated_at = NOW()
WHERE email = 'ogsbyoung@gmail.com';

-- If the user doesn't exist, create them
INSERT INTO user_profiles (
  user_id,
  email,
  plan,
  messages_used,
  voice_calls_used,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'ogsbyoung@gmail.com',
  'free',
  0,
  0,
  'active',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'ogsbyoung@gmail.com'
ON CONFLICT (email) DO UPDATE SET
  messages_used = 0,
  voice_calls_used = 0,
  updated_at = NOW();

-- Verify the update
SELECT 
  email,
  plan,
  messages_used,
  voice_calls_used,
  subscription_status,
  updated_at
FROM user_profiles 
WHERE email = 'ogsbyoung@gmail.com';
