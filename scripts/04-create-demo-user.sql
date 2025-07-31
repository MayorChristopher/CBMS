-- Create demo admin user
-- Note: This requires the user to be created through Supabase Auth first
-- You can either:
-- 1. Sign up manually at your Supabase Auth URL with admin@cbms.com / password123
-- 2. Or use the Supabase dashboard to create the user
-- 3. Or use this SQL after the user exists in auth.users

-- Insert demo user profile (run this after creating the auth user)
-- This will be handled by the application when the user first logs in

-- For now, let's create some additional sample data
INSERT INTO customers (email, first_name, last_name, device_info, location) VALUES
('demo.user1@example.com', 'Demo', 'User1', '{"browser": "Chrome", "os": "Windows", "screen": "1920x1080"}'::JSONB, 'San Francisco, USA'),
('demo.user2@example.com', 'Demo', 'User2', '{"browser": "Safari", "os": "macOS", "screen": "1440x900"}'::JSONB, 'Los Angeles, USA'),
('demo.user3@example.com', 'Demo', 'User3', '{"browser": "Firefox", "os": "Linux", "screen": "1366x768"}'::JSONB, 'Chicago, USA');

-- Add more recent activities for better demo experience
INSERT INTO activities (session_id, customer_id, event_type, page_url, element_id, metadata, timestamp)
SELECT 
    s.id,
    s.customer_id,
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'page_view'
        WHEN 1 THEN 'click'
        WHEN 2 THEN 'form_submit'
        ELSE 'scroll'
    END,
    CASE (random() * 8)::INTEGER
        WHEN 0 THEN '/dashboard'
        WHEN 1 THEN '/products'
        WHEN 2 THEN '/about'
        WHEN 3 THEN '/contact'
        WHEN 4 THEN '/pricing'
        WHEN 5 THEN '/features'
        WHEN 6 THEN '/login'
        ELSE '/signup'
    END,
    'btn-' || (1 + random() * 50)::INTEGER,
    ('{"x": ' || (random() * 1920)::INTEGER || ', "y": ' || (random() * 1080)::INTEGER || ', "timestamp": "' || NOW() || '"}')::JSONB,
    NOW() - INTERVAL '1 minute' * (random() * 1440) -- Activities within last 24 hours
FROM sessions s, generate_series(1, 10) a;
