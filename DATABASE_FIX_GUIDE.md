# Complete Database Fix Guide - 406 Not Acceptable Errors

## 🚨 Current Issues

You're experiencing 406 Not Acceptable errors for both:
1. `user_profiles` table - User ID: `359ad3fd-70a1-481d-8360-bcc2dc61a55c`
2. `kids_meal_plans` table - Kid ID: `71a44ca2-372d-4f99-8178-67b30d5b0897`

## 🔧 Complete Solution

### Step 1: Execute the Complete Database Fix

**Copy and paste the entire `COMPLETE_DATABASE_FIX.sql` script into your Supabase SQL Editor and run it.**

This single script will:
- ✅ Fix both `user_profiles` and `kids_meal_plans` tables
- ✅ Create proper RLS policies for both tables
- ✅ Set up secure functions for safe operations
- ✅ Create profiles for existing users
- ✅ Grant all necessary permissions
- ✅ Test the setup automatically

### Step 2: Verify the Fix

After running the fix script, execute `verify_database_fix.sql` to confirm everything is working.

### Step 3: Test Your Application

Try the operations that were failing:
- Generate a kids meal plan
- Access user profiles
- Both should now work without 406 errors

## 📋 What the Fix Does

### For `user_profiles` Table:
```sql
-- Creates table with proper structure
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- ... all necessary columns
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Enables RLS with proper policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);
-- ... other policies for INSERT, UPDATE, DELETE
```

### For `kids_meal_plans` Table:
```sql
-- Creates table with proper structure
CREATE TABLE public.kids_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL,
    title TEXT NOT NULL,
    -- ... all necessary columns
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enables RLS with proper policies
CREATE POLICY "Users can view their created meal plans" ON public.kids_meal_plans
    FOR SELECT USING (auth.uid() = created_by);
-- ... other policies
```

### Secure Functions:
```sql
-- Safe meal plan insertion
CREATE FUNCTION public.insert_kids_meal_plan(...)
RETURNS UUID SECURITY DEFINER;

-- Safe meal plan retrieval
CREATE FUNCTION public.get_kids_meal_plans(...)
RETURNS TABLE(...) SECURITY DEFINER;
```

## 🔍 Troubleshooting

### If You Still Get 406 Errors After Running the Fix:

#### 1. Check Script Execution
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'kids_meal_plans');

-- Should return both table names
```

#### 2. Check RLS Status
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('user_profiles', 'kids_meal_plans');

-- Both should show 't' for rowsecurity
```

#### 3. Check Policies
```sql
-- Verify policies exist
SELECT tablename, COUNT(*) FROM pg_policies 
WHERE tablename IN ('user_profiles', 'kids_meal_plans')
GROUP BY tablename;

-- Should show 4 policies for each table
```

#### 4. Check User Authentication
```sql
-- Verify your user exists and is authenticated
SELECT id, email FROM auth.users 
WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- Should return your user data
```

### Common Issues and Solutions:

#### Issue: "Function does not exist"
**Solution**: Re-run the complete fix script - functions weren't created properly.

#### Issue: "Permission denied"
**Solution**: Check that permissions were granted:
```sql
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.kids_meal_plans TO authenticated;
```

#### Issue: "RLS policy violation"
**Solution**: Ensure the `created_by` field matches the authenticated user:
```sql
-- For debugging, temporarily disable RLS
ALTER TABLE public.kids_meal_plans DISABLE ROW LEVEL SECURITY;
-- Test your operation
-- Then re-enable RLS
ALTER TABLE public.kids_meal_plans ENABLE ROW LEVEL SECURITY;
```

## 🧪 Testing Commands

### Test User Profile Access:
```sql
-- This should work after the fix
SELECT * FROM public.user_profiles 
WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';
```

### Test Kids Meal Plans Access:
```sql
-- This should work after the fix
SELECT * FROM public.kids_meal_plans 
WHERE kid_id = '71a44ca2-372d-4f99-8178-67b30d5b0897';
```

### Test Secure Functions:
```sql
-- Test meal plan function
SELECT * FROM public.get_kids_meal_plans('71a44ca2-372d-4f99-8178-67b30d5b0897');
```

## 🚀 Expected Results

After running the fix:

1. **No more 406 errors** when accessing user profiles or kids meal plans
2. **Automatic profile creation** for new users via OAuth or email signup
3. **Secure data access** - users can only see their own data
4. **Proper meal plan generation** without RLS violations
5. **All CRUD operations working** for both tables

## 📞 If Issues Persist

If you continue to experience problems after running the complete fix:

1. **Check the Supabase logs** in your dashboard for detailed error messages
2. **Verify your JWT token** is valid and not expired
3. **Ensure you're authenticated** when making requests
4. **Check browser console** for additional error details
5. **Run the verification script** to identify specific issues

## 🎯 Success Indicators

You'll know the fix worked when:
- ✅ Kids meal plan generation completes successfully
- ✅ User profiles load without errors
- ✅ No 406 Not Acceptable errors in browser console
- ✅ All database operations work smoothly
- ✅ RLS properly restricts access to user's own data

The `COMPLETE_DATABASE_FIX.sql` script is designed to be comprehensive and handle all edge cases. It should resolve both the user profiles and kids meal plans issues in one go.