import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    meal_reminders: boolean;
    health_tips: boolean;
    family_updates: boolean;
  } | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  health_goals: string | null;
  dietary_restrictions: string | null;
  weight_unit: string | null;
  family_id?: string | null;
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
    // PRIORITY 1: Extract full_name from user metadata (set during sign-up)
    let fullName = currentUser.user_metadata?.full_name;

    // PRIORITY 2: If no full_name in metadata, try other auth metadata fields
    if (!fullName) {
      fullName = currentUser.user_metadata?.name ||
                 currentUser.user_metadata?.display_name ||
                 currentUser.user_metadata?.preferred_username;
    }

    // PRIORITY 3: Only if no metadata exists, use email prefix with better formatting
    if (!fullName && currentUser.email) {
      const emailPrefix = currentUser.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      fullName = emailPrefix
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    }

    // Final fallback
    if (!fullName || fullName === 'User') {
      fullName = currentUser.email ? currentUser.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User';
    }

    console.log('📝 Creating profile with fullName:', fullName, 'from user metadata:', currentUser.user_metadata);

    return {
      user_id: currentUser.id,
      full_name: fullName,
      email: currentUser.email,
      phone_number: null,
      notification_preferences: {
        email: true,
        sms: false,
        push: true,
        meal_reminders: true,
        health_tips: true,
        family_updates: true
      },
      age: null,
      weight: null,
      height: null,
      activity_level: 'moderate',
      health_goals: 'General health',
      dietary_restrictions: 'None',
      weight_unit: 'kg',
      family_id: null
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

    try {
      // Set a timeout for the database query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
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
      
      if (!error && profileData && profileData.user_id) {
        // Use real profile from database, but ensure new fields are included
        console.log('✅ Found existing profile:', profileData);
        console.log('🔍 Profile full_name:', profileData.full_name);
        
        // CRITICAL: Always preserve the existing full_name, never overwrite it
        const completeProfile: UserProfile = {
          ...profileData,
          full_name: profileData.full_name || 'User', // Preserve existing name from database
          phone_number: profileData.phone_number || null,
          notification_preferences: (() => {
            // Handle the notification_preferences from database
            if (profileData.notification_preferences && typeof profileData.notification_preferences === 'object') {
              const prefs = profileData.notification_preferences as any;
              return {
                email: prefs.email ?? true,
                sms: prefs.sms ?? false,
                push: prefs.push ?? true,
                meal_reminders: prefs.meal_reminders ?? true,
                health_tips: prefs.health_tips ?? true,
                family_updates: prefs.family_updates ?? true
              };
            }
            return {
              email: true,
              sms: false,
              push: true,
              meal_reminders: true,
              health_tips: true,
              family_updates: true
            };
          })()
        };
        
        // FINAL SAFETY CHECK: Only fix if full_name is actually "User" (not other valid names)
        if (completeProfile.full_name === "User" && currentUser?.email) {
          completeProfile.full_name = currentUser.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        console.log('✅ Setting complete profile:', completeProfile);
        console.log('🔍 Final full_name:', completeProfile.full_name);
        setProfile(completeProfile);
        setLoading(false);
      } else {
        // No profile found or error, create from user data
        console.log('📝 No existing profile found or invalid data, creating from user data');
        console.log('🔍 Profile data received:', profileData);
        console.log('🔍 Error if any:', error);
        
        const newProfileData = createProfileFromUser(currentUser);
        console.log('✅ New profile created:', newProfileData);
        console.log('🔍 New profile full_name:', newProfileData.full_name);
        
        // For new profiles, we don't have id, created_at, updated_at yet
        // These will be set by the database when we insert
        setProfile(newProfileData as UserProfile);
        setLoading(false);
        
        // Try to save the profile to database for future use
        try {
          const { error: saveError } = await supabase
            .from('user_profiles')
            .insert([newProfileData]);
          
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
      setLoading(true);
      // Wait a bit then load
      setTimeout(() => {
        loadUserProfile(user);
      }, 100);
    }
  };

  // Ensure we always have a valid profile
  useEffect(() => {
    if (!loading && user && !profile) {
      console.log('🔄 No profile found but user exists, creating profile');
      const fallbackProfile = createProfileFromUser(user);
      setProfile(fallbackProfile);
    }
  }, [loading, user, profile]);

  // Additional safety check: if profile exists but full_name is "User", try to fix it
  useEffect(() => {
    if (!loading && profile && profile.full_name === "User" && user?.email) {
      console.log('🔄 Profile full_name is "User", attempting to fix');
      const fixedProfile = {
        ...profile,
        full_name: user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
      setProfile(fixedProfile);
    }
  }, [loading, profile?.user_id, user?.id]); // Only trigger when user/profile IDs change, not on every profile update

  // CRITICAL: Prevent profile corruption from other components
  useEffect(() => {
    if (profile && user && profile.user_id !== user.id) {
      console.log('⚠️ Profile user_id mismatch detected, reloading profile');
      loadUserProfile(user);
    }
  }, [profile, user]);

  // Additional safety: ensure profile is never corrupted (only fix if actually "User")
  useEffect(() => {
    if (profile && profile.full_name === "User" && user?.email) {
      console.log('🔄 Detected corrupted profile, fixing immediately');
      const fixedProfile = {
        ...profile,
        full_name: user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
      setProfile(fixedProfile);
    }
  }, [profile?.user_id, user?.id]); // Only trigger when IDs change, not on every profile change

  // EMERGENCY FIX: If profile exists but full_name is missing or "User", fix it immediately
  useEffect(() => {
    if (profile && (!profile.full_name || profile.full_name === "User") && user?.email) {
      console.log('🚨 EMERGENCY FIX: Profile full_name is missing or "User", fixing now');
      console.log('🔍 Current profile:', profile);
      console.log('🔍 User email:', user.email);
      
      const emailPrefix = user.email.split('@')[0];
      const extractedName = emailPrefix
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      
      const fixedProfile = {
        ...profile,
        full_name: extractedName
      };
      
      console.log('✅ EMERGENCY FIX: Setting fixed profile:', fixedProfile);
      setProfile(fixedProfile);
    }
  }, [profile, user?.email]); // Trigger whenever profile or user email changes

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('No user found');
    }

    // SAFETY CHECK: Prevent overwriting valid full_name with "User"
    if (updates.full_name === "User" && profile?.full_name && profile.full_name !== "User") {
      console.log('🛡️ SAFETY CHECK: Preventing overwrite of valid full_name with "User"');
      console.log('🔍 Current profile.full_name:', profile.full_name);
      console.log('🔍 Attempted update:', updates.full_name);
      delete updates.full_name; // Remove the problematic update
    }

    try {
      // If full_name is being updated, also update auth metadata
      if (updates.full_name) {
        console.log('🔄 Updating auth metadata with full_name:', updates.full_name);
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        });

        if (authError) {
          console.warn('⚠️ Could not update auth metadata:', authError);
        } else {
          console.log('✅ Auth metadata updated successfully');
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure the updated profile includes all required fields
      const completeProfile: UserProfile = {
        ...data,
        full_name: data.full_name || 'User', // Preserve existing name
        phone_number: data.phone_number || null,
        notification_preferences: (() => {
          // Handle the notification_preferences from database
          if (data.notification_preferences && typeof data.notification_preferences === 'object') {
            const prefs = data.notification_preferences as any;
            return {
              email: prefs.email ?? true,
              sms: prefs.sms ?? false,
              push: prefs.push ?? true,
              meal_reminders: prefs.meal_reminders ?? true,
              health_tips: prefs.health_tips ?? true,
              family_updates: prefs.family_updates ?? true
            };
          }
          return {
            email: true,
            sms: false,
            push: true,
            meal_reminders: true,
            health_tips: true,
            family_updates: true
          };
        })()
      };

      // Final safety check: never allow "User" as full_name if we have email
      if (completeProfile.full_name === "User" && user?.email) {
        completeProfile.full_name = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      // CRITICAL: Only update if the profile is valid
      if (completeProfile.user_id === user.id) {
        setProfile(completeProfile);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        console.error('Profile user_id mismatch, not updating');
        throw new Error('Profile user_id mismatch');
      }
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