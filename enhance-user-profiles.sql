-- Enhanced User Profiles Schema
-- Add detailed subscription and plan tracking columns to user_profiles

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS usage_messages_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_voice_calls_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_companions_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS pronouns TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_id ON user_profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_id ON user_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at);

-- Create a view for easy admin viewing of user details
CREATE OR REPLACE VIEW user_admin_view AS
SELECT 
  up.id,
  up.email,
  up.preferred_name,
  up.subscription_status,
  up.subscription_plan_id,
  up.payment_provider,
  up.total_spent,
  up.usage_messages_today,
  up.usage_voice_calls_today,
  up.usage_companions_created,
  up.subscription_period_start,
  up.subscription_period_end,
  up.last_payment_date,
  up.next_billing_date,
  up.created_at,
  up.last_active_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN up.subscription_status = 'active' THEN '🟢 Active'
    WHEN up.subscription_status = 'canceled' THEN '🟡 Canceled'
    WHEN up.subscription_status = 'free' THEN '🔵 Free'
    ELSE '🔴 ' || up.subscription_status
  END as status_display
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Function to update daily usage counts
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    usage_messages_today = 0,
    usage_voice_calls_today = 0
  WHERE last_active_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to track user activity
CREATE OR REPLACE FUNCTION update_user_activity(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET last_active_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    id, 
    email, 
    preferred_name, 
    plan,
    subscription_status,
    subscription_plan_id,
    profile_completed,
    onboarding_completed
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'preferred_name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'free'),
    'free',
    'free',
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    preferred_name = COALESCE(EXCLUDED.preferred_name, user_profiles.preferred_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sample queries for common admin tasks
-- (These are just examples - don't run them, they're for reference)

/*
-- View all users with their subscription details
SELECT * FROM user_admin_view LIMIT 50;

-- Count users by plan
SELECT 
  subscription_plan_id,
  COUNT(*) as user_count,
  SUM(total_spent) as total_revenue
FROM user_profiles 
GROUP BY subscription_plan_id;

-- Find active subscribers
SELECT * FROM user_admin_view 
WHERE subscription_status = 'active'
ORDER BY subscription_period_end ASC;

-- Find users who need usage reset
SELECT id, preferred_name, usage_messages_today, usage_voice_calls_today 
FROM user_profiles 
WHERE last_active_at < CURRENT_DATE 
AND (usage_messages_today > 0 OR usage_voice_calls_today > 0);

-- Update a user's subscription (example)
UPDATE user_profiles 
SET 
  subscription_status = 'active',
  subscription_plan_id = 'premium',
  subscription_period_start = NOW(),
  subscription_period_end = NOW() + INTERVAL '1 month',
  payment_provider = 'square',
  customer_id = 'sq_customer_123'
WHERE id = 'user-uuid-here';
*/

-- Comments explaining the new columns:
/*
New columns added:
- subscription_status: 'free', 'active', 'canceled', 'past_due', 'trialing'
- subscription_plan_id: 'free', 'premium', 'pro'
- subscription_period_start/end: Billing period dates
- subscription_canceled_at: When user canceled
- subscription_cancel_at_period_end: Whether to cancel at period end
- payment_provider: 'stripe', 'square', 'paypal', etc.
- customer_id: Provider's customer ID
- subscription_id: Provider's subscription ID
- last_payment_date: Last successful payment
- next_billing_date: Next billing date
- total_spent: Total amount spent by user
- usage_*: Daily usage tracking for plan limits
- profile fields: Additional user info for personalization
- onboarding_completed: Whether user finished setup
- last_active_at: For usage reset and analytics
*/ 