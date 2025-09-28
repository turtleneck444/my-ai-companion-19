-- Enhanced Monthly Billing System for LoveAI
-- This ensures users are billed monthly from their upgrade date

-- Function to process monthly billing for all active subscriptions
CREATE OR REPLACE FUNCTION process_monthly_billing()
RETURNS TABLE(
  processed_count INTEGER,
  failed_count INTEGER,
  results JSONB[]
) AS $$
DECLARE
  sub_record RECORD;
  payment_result JSONB;
  processed_count INTEGER := 0;
  failed_count INTEGER := 0;
  results JSONB[] := ARRAY[]::JSONB[];
  plan_amount DECIMAL(10,2);
BEGIN
  -- Find all active subscriptions that need billing
  FOR sub_record IN 
    SELECT 
      s.id as subscription_id,
      s.user_id,
      s.plan_id,
      s.stripe_customer_id,
      s.stripe_card_id,
      s.current_period_end,
      up.email,
      p.price
    FROM subscriptions s
    JOIN user_profiles up ON s.user_id = up.id
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
      AND s.current_period_end <= NOW()
      AND s.plan_id != 'free'
  LOOP
    BEGIN
      -- Get plan amount (fallback to hardcoded prices if plans table doesn't exist)
      plan_amount := COALESCE(sub_record.price, 
        CASE sub_record.plan_id
          WHEN 'premium' THEN 19.00
          WHEN 'pro' THEN 49.00
          ELSE 0.00
        END
      );

      -- Process payment via external API (this would call your payment processor)
      -- For now, we'll simulate success and create a payment record
      
      -- Create payment record
      INSERT INTO subscription_payments (
        subscription_id,
        stripe_payment_id,
        amount,
        currency,
        status,
        paid_at
      ) VALUES (
        sub_record.subscription_id,
        'monthly_' || sub_record.subscription_id || '_' || EXTRACT(EPOCH FROM NOW()),
        plan_amount,
        'USD',
        'completed', -- In real implementation, this would depend on payment result
        NOW()
      );

      -- Update subscription period
      UPDATE subscriptions 
      SET 
        current_period_start = current_period_end,
        current_period_end = current_period_end + INTERVAL '1 month',
        updated_at = NOW()
      WHERE id = sub_record.subscription_id;

      -- Update user profile billing date
      UPDATE user_profiles
      SET 
        next_billing_date = (
          SELECT current_period_end 
          FROM subscriptions 
          WHERE id = sub_record.subscription_id
        ),
        updated_at = NOW()
      WHERE id = sub_record.user_id;

      processed_count := processed_count + 1;
      
      results := results || jsonb_build_object(
        'subscription_id', sub_record.subscription_id,
        'user_email', sub_record.email,
        'plan_id', sub_record.plan_id,
        'amount', plan_amount,
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      
      -- Update subscription status to past_due
      UPDATE subscriptions 
      SET 
        status = 'past_due',
        updated_at = NOW()
      WHERE id = sub_record.subscription_id;

      results := results || jsonb_build_object(
        'subscription_id', sub_record.subscription_id,
        'user_email', sub_record.email,
        'plan_id', sub_record.plan_id,
        'amount', plan_amount,
        'status', 'failed',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY SELECT processed_count, failed_count, results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle subscription upgrades with proper billing dates
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  p_user_id UUID,
  p_new_plan_id TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_card_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  current_subscription RECORD;
  new_subscription_id UUID;
  billing_start_date TIMESTAMPTZ;
  next_billing_date TIMESTAMPTZ;
BEGIN
  -- Set billing dates
  billing_start_date := NOW();
  next_billing_date := billing_start_date + INTERVAL '1 month';

  -- Check if user has existing subscription
  SELECT * INTO current_subscription 
  FROM subscriptions 
  WHERE user_id = p_user_id AND status = 'active';

  IF FOUND THEN
    -- Cancel existing subscription
    UPDATE subscriptions 
    SET 
      status = 'canceled',
      canceled_at = NOW(),
      updated_at = NOW()
    WHERE id = current_subscription.id;
  END IF;

  -- Create new subscription if not free plan
  IF p_new_plan_id != 'free' THEN
    INSERT INTO subscriptions (
      user_id,
      plan_id,
      status,
      stripe_customer_id,
      stripe_card_id,
      current_period_start,
      current_period_end
    ) VALUES (
      p_user_id,
      p_new_plan_id,
      'active',
      p_stripe_customer_id,
      p_stripe_card_id,
      billing_start_date,
      next_billing_date
    ) RETURNING id INTO new_subscription_id;
  END IF;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    subscription_plan_id = p_new_plan_id,
    subscription_status = 'active',
    subscription_plan = p_new_plan_id,
    customer_id = p_stripe_customer_id,
    subscription_id = new_subscription_id,
    billing_cycle_start = billing_start_date,
    next_billing_date = CASE WHEN p_new_plan_id = 'free' THEN NULL ELSE next_billing_date END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', new_subscription_id,
    'next_billing_date', next_billing_date,
    'plan_id', p_new_plan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a job/trigger to run monthly billing (you'd set this up as a cron job)
-- This is just the function - you'd call it via cron or scheduled job
CREATE OR REPLACE FUNCTION schedule_monthly_billing()
RETURNS VOID AS $$
BEGIN
  -- This function would be called by a scheduler
  PERFORM process_monthly_billing();
END;
$$ LANGUAGE plpgsql; 