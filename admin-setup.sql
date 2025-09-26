-- LoveAI Admin Dashboard Database Setup
-- Creates admin roles, tables, and privacy-respecting analytics

-- Create admin roles table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')) DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create admin sessions table for tracking admin activity
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'character', 'plan', etc.
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform characters table (managed by admins)
CREATE TABLE IF NOT EXISTS platform_characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  personality JSONB DEFAULT '[]',
  avatar_url TEXT,
  voice_id TEXT,
  voice_name TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0
);

-- Create character moderation table for user-created characters
CREATE TABLE IF NOT EXISTS character_moderation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  review_notes TEXT,
  flagged_reasons TEXT[],
  auto_moderation_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Create platform analytics aggregation tables (privacy-safe)
CREATE TABLE IF NOT EXISTS daily_analytics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_voice_calls INTEGER DEFAULT 0,
  total_characters_created INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.0,
  plan_distribution JSONB DEFAULT '{}',
  top_characters JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system health monitoring
CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2),
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  details JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can view sessions" ON admin_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can manage platform characters" ON platform_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can moderate characters" ON character_moderation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can view analytics" ON daily_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id UUID,
  action_type TEXT,
  target_type TEXT DEFAULT NULL,
  target_id TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO admin_sessions (admin_id, action, target_type, target_id, metadata)
  VALUES (admin_id, action_type, target_type, target_id, metadata)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily analytics (privacy-safe aggregations)
CREATE OR REPLACE FUNCTION generate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_analytics (
    date,
    total_users,
    new_signups,
    active_users,
    total_messages,
    total_voice_calls,
    total_characters_created,
    revenue,
    plan_distribution
  )
  SELECT 
    target_date,
    (SELECT COUNT(*) FROM user_profiles),
    (SELECT COUNT(*) FROM user_profiles WHERE DATE(created_at) = target_date),
    (SELECT COUNT(*) FROM user_profiles WHERE DATE(last_active_at) = target_date),
    (SELECT COALESCE(SUM(usage_messages_today), 0) FROM user_profiles WHERE DATE(last_active_at) = target_date),
    (SELECT COALESCE(SUM(usage_voice_calls_today), 0) FROM user_profiles WHERE DATE(last_active_at) = target_date),
    (SELECT COUNT(*) FROM characters WHERE DATE(created_at) = target_date),
    (SELECT COALESCE(SUM(total_spent), 0) FROM user_profiles),
    (SELECT json_object_agg(subscription_plan_id, user_count)
     FROM (
       SELECT subscription_plan_id, COUNT(*) as user_count 
       FROM user_profiles 
       GROUP BY subscription_plan_id
     ) plan_counts)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    total_messages = EXCLUDED.total_messages,
    total_voice_calls = EXCLUDED.total_voice_calls,
    revenue = EXCLUDED.revenue,
    plan_distribution = EXCLUDED.plan_distribution;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_overview AS
SELECT 
  -- User metrics
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE DATE(created_at) = CURRENT_DATE) as signups_today,
  (SELECT COUNT(*) FROM user_profiles WHERE DATE(last_active_at) = CURRENT_DATE) as active_today,
  (SELECT COUNT(*) FROM user_profiles WHERE subscription_status = 'active') as paid_users,
  
  -- Revenue metrics
  (SELECT COALESCE(SUM(total_spent), 0) FROM user_profiles) as total_revenue,
  (SELECT COALESCE(SUM(total_spent), 0) FROM user_profiles WHERE DATE(updated_at) = CURRENT_DATE) as revenue_today,
  (SELECT AVG(total_spent) FROM user_profiles WHERE total_spent > 0) as avg_revenue_per_user,
  
  -- Content metrics
  (SELECT COUNT(*) FROM characters) as total_characters,
  (SELECT COUNT(*) FROM characters WHERE DATE(created_at) = CURRENT_DATE) as characters_today,
  (SELECT COUNT(*) FROM platform_characters WHERE is_active = true) as platform_characters,
  (SELECT COUNT(*) FROM character_moderation WHERE status = 'pending') as pending_reviews,
  
  -- Usage metrics (privacy-safe aggregations)
  (SELECT COALESCE(SUM(usage_messages_today), 0) FROM user_profiles) as messages_today,
  (SELECT COALESCE(SUM(usage_voice_calls_today), 0) FROM user_profiles) as voice_calls_today,
  
  -- Plan distribution
  (SELECT json_object_agg(subscription_plan_id, user_count)
   FROM (
     SELECT subscription_plan_id, COUNT(*) as user_count 
     FROM user_profiles 
     GROUP BY subscription_plan_id
   ) plan_dist) as plan_distribution;

-- Insert your admin user (replace with your email)
INSERT INTO admin_users (id, email, role, permissions)
SELECT 
  id, 
  email, 
  'super_admin',
  '{"manage_users": true, "manage_characters": true, "view_analytics": true, "manage_admins": true}'::jsonb
FROM auth.users 
WHERE email = 'hunainqureshicardinal@gmail.com' -- Replace with your email
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  permissions = EXCLUDED.permissions,
  is_active = true;

-- Create some sample platform characters
INSERT INTO platform_characters (name, description, personality, category, is_featured, created_by) 
SELECT 
  'Aria',
  'A creative and artistic companion who loves poetry, music, and deep conversations about life and beauty.',
  '["Creative", "Thoughtful", "Romantic", "Artistic"]'::jsonb,
  'creative',
  true,
  (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM platform_characters WHERE name = 'Aria');

INSERT INTO platform_characters (name, description, personality, category, is_featured, created_by)
SELECT 
  'Luna',
  'A playful and adventurous companion who brings joy and excitement to every conversation.',
  '["Playful", "Bold", "Sweet", "Adventurous"]'::jsonb,
  'lifestyle',
  true,
  (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM platform_characters WHERE name = 'Luna');

-- Generate today's analytics
SELECT generate_daily_analytics();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ LoveAI Admin Dashboard database setup complete!';
  RAISE NOTICE '👤 Admin user created for: hunainqureshicardinal@gmail.com';
  RAISE NOTICE '🔒 Row Level Security enabled for all admin tables';
  RAISE NOTICE '📊 Analytics aggregation functions ready';
  RAISE NOTICE '🎯 Ready to build the admin dashboard interface!';
END $$; 