-- Add verification columns to websites table
-- This script adds the missing columns that the frontend expects

-- Add verification_code column
ALTER TABLE websites 
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Add is_verified column with default value
ALTER TABLE websites 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Update existing websites to be verified (for backward compatibility)
UPDATE websites 
SET is_verified = TRUE 
WHERE is_verified IS NULL;

-- Create index for verification_code for better performance
CREATE INDEX IF NOT EXISTS idx_websites_verification_code ON websites(verification_code);

-- Create index for is_verified for better performance
CREATE INDEX IF NOT EXISTS idx_websites_is_verified ON websites(is_verified);

-- Update the status check constraint to include 'pending'
ALTER TABLE websites 
DROP CONSTRAINT IF EXISTS websites_status_check;

ALTER TABLE websites 
ADD CONSTRAINT websites_status_check 
CHECK (status IN ('active', 'inactive', 'pending'));

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
BEGIN
    RETURN substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to verify website
CREATE OR REPLACE FUNCTION verify_website(website_id UUID, verification_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    website_record RECORD;
BEGIN
    SELECT * INTO website_record 
    FROM websites 
    WHERE id = website_id AND verification_code = verify_website.verification_code;
    
    IF FOUND THEN
        UPDATE websites 
        SET is_verified = TRUE, 
            verification_code = NULL,
            status = 'active'
        WHERE id = website_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql; 