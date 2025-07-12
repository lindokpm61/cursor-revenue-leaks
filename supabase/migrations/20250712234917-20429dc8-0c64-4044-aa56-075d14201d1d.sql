-- Update your user role to admin (replace with your actual email)
UPDATE user_profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Alternative: If you want to set the first user as admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);