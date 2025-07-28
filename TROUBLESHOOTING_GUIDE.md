# Family Invitation System - Troubleshooting Guide

## 🚨 Current Issue: 500 Internal Server Error

You're getting a 500 error when accessing the families table:
```
https://fqayygyorwvgekebprco.supabase.co/rest/v1/families?select=*&id=eq.8f5fae79-8fd9-4f03-b112-e5ed110b7f0c
```

## 🔍 Diagnosis Steps

### Step 1: Test Authentication
1. Navigate to `http://localhost:8080/family`
2. You should see a "Quick Authentication" card at the top
3. Use the default credentials or create a new account:
   - Email: `test@example.com`
   - Password: `testpassword123`
4. Click "Sign Up" first (if new user) then "Sign In"

### Step 2: Check Debug Information
1. After signing in, look at the "Family System Debug Information" card
2. Check the following status indicators:
   - **Session**: Should show ✅ with your email
   - **User Context**: Should show ✅ with your email
   - **Profile**: Should show ✅ with your name
   - **Database Tests**: Check which tables are accessible

### Step 3: Common Issues & Solutions

#### Issue A: Authentication Problems
**Symptoms**: No session or user context
**Solutions**:
- Sign up for a new account using the Quick Auth component
- Check your email for verification (if required)
- Clear browser localStorage and cookies
- Try signing in with a different email

#### Issue B: RLS (Row Level Security) Problems
**Symptoms**: Database tests show "Failed" status
**Solutions**:
1. **Missing User Profile**: If user_profile test fails, the user might not have a profile record
2. **No Family Association**: User might not be associated with any family
3. **RLS Policy Issues**: Database policies might be too restrictive

#### Issue C: Database Schema Issues
**Symptoms**: 500 errors on specific tables
**Solutions**:
- Check if migrations have been applied to your Supabase instance
- Verify table existence in Supabase dashboard
- Check RLS policies in Supabase dashboard

## 🛠️ Specific Fixes

### Fix 1: Create User Profile Manually
If the user_profile test fails, you can create one manually:

1. Go to your Supabase dashboard
2. Navigate to Table Editor > user_profiles
3. Insert a new row:
   ```sql
   INSERT INTO user_profiles (user_id, full_name, email)
   VALUES ('your-user-id', 'Test User', 'test@example.com');
   ```

### Fix 2: Check Database Migrations
Ensure all migrations have been applied:

1. Go to your Supabase dashboard
2. Navigate to Database > Migrations
3. Check if these tables exist:
   - `families`
   - `family_members`
   - `kids_profiles`
   - `user_profiles`

### Fix 3: Verify RLS Policies
Check Row Level Security policies:

1. Go to Supabase dashboard > Authentication > Policies
2. Ensure policies exist for:
   - `families` table
   - `family_members` table
   - `kids_profiles` table
   - `user_profiles` table

### Fix 4: Disable RLS Temporarily (Testing Only)
**⚠️ WARNING: Only for testing, never in production**

If you want to test without RLS:
```sql
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE kids_profiles DISABLE ROW LEVEL SECURITY;
```

## 📋 Testing Checklist

After implementing fixes:

- [ ] Can sign up/sign in successfully
- [ ] Debug component shows all green checkmarks
- [ ] Can create a family without errors
- [ ] Can invite family members
- [ ] Can view family information
- [ ] No 500 errors in browser console
- [ ] Database operations complete successfully

## 🔧 Advanced Debugging

### Check Supabase Logs
1. Go to Supabase dashboard > Logs
2. Look for error messages related to:
   - Authentication failures
   - RLS policy violations
   - Missing table/column errors

### Browser Console Debugging
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for:
   - Authentication errors
   - Network request failures
   - JavaScript errors

### Network Tab Analysis
1. Open Developer Tools (F12)
2. Go to Network tab
3. Look for failed requests to Supabase
4. Check response bodies for detailed error messages

## 🎯 Quick Resolution Steps

### Most Likely Solution:
1. **Sign up** for a new account using the Quick Auth component
2. **Check** the debug information to see what's failing
3. **Create** a user profile manually if needed
4. **Test** family creation functionality

### If Still Not Working:
1. Share the debug information output
2. Check Supabase dashboard for error logs
3. Verify database schema matches migration files
4. Consider temporarily disabling RLS for testing

## 📞 Getting Help

If you're still experiencing issues, please provide:
1. Screenshot of the debug information
2. Browser console errors
3. Supabase dashboard error logs
4. Steps you've already tried

The debug components will help identify the exact issue and guide you to the right solution! 🎉