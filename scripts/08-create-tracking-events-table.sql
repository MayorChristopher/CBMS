-- Create tracking_events table for storing user behavior data
CREATE TABLE tracking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    api_key TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tracking_events_user_id ON tracking_events(user_id);
CREATE INDEX idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX idx_tracking_events_api_key ON tracking_events(api_key);
CREATE INDEX idx_tracking_events_website_id ON tracking_events(website_id);

-- Enable RLS
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tracking events" ON tracking_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert tracking events" ON tracking_events
    FOR INSERT WITH CHECK (true); -- Allow API to insert events

CREATE POLICY "Users can update their own tracking events" ON tracking_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracking events" ON tracking_events
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update user_id and website_id based on api_key
CREATE OR REPLACE FUNCTION process_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Set user_id based on api_key (which is the profile id)
    NEW.user_id = NEW.api_key::UUID;
    
    -- Try to find matching website based on page_url
    SELECT id INTO NEW.website_id 
    FROM websites 
    WHERE user_id = NEW.user_id 
    AND NEW.page_url LIKE '%' || REPLACE(REPLACE(url, 'https://', ''), 'http://', '') || '%'
    LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically process tracking events
CREATE TRIGGER process_tracking_event_trigger
    BEFORE INSERT ON tracking_events
    FOR EACH ROW EXECUTE FUNCTION process_tracking_event();

-- Function to update website last_tracked timestamp
CREATE OR REPLACE FUNCTION update_website_last_tracked()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the website's last_tracked timestamp
    UPDATE websites 
    SET last_tracked = NOW()
    WHERE id = NEW.website_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update website last_tracked
CREATE TRIGGER update_website_last_tracked_trigger
    AFTER INSERT ON tracking_events
    FOR EACH ROW EXECUTE FUNCTION update_website_last_tracked(); 