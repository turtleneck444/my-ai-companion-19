-- Fix Plans Table - Add Missing Columns
-- Run this first to fix the "limits column does not exist" error

-- Add the missing columns to the existing plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

-- Check what columns we have now
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '📋 Current plans table columns:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'plans' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
    
    RAISE NOTICE '✅ Plans table is now ready for the pricing update!';
END $$; 