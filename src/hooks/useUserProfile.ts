import { useState, useEffect } from 'react';
import { userProfileService, type UserProfile } from '@/services/user-profile-service';
import { supabase } from '@/integrations/supabase/client';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  initializeProfile: () => Promise<boolean>;
}

export const useUserProfile = (): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await userProfileService.getCurrentUserProfile();
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error || 'Failed to fetch profile');
        setProfile(null);
      }
    } catch (err) {
      console.error('Error in useUserProfile:', err);
      setError('Unexpected error occurred');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const result = await userProfileService.updateUserProfile(data);
      
      if (result.success && result.data) {
        setProfile(result.data);
        return true;
      } else {
        setError(result.error || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  const initializeProfile = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await userProfileService.initializeProfile();
      
      if (result.success && result.data) {
        setProfile(result.data);
        return true;
      } else {
        setError(result.error || 'Failed to initialize profile');
        return false;
      }
    } catch (err) {
      console.error('Error initializing profile:', err);
      setError('Unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    let mounted = true;

    const initializeUserProfile = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      if (mounted) {
        await fetchProfile();
      }
    };

    initializeUserProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        // User signed in, fetch or initialize profile
        await fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear profile
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
    initializeProfile
  };
};