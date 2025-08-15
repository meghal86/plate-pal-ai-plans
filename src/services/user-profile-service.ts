import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id?: string;
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  dietary_preferences?: string[];
  allergies?: string[];
  medical_conditions?: string[];
  fitness_goals?: string[];
  preferred_language?: string;
  timezone?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy_settings?: {
    profile_visibility: 'public' | 'private';
    data_sharing: boolean;
  };
  subscription_tier?: 'free' | 'premium' | 'family';
  subscription_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileResult {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

class UserProfileService {
  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<ProfileResult> {
    try {
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      console.log('Fetching profile for user:', user.id);

      // Try to get the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          return await this.createUserProfile(user.id, {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            email: user.email
          });
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as any
      };

    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<ProfileResult> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...profileData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as any
      };

    } catch (err) {
      console.error('Unexpected error creating profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ProfileResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as any
      };

    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting user profile:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (err) {
      console.error('Unexpected error deleting profile:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Check if user profile exists
   */
  async profileExists(userId?: string): Promise<boolean> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return false;
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .single();

      return !error && !!data;

    } catch (err) {
      console.error('Error checking profile existence:', err);
      return false;
    }
  }

  /**
   * Initialize profile for new user (called after OAuth or email signup)
   */
  async initializeProfile(): Promise<ProfileResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Check if profile already exists
      const exists = await this.profileExists(user.id);
      if (exists) {
        return await this.getCurrentUserProfile();
      }

      // Create new profile with data from auth user
      const profileData: Partial<UserProfile> = {
        full_name: user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email?.split('@')[0] || 
                  'User',
        email: user.email,
        preferred_language: navigator.language?.startsWith('hi') ? 'hi' : 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notification_preferences: {
          email: true,
          push: true,
          sms: false
        },
        privacy_settings: {
          profile_visibility: 'private',
          data_sharing: false
        },
        subscription_tier: 'free'
      };

      return await this.createUserProfile(user.id, profileData);

    } catch (err) {
      console.error('Error initializing profile:', err);
      return {
        success: false,
        error: 'Failed to initialize profile'
      };
    }
  }

  /**
   * Get profile by user ID (admin function)
   */
  async getProfileByUserId(userId: string): Promise<ProfileResult> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as any
      };

    } catch (err) {
      console.error('Error fetching profile by user ID:', err);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Update subscription information
   */
  async updateSubscription(tier: 'free' | 'premium' | 'family', expiresAt?: string): Promise<ProfileResult> {
    try {
      const updateData: Partial<UserProfile> = {
        subscription_tier: tier,
        subscription_expires_at: expiresAt
      };

      return await this.updateUserProfile(updateData);

    } catch (err) {
      console.error('Error updating subscription:', err);
      return {
        success: false,
        error: 'Failed to update subscription'
      };
    }
  }
}

export const userProfileService = new UserProfileService();