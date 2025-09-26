-- Fixed Pricing Update - Handles JSONB Features Column
-- Run this to update your plans with the correct data types

-- First, let's check the current column types
DO $$
DECLARE
    features_type TEXT;
BEGIN
    SELECT data_type INTO features_type
    FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'features';
    
    RAISE NOTICE 'Features column type: %', features_type;
END $$;

-- Clear existing plans
DELETE FROM plans WHERE id IN ('free', 'premium', 'pro');

-- Insert plans with proper JSONB formatting for features
INSERT INTO plans (id, name, price, currency, interval, features, limits, popular) VALUES

-- FREE PLAN
('free', 'Free', 0.00, 'USD', 'forever', 
 '["5 messages per day", "1 AI Companion", "Basic personalities only", "Text chat only", "Community support", "Limited customization"]'::jsonb,
 '{"messagesPerDay": 5, "voiceCallsPerDay": 0, "companions": 1, "customPersonalities": false, "advancedFeatures": false, "voiceChat": false}'::jsonb,
 false),

-- PREMIUM PLAN  
('premium', 'Premium', 19.00, 'USD', 'month',
 '["50 messages per day", "5 voice calls per day", "Up to 3 AI Companions", "Custom personality creation", "Advanced voice features", "Priority support", "Early access to new features"]'::jsonb,
 '{"messagesPerDay": 50, "voiceCallsPerDay": 5, "companions": 3, "customPersonalities": true, "advancedFeatures": true, "voiceChat": true}'::jsonb,
 true),

-- PRO PLAN
('pro', 'Pro', 49.00, 'USD', 'month',
 '["Unlimited messages", "Unlimited voice calls", "Unlimited AI Companions", "Advanced AI training", "Custom voice creation", "Advanced analytics API access insights", "Exclusive companion themes", "Dedicated support", "Premium customer support"]'::jsonb,
 '{"messagesPerDay": -1, "voiceCallsPerDay": -1, "companions": -1, "customPersonalities": true, "advancedFeatures": true, "voiceChat": true, "customVoice": true, "analytics": true}'::jsonb,
 false);

-- Update existing users to match new structure
UPDATE user_profiles 
SET 
  subscription_plan_id = 'free',
  subscription_status = 'free'
WHERE subscription_plan_id IS NULL OR subscription_plan_id = '';

-- Update existing users based on their current plan
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

-- Reset daily usage for all users
UPDATE user_profiles 
SET 
  usage_messages_today = 0,
  usage_voice_calls_today = 0,
  last_active_at = NOW();

-- Verify the plans were inserted correctly
DO $$
DECLARE
    plan_record RECORD;
BEGIN
    RAISE NOTICE '✅ Plans inserted successfully:';
    FOR plan_record IN 
        SELECT id, name, price, currency, interval, popular
        FROM plans 
        ORDER BY price
    LOOP
        RAISE NOTICE '  %: % ($%/%) %', 
            plan_record.id, 
            plan_record.name, 
            plan_record.price, 
            plan_record.interval,
            CASE WHEN plan_record.popular THEN '⭐ POPULAR' ELSE '' END;
    END LOOP;
END $$; 