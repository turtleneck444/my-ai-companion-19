-- Fix conversation RLS policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view their own conversations') THEN
        DROP POLICY "Users can view their own conversations" ON conversations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can insert their own conversations') THEN
        DROP POLICY "Users can insert their own conversations" ON conversations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can update their own conversations') THEN
        DROP POLICY "Users can update their own conversations" ON conversations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can delete their own conversations') THEN
        DROP POLICY "Users can delete their own conversations" ON conversations;
    END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Fix messages RLS policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view their own messages') THEN
        DROP POLICY "Users can view their own messages" ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert their own messages') THEN
        DROP POLICY "Users can insert their own messages" ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update their own messages') THEN
        DROP POLICY "Users can update their own messages" ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can delete their own messages') THEN
        DROP POLICY "Users can delete their own messages" ON messages;
    END IF;
END $$;

-- Create new messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions (without specific sequence names)
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Grant sequence permissions if they exist
DO $$ 
BEGIN
    -- Check if conversations sequence exists and grant permissions
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename LIKE '%conversations%id%') THEN
        EXECUTE 'GRANT USAGE ON SEQUENCE ' || (SELECT sequencename FROM pg_sequences WHERE sequencename LIKE '%conversations%id%' LIMIT 1) || ' TO authenticated';
    END IF;
    
    -- Check if messages sequence exists and grant permissions
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename LIKE '%messages%id%') THEN
        EXECUTE 'GRANT USAGE ON SEQUENCE ' || (SELECT sequencename FROM pg_sequences WHERE sequencename LIKE '%messages%id%' LIMIT 1) || ' TO authenticated';
    END IF;
END $$;
