import { supabase } from "@/integrations/supabase/client";

// Emergency service to find kids using all possible methods
export class EmergencyKidsService {
  static async findAllKidsForUser() {
    console.log('🚨 EMERGENCY: Starting comprehensive kids search...');
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ EMERGENCY: User not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      console.log('✅ EMERGENCY: User found:', user.id, user.email);

      const results = {
        user_id: user.id,
        user_email: user.email,
        methods: {},
        all_kids: [],
        summary: {}
      };

      // Method 1: Direct search by parent_user_id
      console.log('🔍 EMERGENCY: Method 1 - Direct parent search...');
      try {
        const { data: directKids, error: directError } = await supabase
          .from('kids_profiles')
          .select('*')
          .eq('parent_user_id', user.id);

        results.methods.direct_parent = {
          success: !directError,
          error: directError?.message,
          count: directKids?.length || 0,
          kids: directKids || []
        };

        if (directKids && directKids.length > 0) {
          console.log('✅ EMERGENCY: Found', directKids.length, 'kids via direct parent search');
          results.all_kids.push(...directKids);
        }
      } catch (err) {
        console.error('❌ EMERGENCY: Direct parent search failed:', err);
        results.methods.direct_parent = { success: false, error: err.message };
      }

      // Method 2: Search through user profile and family
      console.log('🔍 EMERGENCY: Method 2 - Family-based search...');
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('family_id')
          .eq('user_id', user.id)
          .single();

        results.methods.user_profile = {
          success: !profileError,
          error: profileError?.message,
          family_id: userProfile?.family_id
        };

        if (userProfile?.family_id) {
          const { data: familyKids, error: familyError } = await supabase
            .from('kids_profiles')
            .select('*')
            .eq('family_id', userProfile.family_id);

          results.methods.family_search = {
            success: !familyError,
            error: familyError?.message,
            count: familyKids?.length || 0,
            kids: familyKids || []
          };

          if (familyKids && familyKids.length > 0) {
            console.log('✅ EMERGENCY: Found', familyKids.length, 'kids via family search');
            // Add kids that aren't already in the list
            familyKids.forEach(kid => {
              if (!results.all_kids.find(k => k.id === kid.id)) {
                results.all_kids.push(kid);
              }
            });
          }
        }
      } catch (err) {
        console.error('❌ EMERGENCY: Family search failed:', err);
        results.methods.family_search = { success: false, error: err.message };
      }

      // Method 3: Search all kids profiles (broad search)
      console.log('🔍 EMERGENCY: Method 3 - Broad search...');
      try {
        const { data: allKids, error: allError } = await supabase
          .from('kids_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20); // Get recent kids

        results.methods.broad_search = {
          success: !allError,
          error: allError?.message,
          count: allKids?.length || 0,
          kids: allKids || []
        };

        if (allKids && allKids.length > 0) {
          console.log('✅ EMERGENCY: Found', allKids.length, 'total kids in database');
        }
      } catch (err) {
        console.error('❌ EMERGENCY: Broad search failed:', err);
        results.methods.broad_search = { success: false, error: err.message };
      }

      // Method 4: Check if there are any kids at all in the database
      console.log('🔍 EMERGENCY: Method 4 - Database stats...');
      try {
        const { count, error: countError } = await supabase
          .from('kids_profiles')
          .select('*', { count: 'exact', head: true });

        results.methods.database_stats = {
          success: !countError,
          error: countError?.message,
          total_kids_in_db: count
        };

        console.log('📊 EMERGENCY: Total kids in database:', count);
      } catch (err) {
        console.error('❌ EMERGENCY: Database stats failed:', err);
        results.methods.database_stats = { success: false, error: err.message };
      }

      // Remove duplicates from all_kids
      const uniqueKids = results.all_kids.filter((kid, index, self) => 
        index === self.findIndex(k => k.id === kid.id)
      );

      results.summary = {
        total_unique_kids_found: uniqueKids.length,
        methods_successful: Object.values(results.methods).filter(m => m.success).length,
        methods_failed: Object.values(results.methods).filter(m => !m.success).length
      };

      console.log('🎉 EMERGENCY: Search complete!');
      console.log('📊 EMERGENCY: Summary:', results.summary);
      console.log('👶 EMERGENCY: Kids found:', uniqueKids.map(k => ({ 
        id: k.id, 
        name: k.name, 
        parent_user_id: k.parent_user_id, 
        family_id: k.family_id,
        created_at: k.created_at
      })));

      return {
        success: true,
        data: uniqueKids,
        debug_info: results
      };

    } catch (err) {
      console.error('💥 EMERGENCY: Unexpected error:', err);
      return {
        success: false,
        error: 'Unexpected error occurred',
        debug_info: { error: err.message }
      };
    }
  }

  // Quick method to just get kids for the hook
  static async getKidsForUser() {
    const result = await this.findAllKidsForUser();
    return {
      success: result.success,
      data: result.data || [],
      error: result.error
    };
  }

  // Method to fix kids relationships
  static async fixKidsRelationships() {
    console.log('🔧 EMERGENCY: Fixing kids relationships...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Get or create user profile
      let { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Create user profile
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            email: user.email
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ EMERGENCY: Failed to create user profile:', createError);
          return { success: false, error: 'Failed to create user profile' };
        }

        userProfile = newProfile;
      }

      // Get or create family
      let familyId = userProfile?.family_id;

      if (!familyId) {
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${userProfile?.full_name || 'My'} Family`,
            created_by: user.id
          })
          .select()
          .single();

        if (familyError) {
          console.error('❌ EMERGENCY: Failed to create family:', familyError);
          return { success: false, error: 'Failed to create family' };
        }

        familyId = newFamily.id;

        // Update user profile with family_id
        await supabase
          .from('user_profiles')
          .update({ family_id: familyId })
          .eq('user_id', user.id);
      }

      // Fix any orphaned kids
      const { data: orphanedKids, error: orphanError } = await supabase
        .from('kids_profiles')
        .update({ family_id: familyId })
        .eq('parent_user_id', user.id)
        .is('family_id', null)
        .select();

      console.log('🔧 EMERGENCY: Fixed', orphanedKids?.length || 0, 'orphaned kids');

      return {
        success: true,
        fixed_kids: orphanedKids?.length || 0,
        family_id: familyId
      };

    } catch (err) {
      console.error('💥 EMERGENCY: Fix failed:', err);
      return { success: false, error: err.message };
    }
  }
}

// Make it available globally for debugging
(window as any).emergencyFindKids = EmergencyKidsService.findAllKidsForUser;
(window as any).emergencyFixKids = EmergencyKidsService.fixKidsRelationships;