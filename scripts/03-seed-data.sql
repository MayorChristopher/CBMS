-- Insert sample customers
INSERT INTO customers (email, first_name, last_name, device_info, location) VALUES
('john.doe@example.com', 'John', 'Doe', '{"browser": "Chrome", "os": "Windows"}'::JSONB, 'New York, USA'),
('jane.smith@example.com', 'Jane', 'Smith', '{"browser": "Safari", "os": "macOS"}'::JSONB, 'London, UK'),
('bob.johnson@example.com', 'Bob', 'Johnson', '{"browser": "Firefox", "os": "Linux"}'::JSONB, 'Toronto, Canada'),
('alice.brown@example.com', 'Alice', 'Brown', '{"browser": "Chrome", "os": "Android"}'::JSONB, 'Sydney, Australia'),
('charlie.wilson@example.com', 'Charlie', 'Wilson', '{"browser": "Edge", "os": "Windows"}'::JSONB, 'Berlin, Germany');

-- Insert sample sessions
INSERT INTO sessions (customer_id, session_start, session_end, duration, pages_visited, device_type)
SELECT 
    c.id,
    NOW() - INTERVAL '1 hour' * (random() * 24),
    NOW() - INTERVAL '1 hour' * (random() * 23),
    INTERVAL '1 minute' * (5 + random() * 55),
    (1 + random() * 10)::INTEGER,
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'desktop'
        WHEN 1 THEN 'mobile'
        ELSE 'tablet'
    END
FROM customers c, generate_series(1, 3) s;

-- Insert sample activities
INSERT INTO activities (session_id, customer_id, event_type, page_url, element_id, metadata)
SELECT 
    s.id,
    s.customer_id,
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'page_view'
        WHEN 1 THEN 'click'
        WHEN 2 THEN 'form_submit'
        ELSE 'scroll'
    END,
    '/page-' || (1 + random() * 10)::INTEGER,
    'element-' || (1 + random() * 100)::INTEGER,
    ('{"x": ' || (random() * 1920)::INTEGER || ', "y": ' || (random() * 1080)::INTEGER || '}')::JSONB
FROM sessions s, generate_series(1, 5) a;

-- Insert sample engagement metrics
INSERT INTO engagement_metrics (customer_id, engagement_score, bounce_rate, conversion_rate)
SELECT 
    id,
    (random() * 100)::NUMERIC(5,2),
    (random() * 50)::NUMERIC(5,2),
    (random() * 20)::NUMERIC(5,2)
FROM customers;

-- Insert system settings
INSERT INTO system_settings (key, value) VALUES
('tracking_enabled', 'true'::JSONB),
('session_timeout', '1800'::JSONB),
('max_events_per_session', '1000'::JSONB),
('data_retention_days', '365'::JSONB);
