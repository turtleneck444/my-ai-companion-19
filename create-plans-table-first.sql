-- Create Plans Table First (Run this BEFORE the pricing update)
-- This creates the proper table structure for your pricing plans

-- Create the plans table with all necessary columns
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'month',
  features TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  popular BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read plans (for pricing page)
CREATE POLICY "Everyone can view plans" ON plans
  FOR SELECT TO authenticated, anon
  USING (true);

-- Create policy for admin to manage plans
CREATE POLICY "Admin can manage plans" ON plans
  FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM user_profiles 
    WHERE email LIKE '%@yourdomain.com%' -- Replace with your admin email domain
    OR id = '00000000-0000-0000-0000-000000000000' -- Replace with your admin user ID
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plans_price ON plans(price);
CREATE INDEX IF NOT EXISTS idx_plans_popular ON plans(popular);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Plans table created successfully!';
  RAISE NOTICE '📋 Now you can run the pricing plans update script.';
END $$; 