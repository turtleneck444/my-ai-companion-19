-- Fix Interval Constraint Issue
-- The plans table has a check constraint that doesn't allow "forever"

-- First, let's see what intervals are allowed
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname LIKE '%interval%' 
    AND conrelid = 'plans'::regclass;
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE 'Interval constraint: %', constraint_def;
    ELSE
        RAISE NOTICE 'No interval constraint found';
    END IF;
END $$;

-- Drop the existing constraint if it exists
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_interval_check;

-- Clear existing plans
DELETE FROM plans WHERE id IN ('free', 'premium', 'pro');

-- Insert plans with standard intervals
INSERT INTO plans (id, name, price, currency, interval, features, limits, popular) VALUES

-- FREE PLAN (using 'month' but $0 price)
('free', 'Free', 0.00, 'USD', 'month', 
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
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your pricing structure:';
    RAISE NOTICE '🔵 Free: $0/month (but actually free forever)';
    RAISE NOTICE '🟢 Premium: $19/month ⭐ Most Popular';
    RAISE NOTICE '💎 Pro: $49/month - Unlimited everything';
END $$; 