# Fix 406 Not Acceptable Error - Complete Solution

## Problem Analysis

The 406 Not Acceptable error when accessing `user_profiles` table typically occurs due to:

1. **Missing or incorrectly configured RLS policies**
2. **Table structure issues or missing constraints**
3. **Incorrect permissions for authenticated users**
4. **Missing user profile records**
5. **Authentication state issues**

## Root Cause

The error `https://fqayygyorwvgekebprco.supabase.co/rest/v1/user_profiles?select=*&user_id=eq.359ad3fd-70a1-481d-8360-bcc2dc61a55c` suggests:

- User ID `359ad3fd-70a1-481d-8360-bcc2dc61a55c` exists in auth.users
- But either the user_profiles table has issues or RLS is blocking access
- The request is not being accepted by the database

## Complete Solution

### Step 1: Execute Database Fix

Run the `fix_406_error.sql` script in your Supabase SQL editor:

```sql
-- This script will:
-- 1. Drop and recreate user_profiles table with correct structure
-- 2. Set up proper RLS policies
-- 3. Create necessary indexes and constraints
-- 4. Set up automatic profile creation triggers
-- 5. Create profiles for existing users
-- 6. Add helper functions for safe profile access
```

### Step 2: Update Frontend Code

The enhanced authentication system now includes:

#### **UserProfileService** (`src/services/user-profile-service.ts`)
- Handles all profile operations with proper error handling
- Automatically creates profiles for new users
- Provides type-safe profile management

#### **useUserProfile Hook** (`src/hooks/useUserProfile.ts`)
- React hook for easy profile management
- Automatic profile initialization
- Real-time updates and error handling

### Step 3: Integration with Authentication

Update your authentication flow to use the new profile service:

```typescript
// In your authentication components
import { useUserProfile } from '@/hooks/useUserProfile';

const { profile, loading, error, initializeProfile } = useUserProfile();

// After successful OAuth or email signup
useEffect(() => {
  if (user && !profile && !loading) {
    initializeProfile();
  }
}, [user, profile, loading]);
```

### Step 4: Verify the Fix

1. **Run the health check script** (`database_health_check.sql`)
2. **Test the user profile endpoints**
3. **Verify OAuth authentication works**
4. **Check that profiles are created automatically**

## Technical Details

### Database Schema

```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    -- ... other fields
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);
```

### RLS Policies

```sql
-- Read access
CREATE POLICY "Enable read access for users to their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Write access
CREATE POLICY "Enable insert access for users to create their own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update access
CREATE POLICY "Enable update access for users to their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delete access
CREATE POLICY "Enable delete access for users to their own profile" 
ON public.user_profiles FOR DELETE 
USING (auth.uid() = user_id);
```

### Automatic Profile Creation

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing the Fix

### 1. Database Level Testing

```sql
-- Test if user exists
SELECT id, email FROM auth.users WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- Test if profile exists
SELECT * FROM public.user_profiles WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- Test RLS policies
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.user_profiles WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';
```

### 2. Frontend Testing

```typescript
// Test profile service
import { userProfileService } from '@/services/user-profile-service';

const testProfile = async () => {
  const result = await userProfileService.getCurrentUserProfile();
  console.log('Profile result:', result);
};
```

### 3. API Testing

```bash
# Test the endpoint directly (with proper authentication headers)
curl -X GET 'https://fqayygyorwvgekebprco.supabase.co/rest/v1/user_profiles?select=*&user_id=eq.359ad3fd-70a1-481d-8360-bcc2dc61a55c' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY'
```

## Common Issues and Solutions

### Issue 1: "Row Level Security policy violation"
**Solution**: Ensure the user is properly authenticated and the JWT token is valid.

### Issue 2: "relation 'user_profiles' does not exist"
**Solution**: Run the `fix_406_error.sql` script to create the table.

### Issue 3: "permission denied for table user_profiles"
**Solution**: Check that proper permissions are granted to the `authenticated` role.

### Issue 4: "duplicate key value violates unique constraint"
**Solution**: The script handles this with `ON CONFLICT` clauses.

## Monitoring and Maintenance

### 1. Regular Health Checks

Run the `database_health_check.sql` script periodically to ensure:
- All users have profiles
- RLS policies are active
- Permissions are correct
- No constraint violations

### 2. Error Monitoring

Monitor your application logs for:
- Profile creation failures
- Authentication issues
- Database constraint violations
- RLS policy violations

### 3. Performance Monitoring

Watch for:
- Slow profile queries
- Missing indexes
- High database load during profile operations

## Security Considerations

1. **RLS Enforcement**: All policies ensure users can only access their own profiles
2. **Data Validation**: Constraints prevent invalid data entry
3. **Secure Functions**: All functions use `SECURITY DEFINER` appropriately
4. **Audit Trail**: `created_at` and `updated_at` timestamps for tracking

## Rollback Plan

If issues occur, you can rollback by:

1. **Disable RLS temporarily**:
   ```sql
   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
   ```

2. **Drop problematic policies**:
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON public.user_profiles;
   ```

3. **Restore from backup** if available

## Success Criteria

The fix is successful when:

- ✅ No 406 errors when accessing user profiles
- ✅ All authenticated users can read their own profiles
- ✅ New users automatically get profiles created
- ✅ OAuth authentication works seamlessly
- ✅ Profile updates work without errors
- ✅ RLS policies properly restrict access

This comprehensive solution addresses all potential causes of the 406 error and provides a robust, secure user profile system.