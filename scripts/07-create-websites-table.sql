-- Create websites table for user website management
CREATE TABLE websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tracked TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_created_at ON websites(created_at);

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own websites" ON websites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites" ON websites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites" ON websites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites" ON websites
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_websites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER handle_websites_updated_at
    BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION handle_websites_updated_at(); 