-- Update LoveAI Pricing Plans to Match Exact Structure
-- Run this to sync your database with your current pricing page

-- First, let's update the plans table with your exact pricing
DELETE FROM plans WHERE id IN ('free', 'premium', 'pro');

INSERT INTO plans (id, name, price, currency, interval, features, limits, popular) VALUES
('free', 'Free', 0.00, 'USD', 'forever', 
 ARRAY[
   '5 messages per day',
   '1 AI Companion', 
   'Basic personalities only',
   'Text chat only',
   'Community support',
   'Limited customization'
 ],
 JSON_BUILD_OBJECT(
   'messagesPerDay', 5,
   'voiceCallsPerDay', 0,
   'companions', 1,
   'customPersonalities', false,
   'advancedFeatures', false,
   'voiceChat', false
 ),
 false),

('premium', 'Premium', 19.00, 'USD', 'month',
 ARRAY[
   '50 messages per day',
   '5 voice calls per day',
   'Up to 3 AI Companions',
   'Custom personality creation',
   'Advanced voice features', 
   'Priority support',
   'Early access to new features'
 ],
 JSON_BUILD_OBJECT(
   'messagesPerDay', 50,
   'voiceCallsPerDay', 5,
   'companions', 3,
   'customPersonalities', true,
   'advancedFeatures', true,
   'voiceChat', true
 ),
 true),

('pro', 'Pro', 49.00, 'USD', 'month',
 ARRAY[
   'Unlimited messages',
   'Unlimited voice calls',
   'Unlimited AI Companions',
   'Advanced AI training',
   'Custom voice creation',
   'Advanced analytics API access insights',
   'Exclusive companion themes',
   'Dedicated support',
   'Premium customer support'
 ],
 JSON_BUILD_OBJECT(
   'messagesPerDay', -1,
   'voiceCallsPerDay', -1,
   'companions', -1,
   'customPersonalities', true,
   'advancedFeatures', true,
   'voiceChat', true,
   'customVoice', true,
   'analytics', true
 ),
 false);

-- Update the SUBSCRIPTION_PLANS in your code by updating user_profiles with correct limits
-- First, let's see what we have and fix any existing users
UPDATE user_profiles 
SET 
  subscription_plan_id = 'free',
  subscription_status = 'free'
WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';

-- Update existing users based on their current plan to match new structure
UPDATE user_profiles 
SET 
  subscription_plan_id = CASE 
    WHEN plan = 'free' OR plan IS NULL THEN 'free'
    WHEN plan = 'premium' THEN 'premium' 
    WHEN plan = 'pro' THEN 'pro'
    ELSE 'free'
  END,
  subscription_status = CASE
    WHEN plan = 'free' OR plan IS NULL THEN 'free'
    ELSE 'active'
  END;

-- Reset daily usage for all users to start fresh
UPDATE user_profiles 
SET 
  usage_messages_today = 0,
  usage_voice_calls_today = 0,
  last_active_at = NOW();

