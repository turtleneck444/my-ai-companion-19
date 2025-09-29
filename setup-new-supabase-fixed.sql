-- Complete LoveAI Database Schema Setup for New Supabase Project
-- Run this in your new Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  preferred_name TEXT,
  treatment_style TEXT DEFAULT 'romantic',
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table (AI companions/personalities) - COMPLETE VERSION
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  personality_traits TEXT[], -- This was missing!
  voice_id TEXT,
  voice_settings JSONB,
  background_story TEXT,
  relationship_type TEXT DEFAULT 'romantic',
  age_range TEXT,
  interests TEXT[],
  communication_style TEXT,
  emotional_tone TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Companions table (modern name for characters)
CREATE TABLE IF NOT EXISTS companions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  limits JSONB NOT NULL DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  messages_sent INTEGER DEFAULT 0,
  voice_calls_made INTEGER DEFAULT 0,
  characters_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Game memory table
CREATE TABLE IF NOT EXISTS game_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_data JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_public ON characters(is_public);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_game_memory_user_id ON game_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_game_memory_character_id ON game_memory(character_id);

-- Insert default plans (FIXED ARRAY SYNTAX)
INSERT INTO plans (id, name, description, price_monthly, price_yearly, limits, features) VALUES
('free', 'Free Plan', 'Perfect for getting started', 0.00, 0.00, 
 '{"messages": 50, "voice_calls": 5, "characters": 1}', 
 ARRAY['Basic AI Chat', 'Limited Voice Calls', '1 Custom Character']),
('premium', 'Premium Plan', 'Unlimited conversations and features', 19.99, 199.99,
 '{"messages": -1, "voice_calls": -1, "characters": 10}',
 ARRAY['Unlimited AI Chat', 'Unlimited Voice Calls', '10 Custom Characters', 'Priority Support']),
('pro', 'Pro Plan', 'For power users and creators', 49.99, 499.99,
 '{"messages": -1, "voice_calls": -1, "characters": -1}',
 ARRAY['Unlimited Everything', 'Unlimited Characters', 'Advanced Analytics', 'API Access', 'Priority Support'])
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for characters
CREATE POLICY "Users can view own characters" ON characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON characters FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public characters" ON characters FOR SELECT USING (is_public = true);

-- RLS Policies for companions
CREATE POLICY "Users can view own companions" ON companions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companions" ON companions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own companions" ON companions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own companions" ON companions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_memory
CREATE POLICY "Users can view own game memory" ON game_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game memory" ON game_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own game memory" ON game_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own game memory" ON game_memory FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON characters TO authenticated;
GRANT ALL ON companions TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON usage_tracking TO authenticated;
GRANT ALL ON game_memory TO authenticated;

GRANT ALL ON user_profiles TO anon;
GRANT ALL ON characters TO anon;
GRANT ALL ON companions TO anon;
GRANT ALL ON plans TO anon;
GRANT ALL ON user_subscriptions TO anon;
GRANT ALL ON usage_tracking TO anon;
GRANT ALL ON game_memory TO anon;

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companions_updated_at BEFORE UPDATE ON companions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_memory_updated_at BEFORE UPDATE ON game_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
