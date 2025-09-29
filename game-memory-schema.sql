-- Game Memory Schema for Supabase
-- This table stores game states, progress, and achievements for users

CREATE TABLE IF NOT EXISTS game_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_memory_user_id ON game_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_game_memory_updated_at ON game_memory(updated_at);

-- Enable Row Level Security
ALTER TABLE game_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own game memory" ON game_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game memory" ON game_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game memory" ON game_memory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game memory" ON game_memory
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_game_memory_updated_at
  BEFORE UPDATE ON game_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_game_memory_updated_at();

-- Create function to get game statistics
CREATE OR REPLACE FUNCTION get_game_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalScore', COALESCE((memory_data->>'totalScore')::int, 0),
    'totalGamesPlayed', COALESCE((memory_data->>'totalGamesPlayed')::int, 0),
    'favoriteGame', COALESCE(memory_data->>'favoriteGame', ''),
    'lastActive', COALESCE(memory_data->>'lastActive', NOW()::text),
    'games', COALESCE(memory_data->'games', '{}'::json)
  )
  INTO result
  FROM game_memory
  WHERE user_id = user_uuid
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_game_stats(UUID) TO authenticated;
