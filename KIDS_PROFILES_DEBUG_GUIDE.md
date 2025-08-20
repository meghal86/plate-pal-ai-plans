# Kids Profiles Debug Guide

## Current Issue
The kids zone is not showing existing children profiles. This guide will help you debug and fix the issue step by step.

## Step 1: Run the Database Fix Script

First, execute the `direct_fix_kids_profiles.sql` script in your Supabase SQL editor:

1. **Open Supabase Dashboard** → SQL Editor
2. **Replace `'your-email@example.com'`** with your actual email address in the script
3. **Run the script** and check the output messages
4. **Note down** any issues or the results

## Step 2: Use the Debug Tools

I've added debug functionality to help identify the issue:

### Frontend Debug
1. **Navigate to the Kids page** (`/kids`)
2. **Click the "🔧 Debug Kids Profiles" button** (appears when no kids are found)
3. **Open browser console** (F12 → Console tab)
4. **Review the detailed debug output**

### Console Debug (Alternative)
You can also run debug commands directly in the browser console:

```javascript
// Test kids profiles loading
await window.debugKidsProfiles();

// Test database access
await window.testDatabaseAccess();
```

## Step 3: Common Issues and Solutions

### Issue 1: User Profile Not Found
**Symptoms**: Debug shows "User profile not found"
**Solution**: 
```sql
-- Run this in Supabase SQL Editor (replace with your user ID)
INSERT INTO public.user_profiles (user_id, full_name, email)
VALUES ('YOUR_USER_ID', 'Your Name', 'your-email@example.com');
```

### Issue 2: No Family ID
**Symptoms**: Debug shows "User has no family_id"
**Solution**: The debug service will automatically create a family, or run:
```sql
-- Create family and link to user
INSERT INTO public.families (name, created_by) 
VALUES ('My Family', 'YOUR_USER_ID');

UPDATE public.user_profiles 
SET family_id = (SELECT id FROM public.families WHERE created_by = 'YOUR_USER_ID' LIMIT 1)
WHERE user_id = 'YOUR_USER_ID';
```

### Issue 3: RLS Policy Issues
**Symptoms**: Debug shows permission errors
**Solution**: 
```sql
-- Temporarily disable RLS to test
ALTER TABLE public.kids_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test if kids show up, then re-enable:
ALTER TABLE public.kids_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

### Issue 4: Missing Kids Data
**Symptoms**: Everything looks good but no kids found
**Solution**: Check if kids exist in database:
```sql
-- Check for any kids profiles
SELECT * FROM public.kids_profiles;

-- Check for kids linked to your user
SELECT kp.*, f.name as family_name 
FROM public.kids_profiles kp
LEFT JOIN public.families f ON kp.family_id = f.id
WHERE kp.parent_user_id = 'YOUR_USER_ID' OR f.created_by = 'YOUR_USER_ID';
```

## Step 4: Manual Data Verification

### Check Your User Data
```sql
-- Replace with your email
SELECT 
    au.id as user_id,
    au.email,
    up.family_id,
    f.name as family_name,
    COUNT(kp.id) as kids_count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.families f ON up.family_id = f.id
LEFT JOIN public.kids_profiles kp ON f.id = kp.family_id
WHERE au.email = 'your-email@example.com'
GROUP BY au.id, au.email, up.family_id, f.name;
```

### Check Table Structure
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'families', 'kids_profiles');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'families', 'kids_profiles');
```

## Step 5: Test Data Creation

If no kids exist, create test data:

```sql
-- First ensure you have a family (replace YOUR_USER_ID)
INSERT INTO public.families (name, created_by) 
VALUES ('Test Family', 'YOUR_USER_ID')
ON CONFLICT DO NOTHING;

-- Update user profile with family_id
UPDATE public.user_profiles 
SET family_id = (SELECT id FROM public.families WHERE created_by = 'YOUR_USER_ID' LIMIT 1)
WHERE user_id = 'YOUR_USER_ID';

-- Create a test kid
INSERT INTO public.kids_profiles (
    family_id, 
    parent_user_id, 
    name, 
    birth_date, 
    gender
) VALUES (
    (SELECT family_id FROM public.user_profiles WHERE user_id = 'YOUR_USER_ID'),
    'YOUR_USER_ID',
    'Test Child',
    '2015-06-15',
    'other'
);
```

## Step 6: Frontend Verification

After running the database fixes:

1. **Refresh the Kids page**
2. **Check browser console** for any errors
3. **Verify kids profiles appear**
4. **Test selecting different kids**

## Debug Output Interpretation

### Successful Debug Output
```
✅ DEBUG: User authenticated: { id: "...", email: "..." }
✅ DEBUG: User profile found: { family_id: "...", ... }
✅ DEBUG: Family found: { name: "...", ... }
✅ DEBUG: Kids profiles query successful: { count: 2, kids: [...] }
```

### Failed Debug Output Examples
```
❌ DEBUG: User profile not found - need to create user profile
❌ DEBUG: User has no family_id - need to create family
❌ DEBUG: Kids profiles error: permission denied - RLS issue
```

## Rollback Plan

If you need to rollback changes:

```sql
-- Remove test data
DELETE FROM public.kids_profiles WHERE name = 'Test Child';
DELETE FROM public.families WHERE name = 'Test Family';

-- Reset user profile
UPDATE public.user_profiles SET family_id = NULL WHERE user_id = 'YOUR_USER_ID';
```

## Next Steps

1. **Run the debug tools** and share the console output
2. **Execute the database fix script** with your email
3. **Check the results** and let me know what you find
4. **If issues persist**, we can create a more targeted fix

The debug tools will give us the exact information we need to identify and fix the specific issue with your kids profiles.