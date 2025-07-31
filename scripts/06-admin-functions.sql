-- Function to promote user to admin (can only be called by existing admin or via service role)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin (or if called via service role)
    IF auth.role() = 'service_role' THEN
        -- Service role can promote anyone
        NULL;
    ELSE
        SELECT role INTO current_user_role 
        FROM profiles 
        WHERE id = auth.uid();
        
        IF current_user_role != 'admin' THEN
            RAISE EXCEPTION 'Only admins can promote users';
        END IF;
    END IF;
    
    -- Find the target user
    SELECT p.id INTO target_user_id
    FROM profiles p
    WHERE p.email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update the user's role
    UPDATE profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_user_role(user_id) = 'admin';
END;
$$;
