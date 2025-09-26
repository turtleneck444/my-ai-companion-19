-- Activate existing users and fix their subscription status
-- Run this in Supabase SQL Editor

-- First, let's see what users we have and their current status
SELECT 
  id,
  email,
  preferred_name,
  plan,
  subscription_status,
  subscription_plan_id,
  created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- Update users based on their plan selection
-- If they have 'premium' or 'pro' in their plan field, activate them
UPDATE user_profiles 
SET 
  subscription_status = 'active',
  subscription_plan_id = plan,
  updated_at = NOW()
WHERE plan IN ('premium', 'pro') 
  AND (subscription_status IS NULL OR subscription_status = 'free');

-- Also update any users who might have been set to 'inactive' incorrectly
UPDATE user_profiles 
SET 
  subscription_status = 'active',
  updated_at = NOW()
WHERE plan IN ('premium', 'pro') 
  AND subscription_status = 'inactive';

-- Set free users to have proper status
UPDATE user_profiles 
SET 
  subscription_status = 'free',
  subscription_plan_id = 'free',
  updated_at = NOW()
WHERE plan = 'free' 
  AND (subscription_status IS NULL OR subscription_status != 'free');

-- Verify the changes
SELECT 
  id,
  email,
  preferred_name,
  plan,
  subscription_status,
  subscription_plan_id,
  created_at
FROM user_profiles 
ORDER BY created_at DESC;
