import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  health_goals: string | null;
  dietary_restrictions: string | null;
  weight_unit: string | null;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Use refs to prevent multiple simultaneous calls
  const loadingRef = useRef(false);

  const createProfileFromUser = (currentUser: any): UserProfile => {
    // Extract full_name from user metadata or email
    let fullName = currentUser.user_metadata?.full_name;
    
    // If no full_name in metadata, try other fields
    if (!fullName) {
      fullName = currentUser.user_metadata?.name || 
                 currentUser.user_metadata?.display_name ||
                 currentUser.user_metadata?.preferred_username;
    }
    
    // If still no name, use email prefix
    if (!fullName && currentUser.email) {
      const emailPrefix = currentUser.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      fullName = emailPrefix
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Final fallback
    if (!fullName) {
      fullName = 'User';
    }

    console.log('📝 Creating profile with fullName:', fullName, 'from user:', currentUser);

    return {
      user_id: currentUser.id,
      full_name: fullName,
      email: currentUser.email,
      age: null,
      weight: null,
      height: null,
      activity_level: 'moderate',
      health_goals: 'General health',
      dietary_restrictions: 'None',
      weight_unit: 'kg'
    };
  };

  const loadUserProfile = async (currentUser: any) => {
    console.log('🔍 loadUserProfile called for userId:', currentUser.id);
    
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('⚠️ Profile loading already in progress, skipping');
      return;
    }

    console.log('🚀 Loading profile for user:', currentUser.id);
    loadingRef.current = true;
    setLoading(true);
    
    // Try to load from database first (with short timeout)
    try {
      console.log('📡 Querying database for existing profile...');
      
      // Create a promise that rejects after 3 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 3000);
      });
      
      // Create the database query promise
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      // Race between timeout and query
      const { data: profileData, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      console.log('📡 Database query result:', { profileData, error });
      
      if (!error && profileData && profileData.full_name) {
        // Use real profile from database
        console.log('✅ Found existing profile:', profileData);
        setProfile(profileData);
        setLoading(false);
      } else {
        // No profile found or error, create from user data
        console.log('📝 No existing profile found or invalid data, creating from user data');
        const newProfile = createProfileFromUser(currentUser);
        console.log('✅ New profile created:', newProfile);
        setProfile(newProfile);
        setLoading(false);
        
        // Try to save the profile to database for future use
        try {
          const { error: saveError } = await supabase
            .from('user_profiles')
            .insert([newProfile]);
          
          if (saveError) {
            console.log('⚠️ Could not save profile to database:', saveError);
          } else {
            console.log('✅ Profile saved to database');
          }
        } catch (saveError) {
          console.log('⚠️ Error saving profile to database:', saveError);
        }
      }
      
    } catch (error) {
      console.log('⚠️ Database query failed, creating fallback profile:', error);
      // Create fallback profile from user data
      const fallbackProfile = createProfileFromUser(currentUser);
      console.log('✅ Fallback profile created:', fallbackProfile);
      setProfile(fallbackProfile);
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 Forcing profile refresh for user:', user.id);
      // Reset loading state first
      loadingRef.current = false;
      setLoading(false);
      // Wait a bit then load
      setTimeout(() => {
        loadUserProfile(user);
      }, 100);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('No user found');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔄 UserContext useEffect started');

    // Check for existing session immediately on mount
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔍 Found existing session for user:', session.user.id);
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          console.log('🔍 No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error checking existing session:', error);
        setLoading(false);
      }
    };

    // Check existing session first
    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in, loading profile once');
            setUser(session.user);
            await loadUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out, clearing profile');
            setUser(null);
            setProfile(null);
            setLoading(false);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refreshed, updating user');
            setUser(session.user);
            // Reload profile after token refresh to ensure we have latest data
            await loadUserProfile(session.user);
          } else if (event === 'INITIAL_SESSION') {
            console.log('🔄 Initial session event:', session?.user?.id ? 'User found' : 'No user');
            if (session?.user) {
              setUser(session.user);
              await loadUserProfile(session.user);
            } else {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 UserContext cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const value: UserContextType = {
    user,
    profile,
    loading,
    refreshProfile,
    updateProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export { useUser, UserProvider }; 