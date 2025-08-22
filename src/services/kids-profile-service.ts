import { supabase } from "@/integrations/supabase/client";

export interface KidsProfile {
  id?: string;
  family_id?: string;
  created_by?: string;
  name: string;
  age: number;
  birth_date?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  dietary_restrictions?: string[];
  favorite_foods?: string[];
  disliked_foods?: string[];
  preferences?: any;
  created_at?: string;
  updated_at?: string;
}

export interface KidsProfileResult {
  success: boolean;
  data?: KidsProfile | KidsProfile[];
  error?: string;
}

class KidsProfileService {
  /**
   * Get all kids profiles for the current user's family
   */
  async getKidsProfiles(): Promise<KidsProfileResult> {
    try {
      console.log('🔐 Checking user authentication...');
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ User not authenticated:', authError);
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      console.log('✅ User authenticated:', user.id);

      // Try to get user's family_id first
      console.log('📋 Fetching user profile...');
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        
        // If user profile doesn't exist, return empty array (not an error)
        if (profileError.code === 'PGRST116') {
          console.log('ℹ️ User profile not found, returning empty kids array');
          return {
            success: true,
            data: []
          };
        }
        
        return {
          success: false,
          error: `Could not fetch user profile: ${profileError.message}`
        };
      }

      console.log('📋 User profile found, family_id:', userProfile?.family_id);

      if (!userProfile?.family_id) {
        console.log('ℹ️ User has no family_id, returning empty array');
        return {
          success: true,
          data: []
        };
      }

      // Try to fetch kids profiles using family_id
      console.log('👶 Fetching kids profiles for family:', userProfile.family_id);
      const { data: kidsProfiles, error: kidsError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', userProfile.family_id)
        .order('created_at', { ascending: true });

      if (kidsError) {
        console.error('❌ Error fetching kids profiles:', kidsError);
        
        // If table doesn't exist, return empty array
        if (kidsError.code === '42P01') {
          console.log('⚠️ kids_profiles table does not exist, returning empty array');
          return {
            success: true,
            data: []
          };
        }
        
        return {
          success: false,
          error: `Could not fetch kids profiles: ${kidsError.message}`
        };
      }

      console.log('✅ Successfully found kids profiles:', kidsProfiles?.length || 0);

      return {
        success: true,
        data: kidsProfiles || []
      };

    } catch (err) {
      console.error('💥 Unexpected error fetching kids profiles:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Get a specific kid profile by ID
   */
  async getKidsProfile(kidId: string): Promise<KidsProfileResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data, error } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('id', kidId)
        .single();

      if (error) {
        console.error('Error fetching kid profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (err) {
      console.error('Unexpected error fetching kid profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Create a new kid profile
   */
  async createKidsProfile(profileData: Omit<KidsProfile, 'id' | 'created_at' | 'updated_at'>): Promise<KidsProfileResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Get user's family ID
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('kids_profiles')
        .insert({
          ...profileData,
          family_id: userProfile?.family_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating kid profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (err) {
      console.error('Unexpected error creating kid profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Update a kid profile
   */
  async updateKidsProfile(kidId: string, profileData: Partial<KidsProfile>): Promise<KidsProfileResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data, error } = await supabase
        .from('kids_profiles')
        .update(profileData)
        .eq('id', kidId)
        .select()
        .single();

      if (error) {
        console.error('Error updating kid profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (err) {
      console.error('Unexpected error updating kid profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Delete a kid profile
   */
  async deleteKidsProfile(kidId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { error } = await supabase
        .from('kids_profiles')
        .delete()
        .eq('id', kidId);

      if (error) {
        console.error('Error deleting kid profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (err) {
      console.error('Unexpected error deleting kid profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Get or create a family for the current user
   */
  async getOrCreateFamily(): Promise<{ success: boolean; familyId?: string; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // First check if user has a family
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (userProfile?.family_id) {
        return {
          success: true,
          familyId: userProfile.family_id
        };
      }

      // Create a new family
      const { data: family, error } = await supabase
        .from('families')
        .insert({ name: 'My Family', created_by: user.id })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Update user profile with family_id
      await supabase
        .from('user_profiles')
        .update({ family_id: family.id })
        .eq('user_id', user.id);

      return {
        success: true,
        familyId: family.id
      };

    } catch (err) {
      console.error('Unexpected error getting or creating family:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Calculate kid's age from birth date
   */
  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get kid's initials for avatar
   */
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /**
   * Check if user has any kids profiles
   */
  async hasKidsProfiles(): Promise<boolean> {
    try {
      const result = await this.getKidsProfiles();
      return result.success && Array.isArray(result.data) && result.data.length > 0;
    } catch (err) {
      console.error('Error checking if user has kids profiles:', err);
      return false;
    }
  }
}

export const kidsProfileService = new KidsProfileService();