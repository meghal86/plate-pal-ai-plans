import { supabase } from "@/integrations/supabase/client";

export interface KidsProfile {
  id?: string;
  family_id?: string;
  parent_user_id: string;
  name: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  grade_level?: string;
  school_name?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  favorite_foods?: string[];
  disliked_foods?: string[];
  activity_level?: 'low' | 'moderate' | 'high';
  height_cm?: number;
  weight_kg?: number;
  medical_conditions?: string[];
  notes?: string;
  avatar_url?: string;
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
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      console.log('Fetching kids profiles for user:', user.id);

      // Get user's family_id first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return {
          success: false,
          error: 'Could not fetch user profile'
        };
      }

      if (!userProfile?.family_id) {
        console.log('User has no family_id, returning empty array');
        return {
          success: true,
          data: []
        };
      }

      // Fetch kids profiles using family_id
      const { data: kidsProfiles, error: kidsError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', userProfile.family_id)
        .order('created_at', { ascending: true });

      if (kidsError) {
        console.error('Error fetching kids profiles:', kidsError);
        return {
          success: false,
          error: kidsError.message
        };
      }

      console.log('Found kids profiles:', kidsProfiles?.length || 0);

      return {
        success: true,
        data: kidsProfiles || []
      };

    } catch (err) {
      console.error('Unexpected error fetching kids profiles:', err);
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

      // Use the database function to add kid profile (it handles family creation)
      const { data, error } = await supabase.rpc('add_kid_profile', {
        kid_name: profileData.name,
        kid_birth_date: profileData.birth_date || null,
        kid_gender: profileData.gender || null,
        kid_grade_level: profileData.grade_level || null,
        kid_school_name: profileData.school_name || null,
        kid_dietary_restrictions: profileData.dietary_restrictions || [],
        kid_allergies: profileData.allergies || [],
        kid_favorite_foods: profileData.favorite_foods || [],
        kid_disliked_foods: profileData.disliked_foods || [],
        kid_activity_level: profileData.activity_level || 'moderate',
        kid_height_cm: profileData.height_cm || null,
        kid_weight_kg: profileData.weight_kg || null,
        kid_medical_conditions: profileData.medical_conditions || [],
        kid_notes: profileData.notes || null
      });

      if (error) {
        console.error('Error creating kid profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Fetch the created profile
      const createdProfile = await this.getKidsProfile(data);
      
      return createdProfile;

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

      // Use the database function to get or create family
      const { data, error } = await supabase.rpc('get_or_create_user_family', {
        user_id: user.id
      });

      if (error) {
        console.error('Error getting or creating family:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        familyId: data
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