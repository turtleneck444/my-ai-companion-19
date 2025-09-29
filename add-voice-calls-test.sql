-- Add 20 voice calls to ogsbyoung@gmail.com for testing
-- This script will find the user and add voice calls to their account

DO $$
DECLARE
    user_id UUID;
    current_voice_calls INTEGER;
    new_voice_calls INTEGER;
BEGIN
    -- Find the user by email
    SELECT id INTO user_id 
    FROM user_profiles 
    WHERE email = 'ogsbyoung@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ User ogsbyoung@gmail.com not found';
        RETURN;
    END IF;
    
    -- Get current voice call usage
    SELECT COALESCE(usage_voice_calls_today, 0) INTO current_voice_calls
    FROM user_profiles 
    WHERE id = user_id;
    
    -- Calculate new voice calls (add 20)
    new_voice_calls := current_voice_calls + 20;
    
    -- Update the user's voice call count
    UPDATE user_profiles 
    SET 
        usage_voice_calls_today = new_voice_calls,
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Verify the update
    SELECT usage_voice_calls_today INTO current_voice_calls
    FROM user_profiles 
    WHERE id = user_id;
    
    RAISE NOTICE '✅ Successfully added 20 voice calls to ogsbyoung@gmail.com';
    RAISE NOTICE '📊 User now has % voice calls available', current_voice_calls;
    
    -- Show current plan limits
    PERFORM check_user_plan_limits(user_id);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding voice calls: %', SQLERRM;
END $$;

-- Show the updated user information
SELECT 
    email,
    preferred_name,
    subscription_plan_id,
    usage_voice_calls_today,
    usage_messages_today,
    last_active_at
FROM user_profiles 
WHERE email = 'ogsbyoung@gmail.com';
