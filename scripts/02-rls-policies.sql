-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Users can view all customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for sessions table
CREATE POLICY "Users can view all sessions" ON sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sessions" ON sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for activities table
CREATE POLICY "Users can view all activities" ON activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert activities" ON activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for engagement_metrics table
CREATE POLICY "Users can view all engagement metrics" ON engagement_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage engagement metrics" ON engagement_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for reports table
CREATE POLICY "Users can view their reports" ON reports
    FOR SELECT USING (auth.uid() = created_by OR auth.role() = 'service_role');

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policies for system_settings (admin only)
CREATE POLICY "Only service role can access system settings" ON system_settings
    FOR ALL USING (auth.role() = 'service_role');
