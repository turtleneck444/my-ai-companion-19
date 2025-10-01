-- Chat Memories Table
CREATE TABLE IF NOT EXISTS chat_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  total_messages INTEGER DEFAULT 0,
  user_preferences JSONB DEFAULT '{}'::jsonb,
  character_insights JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_memories_character_user ON chat_memories(character_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_last_updated ON chat_memories(last_updated);

-- RLS Policies
ALTER TABLE chat_memories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own chat memories
CREATE POLICY "Users can access their own chat memories" ON chat_memories
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat memories
CREATE POLICY "Users can insert their own chat memories" ON chat_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat memories
CREATE POLICY "Users can update their own chat memories" ON chat_memories
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own chat memories
CREATE POLICY "Users can delete their own chat memories" ON chat_memories
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_memories_updated_at
  BEFORE UPDATE ON chat_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_memories_updated_at();
