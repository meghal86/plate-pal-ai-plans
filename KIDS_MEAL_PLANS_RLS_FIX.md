# Kids Meal Plans RLS Fix - Complete Solution

## Problem Analysis

The error you're experiencing:
```
POST https://fqayygyorwvgekebprco.supabase.co/rest/v1/kids_meal_plans?select=* 403 (Forbidden)
Error saving meal plan: {code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "kids_meal_plans"'}
```

This indicates:
1. **403 Forbidden**: The request is being blocked by Row Level Security (RLS)
2. **Code 42501**: PostgreSQL error for insufficient privilege
3. **RLS Policy Violation**: The insert operation violates the table's security policies

## Root Cause

The `kids_meal_plans` table has RLS enabled but the policies are either:
- Missing or incorrectly configured
- Not allowing the authenticated user to insert records
- Referencing columns or conditions that don't match the insert data

## Complete Solution

### Step 1: Execute the Database Fix

Run the `fix_kids_meal_plans_rls.sql` script in your Supabase SQL editor. This script will:

1. **Create the table** if it doesn't exist with proper structure
2. **Enable RLS** with comprehensive policies
3. **Create secure functions** for safe data operations
4. **Grant proper permissions** to authenticated users
5. **Test the setup** to ensure it works

### Step 2: Updated Service Implementation

The `KidsMealPlansService` has been enhanced with:

#### **Dual Approach Strategy**
```typescript
// Primary: Use secure database function
const { data: planId, error: funcError } = await supabase
  .rpc('insert_kids_meal_plan', {
    p_kid_id: kidId,
    p_title: plan.title,
    p_description: plan.description,
    p_duration: plan.daily_plans.length,
    p_plan_data: plan as any,
    p_preferences: preferences as any,
    p_is_active: false
  });

// Fallback: Direct table insert if function fails
if (funcError) {
  return await this.saveMealPlanDirect(kidId, plan, preferences, userId);
}
```

#### **Enhanced Error Handling**
- Graceful fallback mechanisms
- Detailed error logging
- User-friendly error messages

### Step 3: Database Schema

#### **Table Structure**
```sql
CREATE TABLE public.kids_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 7,
    plan_data JSONB NOT NULL,
    preferences JSONB,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **RLS Policies**
```sql
-- SELECT: Users can view meal plans they created
CREATE POLICY "Users can view their created meal plans" ON public.kids_meal_plans
    FOR SELECT USING (auth.uid() = created_by);

-- INSERT: Users can create meal plans
CREATE POLICY "Users can create meal plans" ON public.kids_meal_plans
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- UPDATE: Users can update their meal plans
CREATE POLICY "Users can update their created meal plans" ON public.kids_meal_plans
    FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- DELETE: Users can delete their meal plans
CREATE POLICY "Users can delete their created meal plans" ON public.kids_meal_plans
    FOR DELETE USING (auth.uid() = created_by);
```

#### **Secure Functions**
```sql
-- Safe insert function
CREATE OR REPLACE FUNCTION public.insert_kids_meal_plan(
    p_kid_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_duration INTEGER,
    p_plan_data JSONB,
    p_preferences JSONB,
    p_is_active BOOLEAN DEFAULT false
) RETURNS UUID

-- Safe select function
CREATE OR REPLACE FUNCTION public.get_kids_meal_plans(p_kid_id UUID)
RETURNS TABLE (...)
```

## Testing the Fix

### 1. Database Level Testing

Execute `test_kids_meal_plans_fix.sql` to verify:
- Table structure is correct
- RLS is enabled with proper policies
- Functions exist and have correct permissions
- Basic operations work

### 2. Frontend Testing

```typescript
// Test the service
import { KidsMealPlansService } from '@/services/kids-meal-plans-service';

const testSave = async () => {
  try {
    const result = await KidsMealPlansService.saveMealPlan(
      'kid-id',
      mockPlan,
      mockPreferences,
      'user-id'
    );
    console.log('✅ Save successful:', result);
  } catch (error) {
    console.error('❌ Save failed:', error);
  }
};
```

### 3. API Testing

```bash
# Test with proper authentication
curl -X POST 'https://fqayygyorwvgekebprco.supabase.co/rest/v1/kids_meal_plans' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "kid_id": "test-kid-id",
    "title": "Test Plan",
    "description": "Test Description",
    "duration": 7,
    "plan_data": {"test": true},
    "preferences": {"test": true},
    "created_by": "YOUR_USER_ID"
  }'
```

## Common Issues and Solutions

### Issue 1: "Function does not exist"
**Cause**: The secure functions weren't created properly
**Solution**: Re-run the `fix_kids_meal_plans_rls.sql` script

### Issue 2: "Permission denied for function"
**Cause**: Function permissions not granted to authenticated role
**Solution**: Execute `GRANT EXECUTE ON FUNCTION ... TO authenticated;`

### Issue 3: "auth.uid() returns null"
**Cause**: User not properly authenticated
**Solution**: Ensure JWT token is valid and user is signed in

### Issue 4: "Still getting RLS violations"
**Cause**: Policies might not be matching the data being inserted
**Solution**: Check that `created_by` field matches `auth.uid()`

## Security Features

### 1. **Row Level Security**
- Users can only access meal plans they created
- No cross-user data leakage
- Automatic user context enforcement

### 2. **Secure Functions**
- `SECURITY DEFINER` functions run with elevated privileges
- Input validation and sanitization
- Proper error handling

### 3. **Data Integrity**
- Foreign key constraints to auth.users
- NOT NULL constraints on required fields
- Proper indexing for performance

## Monitoring and Maintenance

### 1. **Regular Health Checks**
Run the test script periodically to ensure:
- RLS policies are active
- Functions are accessible
- Permissions are correct

### 2. **Error Monitoring**
Watch for these error patterns:
- `42501`: Permission denied
- `42P01`: Table doesn't exist
- `PGRST116`: No rows returned

### 3. **Performance Monitoring**
- Monitor function execution times
- Check index usage
- Watch for slow queries

## Rollback Plan

If issues persist:

1. **Temporarily disable RLS** (for debugging only):
   ```sql
   ALTER TABLE public.kids_meal_plans DISABLE ROW LEVEL SECURITY;
   ```

2. **Drop problematic policies**:
   ```sql
   DROP POLICY "policy_name" ON public.kids_meal_plans;
   ```

3. **Use service role** for critical operations (temporary):
   ```typescript
   const { data, error } = await supabase
     .from('kids_meal_plans')
     .insert(planData);
   ```

## Success Criteria

The fix is successful when:
- ✅ No 403 Forbidden errors
- ✅ Meal plans save successfully
- ✅ Users can only access their own data
- ✅ All CRUD operations work properly
- ✅ RLS policies properly restrict access
- ✅ Functions execute without errors

## Additional Enhancements

The solution also includes:
- **Automatic timestamps** with triggers
- **Comprehensive indexing** for performance
- **Graceful error handling** in the service layer
- **Fallback mechanisms** for reliability
- **Detailed logging** for debugging

This comprehensive fix addresses all aspects of the RLS violation issue and provides a robust, secure foundation for the kids meal plans feature.