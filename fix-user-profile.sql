-- Fix duplicate key issue and set up ogsbyoung@gmail.com with Premium plan

-- First, check if user exists and delete any duplicates
DELETE FROM user_profiles 
WHERE id = '80a520d6-ae6a-4056-bff4-a5412839ad6e';

-- Now insert the user with Premium plan and automatic billing dates
INSERT INTO user_profiles (
  id,
  email,
  subscription_plan_id,
  subscription_status,
  next_billing_date,
  usage_voice_calls_today,
  usage_messages_today,
  usage_companions_created,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  '80a520d6-ae6a-4056-bff4-a5412839ad6e',
  'ogsbyoung@gmail.com',
  'premium',
  'active',
  NOW() + INTERVAL '1 month', -- Next billing date 1 month from now
  0, -- Reset voice calls so they can use them
  0, -- Reset messages
  0, -- No companions created yet
  NOW(),
  NOW(),
  NOW()
);

-- Verify the user was created properly
SELECT 
  email,
  subscription_plan_id,
  subscription_status,
  next_billing_date,
  usage_voice_calls_today,
  usage_messages_today
FROM user_profiles 
WHERE id = '80a520d6-ae6a-4056-bff4-a5412839ad6e';

-- Test the user's limits to confirm they can make voice calls
SELECT check_user_plan_limits('80a520d6-ae6a-4056-bff4-a5412839ad6e'::UUID);
