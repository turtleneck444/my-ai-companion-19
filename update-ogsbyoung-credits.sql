-- Update ogsbyoung@gmail.com with 100 messages and 10 calls
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
