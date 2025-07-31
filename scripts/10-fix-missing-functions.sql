-- Fix missing functions for API keys table

-- Create the handle_api_keys_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the handle_updated_at function if it doesn't exist (for profiles table)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger for api_keys table
DROP TRIGGER IF EXISTS handle_api_keys_updated_at ON api_keys;
CREATE TRIGGER handle_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION handle_api_keys_updated_at();

-- Drop and recreate the trigger for profiles table
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create the process_tracking_event function if it doesn't exist
CREATE OR REPLACE FUNCTION process_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract user_id from api_key (assuming api_key is the profile id for now)
    -- In a real implementation, you'd look up the user_id from the api_key
    NEW.user_id = NULL; -- Will be set by the application logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the update_website_last_tracked function if it doesn't exist
CREATE OR REPLACE FUNCTION update_website_last_tracked()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the last_tracked timestamp for the website
    UPDATE websites 
    SET last_tracked = NOW()
    WHERE id = NEW.website_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers for tracking_events table
DROP TRIGGER IF EXISTS process_tracking_event_trigger ON tracking_events;
CREATE TRIGGER process_tracking_event_trigger 
    BEFORE INSERT ON tracking_events 
    FOR EACH ROW EXECUTE FUNCTION process_tracking_event();

DROP TRIGGER IF EXISTS update_website_last_tracked_trigger ON tracking_events;
CREATE TRIGGER update_website_last_tracked_trigger
    AFTER INSERT ON tracking_events 
    FOR EACH ROW EXECUTE FUNCTION update_website_last_tracked(); 