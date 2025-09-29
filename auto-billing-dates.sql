-- Automatic Billing Dates System
-- This ensures billing dates are set automatically based on signup date

-- Create or update function to automatically set billing dates
CREATE OR REPLACE FUNCTION set_automatic_billing_dates(
  p_user_id UUID,
  p_plan_id TEXT,
  p_signup_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSONB AS $$
DECLARE
  next_billing TIMESTAMPTZ;
  billing_start TIMESTAMPTZ;
  result JSONB;
BEGIN
  billing_start := p_signup_date;
  
  -- Calculate next billing date based on plan
  CASE p_plan_id
    WHEN 'free' THEN
      next_billing := NULL; -- Free plans don't have billing
    WHEN 'premium', 'pro' THEN
      next_billing := billing_start + INTERVAL '1 month'; -- Monthly billing
    ELSE
      next_billing := billing_start + INTERVAL '1 month'; -- Default to monthly
  END CASE;
  
  -- Update user profile with automatic billing dates
  UPDATE user_profiles 
  SET 
    billing_cycle_start = billing_start,
    next_billing_date = next_billing,
    last_payment_date = CASE WHEN p_plan_id != 'free' THEN billing_start ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Return result
  result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'plan_id', p_plan_id,
    'billing_cycle_start', billing_start,
    'next_billing_date', next_billing,
    'last_payment_date', CASE WHEN p_plan_id != 'free' THEN billing_start ELSE NULL END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process automatic monthly renewals
CREATE OR REPLACE FUNCTION process_automatic_renewals()
RETURNS TABLE(
  processed_count INTEGER,
  failed_count INTEGER,
  renewal_results JSONB[]
) AS $$
DECLARE
  user_record RECORD;
  renewal_result JSONB;
  processed_count INTEGER := 0;
  failed_count INTEGER := 0;
  renewal_results JSONB[] := ARRAY[]::JSONB[];
  new_billing_date TIMESTAMPTZ;
BEGIN
  -- Find users whose billing date has passed
  FOR user_record IN 
    SELECT 
      up.id,
      up.email,
      up.subscription_plan_id,
      up.next_billing_date,
      up.billing_cycle_start,
      up.subscription_customer_id,
      p.price
    FROM user_profiles up
    LEFT JOIN plans p ON up.subscription_plan_id = p.id
    WHERE up.subscription_status = 'active'
      AND up.subscription_plan_id != 'free'
      AND up.next_billing_date <= NOW()
      AND up.next_billing_date IS NOT NULL
  LOOP
    BEGIN
      -- Calculate new billing date (1 month from current next_billing_date)
      new_billing_date := user_record.next_billing_date + INTERVAL '1 month';
      
      -- Update billing dates
      UPDATE user_profiles 
      SET 
        billing_cycle_start = user_record.next_billing_date,
        next_billing_date = new_billing_date,
        last_payment_date = user_record.next_billing_date,
        updated_at = NOW()
      WHERE id = user_record.id;
      
      processed_count := processed_count + 1;
      
      renewal_result := jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'plan_id', user_record.subscription_plan_id,
        'old_billing_date', user_record.next_billing_date,
        'new_billing_date', new_billing_date,
        'amount', user_record.price,
        'status', 'renewed'
      );
      
      renewal_results := renewal_results || renewal_result;
      
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      
      renewal_result := jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'error', SQLERRM,
        'status', 'failed'
      );
      
      renewal_results := renewal_results || renewal_result;
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed_count, failed_count, renewal_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upgrade user with automatic billing dates
CREATE OR REPLACE FUNCTION upgrade_user_with_auto_billing(
  p_user_id UUID,
  p_plan_id TEXT,
  p_customer_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Set automatic billing dates for the upgrade
  SELECT set_automatic_billing_dates(p_user_id, p_plan_id) INTO result;
  
  -- Update additional subscription fields if provided
  IF p_customer_id IS NOT NULL THEN
    UPDATE user_profiles 
    SET 
      subscription_customer_id = p_customer_id,
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage to set automatic billing dates for existing users
-- UPDATE user_profiles SET next_billing_date = NULL WHERE subscription_plan_id = 'free';
-- SELECT set_automatic_billing_dates(id, subscription_plan_id) FROM user_profiles WHERE subscription_plan_id != 'free';
