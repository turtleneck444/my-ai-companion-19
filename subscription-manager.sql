-- Subscription Management System for LoveAI
-- Run this in Supabase SQL Editor

-- Create subscriptions table for tracking recurring payments
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, unpaid
  square_customer_id TEXT,
  square_card_id TEXT,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription payments table for tracking payment history
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  square_payment_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, failed, pending
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

-- Create function to create subscription
CREATE OR REPLACE FUNCTION create_subscription(
  p_user_id UUID,
  p_plan_id TEXT,
  p_square_customer_id TEXT,
  p_square_card_id TEXT
) RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
  plan_interval INTERVAL;
BEGIN
  -- Determine interval based on plan
  CASE p_plan_id
    WHEN 'free' THEN plan_interval := INTERVAL '0 days';
    WHEN 'premium' THEN plan_interval := INTERVAL '1 month';
    WHEN 'pro' THEN plan_interval := INTERVAL '1 month';
    ELSE plan_interval := INTERVAL '1 month';
  END CASE;

  -- Create subscription
  INSERT INTO subscriptions (
    user_id, plan_id, square_customer_id, square_card_id,
    current_period_end
  ) VALUES (
    p_user_id, p_plan_id, p_square_customer_id, p_square_card_id,
    NOW() + plan_interval
  ) RETURNING id INTO subscription_id;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    plan = p_plan_id,
    subscription_status = 'active',
    subscription_plan_id = p_plan_id,
    customer_id = p_square_customer_id,
    subscription_id = subscription_id,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process monthly billing
CREATE OR REPLACE FUNCTION process_monthly_billing()
RETURNS TABLE(processed_count INTEGER) AS $$
DECLARE
  sub RECORD;
  payment_result JSON;
  processed_count INTEGER := 0;
BEGIN
  -- Find subscriptions that need billing
  FOR sub IN 
    SELECT s.*, up.email, p.price
    FROM subscriptions s
    JOIN user_profiles up ON s.user_id = up.id
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
      AND s.current_period_end <= NOW()
      AND s.cancel_at_period_end = false
      AND s.square_customer_id IS NOT NULL
      AND s.square_card_id IS NOT NULL
  LOOP
    -- Here you would call Square API to charge the card
    -- For now, we'll simulate success
    payment_result := json_build_object(
      'success', true,
      'payment_id', 'square_' || extract(epoch from now())::text,
      'amount', sub.price * 100
    );

    IF (payment_result->>'success')::boolean THEN
      -- Record successful payment
      INSERT INTO subscription_payments (
        subscription_id, square_payment_id, amount, status, paid_at
      ) VALUES (
        sub.id, 
        payment_result->>'payment_id',
        sub.price,
        'completed',
        NOW()
      );

      -- Extend subscription period
      UPDATE subscriptions 
      SET 
        current_period_start = current_period_end,
        current_period_end = current_period_end + INTERVAL '1 month',
        updated_at = NOW()
      WHERE id = sub.id;

      processed_count := processed_count + 1;
    ELSE
      -- Mark subscription as past due
      UPDATE subscriptions 
      SET status = 'past_due', updated_at = NOW()
      WHERE id = sub.id;
    END IF;
  END LOOP;

  RETURN QUERY SELECT processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions 
  SET 
    cancel_at_period_end = true,
    canceled_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for subscription dashboard
CREATE OR REPLACE VIEW subscription_dashboard AS
SELECT 
  s.id as subscription_id,
  up.email,
  up.preferred_name,
  s.plan_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.square_customer_id,
  s.created_at,
  COUNT(sp.id) as payment_count,
  SUM(sp.amount) as total_paid
FROM subscriptions s
JOIN user_profiles up ON s.user_id = up.id
LEFT JOIN subscription_payments sp ON s.id = sp.subscription_id
GROUP BY s.id, up.email, up.preferred_name, s.plan_id, s.status, 
         s.current_period_start, s.current_period_end, s.square_customer_id, s.created_at
ORDER BY s.created_at DESC;
