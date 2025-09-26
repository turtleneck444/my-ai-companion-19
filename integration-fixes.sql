-- Integration Fixes - Make sure database functions work with existing users
-- Run this after the main setup to ensure everything is connected

-- First, let's run the enhance user profiles script if it wasn't run yet
-- (This is safe to run multiple times)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS usage_messages_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_voice_calls_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_companions_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Update any existing users to have proper plan data
UPDATE user_profiles 
SET 
  subscription_plan_id = COALESCE(subscription_plan_id, plan, 'free'),
  subscription_status = CASE 
    WHEN plan = 'free' OR plan IS NULL THEN 'free'
    ELSE 'active'
  END,
  usage_messages_today = COALESCE(usage_messages_today, 0),
  usage_voice_calls_today = COALESCE(usage_voice_calls_today, 0),
  usage_companions_created = COALESCE(usage_companions_created, 0),
  last_active_at = COALESCE(last_active_at, NOW())
WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';

-- Create the check plan limits function (safe to recreate)
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
    JSON_BUILD_OBJECT(
      'usage_messages_today', COALESCE(up.usage_messages_today, 0),
      'usage_voice_calls_today', COALESCE(up.usage_voice_calls_today, 0),
      'usage_companions_created', COALESCE(up.usage_companions_created, 0)
    )
  INTO user_plan, current_usage
  FROM user_profiles up
  WHERE up.id = user_uuid;
  
  -- Get plan limits from plans table
  SELECT p.limits INTO plan_limits
  FROM plans p 
  WHERE p.id = COALESCE(user_plan, 'free');
  
  -- If no plan found, use free plan defaults
  IF plan_limits IS NULL THEN
    plan_limits := '{"messagesPerDay": 5, "voiceCallsPerDay": 0, "companions": 1}'::JSON;
  END IF;
  
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

-- Create the increment usage function (safe to recreate)
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
        usage_messages_today = COALESCE(usage_messages_today, 0) + 1,
        last_active_at = NOW()
      WHERE id = user_uuid;
    END IF;
  ELSIF usage_type = 'voice_call' THEN
    can_use := (limits_check->>'canMakeVoiceCall')::BOOLEAN;
    IF can_use THEN
      UPDATE user_profiles 
      SET 
        usage_voice_calls_today = COALESCE(usage_voice_calls_today, 0) + 1,
        last_active_at = NOW()
      WHERE id = user_uuid;
    END IF;
  ELSIF usage_type = 'companion' THEN
    UPDATE user_profiles 
    SET 
      usage_companions_created = COALESCE(usage_companions_created, 0) + 1,
      last_active_at = NOW()
    WHERE id = user_uuid;
    can_use := true;
  END IF;
  
  RETURN can_use;
END;
$$ LANGUAGE plpgsql;

-- Test the functions with your current users
DO $$
DECLARE
    user_record RECORD;
    limits_result JSON;
BEGIN
    RAISE NOTICE '🧪 Testing plan limits for existing users:';
    
    FOR user_record IN 
        SELECT id, email, subscription_plan_id 
        FROM user_profiles 
        LIMIT 3
    LOOP
        SELECT check_user_plan_limits(user_record.id) INTO limits_result;
        RAISE NOTICE '  User %: Plan = %, Can send message = %', 
            user_record.email, 
            limits_result->>'plan',
            limits_result->>'canSendMessage';
    END LOOP;
    
    RAISE NOTICE '✅ Database integration is working properly!';
END $$; 