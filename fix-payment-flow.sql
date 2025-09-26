-- Fix the payment flow issue
-- The problem is that accounts are being created before payment confirmation

-- First, let's see what users we have
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

-- Reset any users who were created but payment failed
-- (This will help us test the fixed flow)
UPDATE user_profiles 
SET 
  subscription_status = 'free',
  subscription_plan_id = 'free',
  plan = 'free'
WHERE subscription_status = 'inactive' 
  AND plan IN ('premium', 'pro');
