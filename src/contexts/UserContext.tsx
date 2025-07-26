import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { toast } = useToast();

  const loadUserProfile = async (userId: string) => {
    if (profileLoaded && profile?.user_id === userId) {
      console.log('Profile already loaded in memory, skipping database call');
      return;
    }
    console.log('Loading user profile from database for:', userId);
    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No profile found, creating new profile for user:', userId);
          try {
            // Get current user data for profile creation
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
              console.error('Error getting user data:', userError);
              return;
            }
            
            const currentUser = userData.user;
            if (!currentUser) {
              console.error('No current user found');
              return;
            }

            // Extract full_name from user metadata or email
            let fullName = currentUser.user_metadata?.full_name;
            if (!fullName && currentUser.email) {
              fullName = currentUser.email.split('@')[0];
            }
            if (!fullName) {
              fullName = 'User';
            }

            // Create new profile with fallback strategy
            const newProfile = {
              user_id: userId,
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

            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              // Fallback: create minimal profile
              const minimalProfile = {
                user_id: userId,
                full_name: fullName,
                email: currentUser.email,
                age: null,
                weight: null,
                height: null,
                activity_level: null,
                health_goals: null,
                dietary_restrictions: null,
                weight_unit: null
              };
              
              const { data: fallbackProfile, error: fallbackError } = await supabase
                .from('user_profiles')
                .insert(minimalProfile)
                .select()
                .single();

              if (fallbackError) {
                console.error('Fallback profile creation failed:', fallbackError);
                // Last resort: create in-memory profile
                setProfile({
                  user_id: userId,
                  full_name: fullName,
                  email: currentUser.email,
                  age: null,
                  weight: null,
                  height: null,
                  activity_level: null,
                  health_goals: null,
                  dietary_restrictions: null,
                  weight_unit: null
                });
                setProfileLoaded(true);
                return;
              }
              
              setProfile(fallbackProfile);
              setProfileLoaded(true);
            } else {
              setProfile(createdProfile);
              setProfileLoaded(true);
            }
          } catch (profileCreateError) {
            console.error('Profile creation failed:', profileCreateError);
            toast({
              title: "Profile Error",
              description: "Failed to create user profile",
              variant: "destructive"
            });
          }
        } else {
          console.error('Error loading profile:', error);
          toast({
            title: "Profile Error",
            description: "Failed to load user profile",
            variant: "destructive"
          });
        }
      } else {
        setProfile(profileData);
        setProfileLoaded(true);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      toast({
        title: "Profile Error",
        description: "Failed to load user profile",
        variant: "destructive"
      });
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      setProfileLoaded(false);
      await loadUserProfile(user.id);
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
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setProfileLoaded(false);
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setProfileLoaded(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setProfileLoaded(false);
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
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
} 