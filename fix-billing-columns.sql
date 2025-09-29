-- Add missing billing columns to user_profiles table
-- This ensures automatic billing dates work properly

-- Add missing columns for billing dates
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Update the next_billing_date column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;

-- Create index for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_next_billing 
ON user_profiles(next_billing_date) 
WHERE next_billing_date IS NOT NULL;

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_subs 
ON user_profiles(subscription_status, subscription_plan_id) 
WHERE subscription_status = 'active';

-- Function to set automatic billing dates for existing users
CREATE OR REPLACE FUNCTION update_existing_users_billing()
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Update all premium/pro users with automatic billing dates
  FOR user_record IN 
    SELECT id, subscription_plan_id, created_at
    FROM user_profiles 
    WHERE subscription_plan_id IN ('premium', 'pro')
      AND (next_billing_date IS NULL OR billing_cycle_start IS NULL)
  LOOP
    UPDATE user_profiles 
    SET 
      billing_cycle_start = COALESCE(created_at, NOW()),
      next_billing_date = COALESCE(created_at, NOW()) + INTERVAL '1 month',
      last_payment_date = COALESCE(created_at, NOW()),
      updated_at = NOW()
    WHERE id = user_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN 'Updated ' || updated_count || ' users with automatic billing dates';
END;
$$ LANGUAGE plpgsql;

-- Run the update for existing users
SELECT update_existing_users_billing();

-- Show the results
SELECT 
  email,
  subscription_plan_id,
  billing_cycle_start,
  next_billing_date,
  last_payment_date,
  usage_voice_calls_today
FROM user_profiles 
WHERE subscription_plan_id != 'free' OR email LIKE '%ogsbyoung%';