-- Create a function to check plan limits (this will be used by your app)
CREATE OR REPLACE FUNCTION check_user_plan_limits(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_plan TEXT;
  plan_limits JSON;
  current_usage JSON;
  result JSON;
BEGIN
  -- Get user's current plan and usage
  SELECT 
    up.subscription_plan_id,
    up.usage_messages_today,
    up.usage_voice_calls_today,
    up.usage_companions_created
  INTO user_plan, current_usage
  FROM user_profiles up
  WHERE up.id = user_uuid;
  
  -- Get plan limits from plans table
  SELECT p.limits INTO plan_limits
  FROM plans p 
  WHERE p.id = COALESCE(user_plan, 'free');
  
  -- Build result with current usage and limits
  result := JSON_BUILD_OBJECT(
    'plan', COALESCE(user_plan, 'free'),
    'limits', plan_limits,
    'usage', JSON_BUILD_OBJECT(
      'messagesUsed', COALESCE((current_usage->>'usage_messages_today')::INTEGER, 0),
      'voiceCallsUsed', COALESCE((current_usage->>'usage_voice_calls_today')::INTEGER, 0),
      'companionsCreated', COALESCE((current_usage->>'usage_companions_created')::INTEGER, 0)
    ),
    'canSendMessage', CASE 
      WHEN (plan_limits->>'messagesPerDay')::INTEGER = -1 THEN true
      WHEN COALESCE((current_usage->>'usage_messages_today')::INTEGER, 0) < (plan_limits->>'messagesPerDay')::INTEGER THEN true
      ELSE false
    END,
    'canMakeVoiceCall', CASE 
      WHEN (plan_limits->>'voiceCallsPerDay')::INTEGER = -1 THEN true
      WHEN COALESCE((current_usage->>'usage_voice_calls_today')::INTEGER, 0) < (plan_limits->>'voiceCallsPerDay')::INTEGER THEN true
      ELSE false
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment usage (call this when user sends message/makes call)
CREATE OR REPLACE FUNCTION increment_user_usage(user_uuid UUID, usage_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  can_use BOOLEAN := false;
  limits_check JSON;
BEGIN
  -- Check current limits
  SELECT check_user_plan_limits(user_uuid) INTO limits_check;
  
  -- Check if user can perform action
  IF usage_type = 'message' THEN
    can_use := (limits_check->>'canSendMessage')::BOOLEAN;
    IF can_use THEN
      UPDATE user_profiles 
      SET 
        usage_messages_today = usage_messages_today + 1,
        last_active_at = NOW()
      WHERE id = user_uuid;
    END IF;
  ELSIF usage_type = 'voice_call' THEN
    can_use := (limits_check->>'canMakeVoiceCall')::BOOLEAN;
    IF can_use THEN
      UPDATE user_profiles 
      SET 
        usage_voice_calls_today = usage_voice_calls_today + 1,
        last_active_at = NOW()
      WHERE id = user_uuid;
    END IF;
  ELSIF usage_type = 'companion' THEN
    UPDATE user_profiles 
    SET 
      usage_companions_created = usage_companions_created + 1,
      last_active_at = NOW()
    WHERE id = user_uuid;
    can_use := true;
  END IF;
  
  RETURN can_use;
END;
$$ LANGUAGE plpgsql;

-- Update the user_admin_view to show the new plan structure
DROP VIEW IF EXISTS user_admin_view;
CREATE OR REPLACE VIEW user_admin_view AS
SELECT 
  up.id,
  up.email,
  up.preferred_name,
  up.subscription_status,
  up.subscription_plan_id,
  p.name as plan_name,
  p.price as plan_price,
  up.payment_provider,
  up.total_spent,
  up.usage_messages_today || '/' || CASE 
    WHEN (p.limits->>'messagesPerDay')::INTEGER = -1 THEN '∞'
    ELSE (p.limits->>'messagesPerDay')::TEXT
  END as messages_usage,
  up.usage_voice_calls_today || '/' || CASE 
    WHEN (p.limits->>'voiceCallsPerDay')::INTEGER = -1 THEN '∞'
    ELSE (p.limits->>'voiceCallsPerDay')::TEXT
  END as voice_usage,
  up.usage_companions_created || '/' || CASE 
    WHEN (p.limits->>'companions')::INTEGER = -1 THEN '∞'
    ELSE (p.limits->>'companions')::TEXT
  END as companions_usage,
  up.subscription_period_start,
  up.subscription_period_end,
  up.last_payment_date,
  up.next_billing_date,
  up.created_at,
  up.last_active_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN up.subscription_status = 'active' THEN '🟢 Active ($' || p.price || '/mo)'
    WHEN up.subscription_status = 'canceled' THEN '🟡 Canceled'
    WHEN up.subscription_status = 'free' THEN '🔵 Free'
    ELSE '🔴 ' || up.subscription_status
  END as status_display
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
LEFT JOIN plans p ON up.subscription_plan_id = p.id
ORDER BY up.created_at DESC;

-- Sample queries you can run to check everything
/*
-- View all users with their updated plan details
SELECT * FROM user_admin_view LIMIT 20;

-- Check plan limits for a specific user
SELECT check_user_plan_limits('your-user-id-here');

-- Test incrementing usage for a user
SELECT increment_user_usage('your-user-id-here', 'message');

-- Count users by plan with revenue
SELECT 
  subscription_plan_id,
  COUNT(*) as user_count,
  SUM(total_spent) as total_revenue,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active_users
FROM user_profiles 
GROUP BY subscription_plan_id;

-- See current plans and their limits
SELECT 
  id,
  name, 
  price,
  currency,
  interval,
  features,
  limits,
  popular
FROM plans
ORDER BY price;
*/

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ LoveAI pricing plans updated successfully!';
  RAISE NOTICE '📊 Plans now match your exact pricing structure:';
  RAISE NOTICE '🔵 Free: $0 - 5 messages/day, 1 companion, text only';
  RAISE NOTICE '🟢 Premium: $19/mo - 50 messages/day, 5 voice calls, 3 companions';
  RAISE NOTICE '💎 Pro: $49/mo - Unlimited everything + advanced features';
END $$; 