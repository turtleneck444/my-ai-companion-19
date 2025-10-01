-- Fix the characters table - add missing personality_traits column
-- Run this in your Supabase SQL Editor

-- Add the missing personality_traits column
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS personality_traits TEXT[];

-- Add other potentially missing columns
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_settings JSONB,
ADD COLUMN IF NOT EXISTS background_story TEXT,
ADD COLUMN IF NOT EXISTS relationship_type TEXT DEFAULT 'romantic',
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS communication_style TEXT,
ADD COLUMN IF NOT EXISTS emotional_tone TEXT;

-- Update existing records to have empty personality_traits array
UPDATE characters 
SET personality_traits = '{}' 
WHERE personality_traits IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_public ON characters(is_public);

-- Grant necessary permissions
GRANT ALL ON characters TO authenticated;
GRANT ALL ON characters TO anon;
