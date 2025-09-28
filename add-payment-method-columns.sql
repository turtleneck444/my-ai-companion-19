-- Add payment method columns to user_profiles table
-- This allows storing Stripe payment method details for each user

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_exp_month INTEGER,
ADD COLUMN IF NOT EXISTS card_exp_year INTEGER,
ADD COLUMN IF NOT EXISTS payment_method_created TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_payment_method_id 
ON user_profiles(payment_method_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_customer_id 
ON user_profiles(subscription_customer_id);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.payment_method_id IS 'Stripe payment method ID for recurring billing';
COMMENT ON COLUMN user_profiles.card_brand IS 'Card brand (visa, mastercard, etc.)';
COMMENT ON COLUMN user_profiles.card_last4 IS 'Last 4 digits of the card';
COMMENT ON COLUMN user_profiles.card_exp_month IS 'Card expiration month';
COMMENT ON COLUMN user_profiles.card_exp_year IS 'Card expiration year';
COMMENT ON COLUMN user_profiles.payment_method_created IS 'When the payment method was created in Stripe';
