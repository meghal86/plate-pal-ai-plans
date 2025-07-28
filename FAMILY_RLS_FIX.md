# Fix for Families Table 500 Error - Infinite Recursion in RLS Policies

## Problem Description

The 500 Internal Server Error when querying the families table is caused by infinite recursion in Row Level Security (RLS) policies. The error message is:

```
{"code":"42P17","message":"infinite recursion detected in policy for relation \"families\""}
```

## Root Cause

The RLS policy on the `families` table references the `family_members` table, which creates a circular dependency:

```sql
-- This policy causes infinite recursion
CREATE POLICY "Users can view families they created or are members of" ON families
    FOR SELECT USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = families.id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );
```

## Solution

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute the following SQL commands in order

### Step 2: Drop Existing Policies

```sql
-- Drop all existing policies on families table
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Users can view families they created or are members of" ON families;
DROP POLICY IF EXISTS "Family creators can update their family" ON families;
DROP POLICY IF EXISTS "Family members can view their family" ON families;
```

### Step 3: Create New Non-Recursive Policies

```sql
-- Create simpler policies that don't cause recursion
-- Policy 1: Users can create families
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy 2: Users can view families they created (simple, no recursion)
CREATE POLICY "Users can view families they created" ON families
    FOR SELECT USING (auth.uid() = created_by);

-- Policy 3: Users can update families they created
CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);
```

### Step 4: Alternative Solution - Disable RLS Temporarily

If you need immediate access and the above doesn't work, you can temporarily disable RLS:

```sql
-- TEMPORARY: Disable RLS on families table
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: This removes all access restrictions. Only use this temporarily and re-enable RLS with proper policies later.

### Step 5: Test the Fix

After applying the SQL changes, test the API call:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "apikey: YOUR_ANON_KEY" \
     "https://fqayygyorwvgekebprco.supabase.co/rest/v1/families?select=*&id=eq.8f5fae79-8fd9-4f03-b112-e5ed110b7f0c"
```

## Long-term Solution

### Option 1: Use Supabase Functions

Create a Supabase Edge Function to handle family access logic:

```typescript
// supabase/functions/get-family/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { familyId } = await req.json()
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  
  // Verify user and check family access
  const { data: user } = await supabaseClient.auth.getUser(token)
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Check if user is family creator or member
  const { data: family } = await supabaseClient
    .from('families')
    .select('*')
    .eq('id', familyId)
    .eq('created_by', user.user.id)
    .single()

  if (family) {
    return new Response(JSON.stringify(family), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Check if user is a family member
  const { data: membership } = await supabaseClient
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.user.id)
    .eq('family_id', familyId)
    .eq('status', 'accepted')
    .single()

  if (membership) {
    const { data: memberFamily } = await supabaseClient
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single()
    
    return new Response(JSON.stringify(memberFamily), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Family not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Option 2: Use Application-Level Security

Handle family access checks in your React application instead of relying on RLS policies that create circular dependencies.

## Prevention

To prevent similar issues in the future:

1. **Avoid circular references** in RLS policies
2. **Test policies thoroughly** before deploying
3. **Use simple policies** when possible
4. **Consider using Supabase Functions** for complex access logic
5. **Document policy dependencies** in your migration files

## Files Modified

- `src/pages/Family.tsx` - Updated to handle family access when user is not the creator
- `supabase/migrations/20250109000000_fix_infinite_recursion.sql` - New migration to fix RLS policies

## Verification

After applying the fix, verify that:

1. ✅ The API call returns data instead of 500 error
2. ✅ Family creators can view their families
3. ✅ Family members can still access family data through the application
4. ✅ Unauthorized users cannot access family data

## Support

If you continue to experience issues after applying this fix, check:

1. Supabase project logs for additional error details
2. Network tab in browser developer tools for full error responses
3. Supabase dashboard Auth section for user authentication status