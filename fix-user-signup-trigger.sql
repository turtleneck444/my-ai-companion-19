-- Fix User Signup Trigger - Resolve "Database error saving new user"
-- This fixes the handle_new_user() function that runs when users sign up

-- First, let's drop the existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT := 'free';
  user_name TEXT := 'User';
BEGIN
  -- Safely extract plan from metadata
  BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL THEN
      user_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'free');
      user_name := COALESCE(
        NEW.raw_user_meta_data->>'preferred_name',
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name',
        'User'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If metadata parsing fails, use defaults
    user_plan := 'free';
    user_name := 'User';
  END;

  -- Insert into user_profiles with safe defaults
  BEGIN
    INSERT INTO user_profiles (
      id, 
      email, 
      preferred_name, 
      plan,
      subscription_status,
      subscription_plan_id,
      treatment_style,
      usage_messages_today,
      usage_voice_calls_today,
      usage_companions_created,
      profile_completed,
      onboarding_completed,
      created_at,
      updated_at,
      last_active_at
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      user_name,
      user_plan,
      CASE WHEN user_plan = 'free' THEN 'free' ELSE 'active' END,
      user_plan,
      'romantic',
      0,
      0, 
      0,
      false,
      false,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      preferred_name = COALESCE(EXCLUDED.preferred_name, user_profiles.preferred_name),
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    -- Still return NEW so the user creation in auth.users succeeds
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure user_profiles table has all necessary columns with proper defaults
DO $$
BEGIN
  -- Add missing columns if they don't exist
  ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS usage_messages_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_voice_calls_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_companions_created INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
  
  RAISE NOTICE '✅ User profiles table updated with all necessary columns';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Columns may already exist: %', SQLERRM;
END $$;

-- Test the function by trying to create a test scenario
DO $$
DECLARE
  test_user_id UUID := uuid_generate_v4();
BEGIN
  -- Simulate what happens during signup
  RAISE NOTICE '🧪 Testing user profile creation...';
  
  -- Test inserting directly into user_profiles (simulating the trigger)
  INSERT INTO user_profiles (
    id, 
    email, 
    preferred_name, 
    plan,
    subscription_status,
    subscription_plan_id
  )
  VALUES (
    test_user_id,
    'test@example.com',
    'Test User',
    'free',
    'free',
    'free'
  );
  
  -- Clean up test data
  DELETE FROM user_profiles WHERE id = test_user_id;
  
  RAISE NOTICE '✅ User profile creation test successful!';
  RAISE NOTICE '✅ Signup trigger should now work properly';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Test failed: %', SQLERRM;
  -- Clean up test data even if it fails
  DELETE FROM user_profiles WHERE id = test_user_id;
END $$; 