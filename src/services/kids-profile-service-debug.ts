import { supabase } from "@/integrations/supabase/client";

// Debug version of the kids profile service with extensive logging
export class KidsProfileServiceDebug {
  /**
   * Debug version of getKidsProfiles with extensive logging
   */
  static async debugGetKidsProfiles() {
    console.log('🚀 DEBUG: Starting kids profiles fetch...');
    
    try {
      // Step 1: Check authentication
      console.log('🔐 DEBUG: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ DEBUG: Auth error:', authError);
        return { success: false, error: 'Authentication error', step: 'auth' };
      }
      
      if (!user) {
        console.error('❌ DEBUG: No user found');
        return { success: false, error: 'No user found', step: 'auth' };
      }
      
      console.log('✅ DEBUG: User authenticated:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });

      // Step 2: Check if user_profiles table exists and user has a profile
      console.log('📋 DEBUG: Checking user profile...');
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ DEBUG: Profile error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          console.log('ℹ️ DEBUG: User profile not found, this might be the issue');
          return { 
            success: false, 
            error: 'User profile not found - please ensure user profile is created', 
            step: 'profile',
            details: { profileError }
          };
        }
        
        return { 
          success: false, 
          error: `Profile fetch error: ${profileError.message}`, 
          step: 'profile',
          details: { profileError }
        };
      }

      console.log('✅ DEBUG: User profile found:', {
        id: userProfile.id,
        user_id: userProfile.user_id,
        full_name: userProfile.full_name,
        family_id: userProfile.family_id,
        created_at: userProfile.created_at
      });

      // Step 3: Check family
      if (!userProfile.family_id) {
        console.log('⚠️ DEBUG: User has no family_id, this is likely the issue');
        
        // Try to create a family
        console.log('🏠 DEBUG: Attempting to create family...');
        try {
          const { data: newFamily, error: familyError } = await supabase
            .from('families')
            .insert({
              name: `${userProfile.full_name || 'My'} Family`,
              created_by: user.id
            })
            .select()
            .single();

          if (familyError) {
            console.error('❌ DEBUG: Failed to create family:', familyError);
            return { 
              success: false, 
              error: `Failed to create family: ${familyError.message}`, 
              step: 'family_creation',
              details: { familyError }
            };
          }

          console.log('✅ DEBUG: Family created:', newFamily);

          // Update user profile with family_id
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ family_id: newFamily.id })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('❌ DEBUG: Failed to update user profile with family_id:', updateError);
            return { 
              success: false, 
              error: `Failed to update profile: ${updateError.message}`, 
              step: 'profile_update',
              details: { updateError }
            };
          }

          console.log('✅ DEBUG: User profile updated with family_id');
          userProfile.family_id = newFamily.id;

        } catch (err) {
          console.error('💥 DEBUG: Unexpected error creating family:', err);
          return { 
            success: false, 
            error: 'Unexpected error creating family', 
            step: 'family_creation',
            details: { err }
          };
        }
      }

      // Step 4: Check families table access
      console.log('🏠 DEBUG: Checking family access...');
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', userProfile.family_id)
        .single();

      if (familyError) {
        console.error('❌ DEBUG: Family access error:', familyError);
        return { 
          success: false, 
          error: `Family access error: ${familyError.message}`, 
          step: 'family_access',
          details: { familyError, family_id: userProfile.family_id }
        };
      }

      console.log('✅ DEBUG: Family found:', {
        id: family.id,
        name: family.name,
        created_by: family.created_by,
        created_at: family.created_at
      });

      // Step 5: Check kids_profiles table access
      console.log('👶 DEBUG: Checking kids profiles...');
      const { data: kidsProfiles, error: kidsError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', userProfile.family_id)
        .order('created_at', { ascending: true });

      if (kidsError) {
        console.error('❌ DEBUG: Kids profiles error:', kidsError);
        return { 
          success: false, 
          error: `Kids profiles error: ${kidsError.message}`, 
          step: 'kids_access',
          details: { kidsError, family_id: userProfile.family_id }
        };
      }

      console.log('✅ DEBUG: Kids profiles query successful:', {
        count: kidsProfiles?.length || 0,
        kids: kidsProfiles?.map(k => ({ id: k.id, name: k.name, created_at: k.created_at })) || []
      });

      // Step 6: Also check if there are any kids with parent_user_id (backup check)
      console.log('👨‍👩‍👧‍👦 DEBUG: Checking kids by parent_user_id...');
      const { data: kidsByParent, error: parentKidsError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: true });

      if (parentKidsError) {
        console.error('❌ DEBUG: Kids by parent error:', parentKidsError);
      } else {
        console.log('✅ DEBUG: Kids by parent query successful:', {
          count: kidsByParent?.length || 0,
          kids: kidsByParent?.map(k => ({ id: k.id, name: k.name, family_id: k.family_id, created_at: k.created_at })) || []
        });
      }

      // Combine results (prefer family-based, fallback to parent-based)
      const allKids = kidsProfiles || [];
      if (kidsByParent && kidsByParent.length > 0) {
        // Add any kids found by parent that aren't already in the family list
        kidsByParent.forEach(kid => {
          if (!allKids.find(k => k.id === kid.id)) {
            allKids.push(kid);
          }
        });
      }

      console.log('🎉 DEBUG: Final result:', {
        success: true,
        total_kids: allKids.length,
        kids: allKids.map(k => ({ 
          id: k.id, 
          name: k.name, 
          family_id: k.family_id, 
          parent_user_id: k.parent_user_id,
          created_at: k.created_at 
        }))
      });

      return {
        success: true,
        data: allKids,
        step: 'complete',
        debug_info: {
          user_id: user.id,
          user_email: user.email,
          profile_id: userProfile.id,
          family_id: userProfile.family_id,
          family_name: family.name,
          kids_count: allKids.length
        }
      };

    } catch (err) {
      console.error('💥 DEBUG: Unexpected error:', err);
      return { 
        success: false, 
        error: 'Unexpected error occurred', 
        step: 'unexpected',
        details: { err }
      };
    }
  }

  /**
   * Test database connectivity and permissions
   */
  static async testDatabaseAccess() {
    console.log('🧪 DEBUG: Testing database access...');
    
    const tests = [
      {
        name: 'user_profiles table',
        query: () => supabase.from('user_profiles').select('count', { count: 'exact', head: true })
      },
      {
        name: 'families table',
        query: () => supabase.from('families').select('count', { count: 'exact', head: true })
      },
      {
        name: 'kids_profiles table',
        query: () => supabase.from('kids_profiles').select('count', { count: 'exact', head: true })
      }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const { count, error } = await test.query();
        if (error) {
          console.error(`❌ DEBUG: ${test.name} access failed:`, error);
          results.push({ table: test.name, status: 'FAILED', error: error.message });
        } else {
          console.log(`✅ DEBUG: ${test.name} accessible, count:`, count);
          results.push({ table: test.name, status: 'SUCCESS', count });
        }
      } catch (err) {
        console.error(`💥 DEBUG: ${test.name} unexpected error:`, err);
        results.push({ table: test.name, status: 'ERROR', error: err });
      }
    }

    return results;
  }
}

// Export for easy testing in console
(window as any).debugKidsProfiles = KidsProfileServiceDebug.debugGetKidsProfiles;
(window as any).testDatabaseAccess = KidsProfileServiceDebug.testDatabaseAccess;