-- Fix subscription schema for payment system
-- Add missing subscription columns to user_profiles table

-- Add subscription_customer_id column (referenced by backend)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_customer_id TEXT;

-- Add subscription_plan column (if it doesn't exist)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

-- Add payment method columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_exp_month INTEGER,
ADD COLUMN IF NOT EXISTS card_exp_year INTEGER,
ADD COLUMN IF NOT EXISTS payment_method_created TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_customer_id 
ON user_profiles(subscription_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_payment_method_id 
ON user_profiles(payment_method_id);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.subscription_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN user_profiles.subscription_plan IS 'Current subscription plan (free, premium, pro)';
COMMENT ON COLUMN user_profiles.payment_method_id IS 'Stripe payment method ID for recurring billing';
COMMENT ON COLUMN user_profiles.card_brand IS 'Card brand (visa, mastercard, etc.)';
COMMENT ON COLUMN user_profiles.card_last4 IS 'Last 4 digits of the card';
COMMENT ON COLUMN user_profiles.card_exp_month IS 'Card expiration month';
COMMENT ON COLUMN user_profiles.card_exp_year IS 'Card expiration year';
COMMENT ON COLUMN user_profiles.payment_method_created IS 'When the payment method was created in Stripe';
