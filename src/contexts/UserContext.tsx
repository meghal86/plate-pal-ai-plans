import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  dashboard: {
    default_view: 'kids' | 'adult';
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    meal_reminders: boolean;
    health_tips: boolean;
    family_updates: boolean;
    reminder_times: {
      breakfast: string;
      lunch: string;
      dinner: string;
    };
  };
  health: {
    units: {
      weight: 'kg' | 'lbs';
      height: 'cm' | 'ft';
      temperature: 'celsius' | 'fahrenheit';
    };
    goals: {
      daily_calories: number | null;
      daily_water: number | null;
      weekly_exercise: number | null;
    };
    tracking: {
      auto_log_meals: boolean;
      sync_fitness_apps: boolean;
      share_with_family: boolean;
    };
  };
  privacy: {
    profile_visibility: 'public' | 'family' | 'private';
    data_sharing: boolean;
    analytics: boolean;
  };
}

interface UserProfile {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  health_goals: string | null;
  dietary_restrictions: string | null;
  family_id?: string | null;
  preferences: UserPreferences | null;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (section: keyof UserPreferences, updates: any) => Promise<void>;
  getPreference: <T>(section: keyof UserPreferences, key: string, defaultValue: T) => T;
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

  // Helper function to create default preferences
  const createDefaultPreferences = (): UserPreferences => {
    return {
      dashboard: {
        default_view: 'kids',
        theme: 'light',
        language: 'en'
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
        meal_reminders: true,
        health_tips: true,
        family_updates: true,
        reminder_times: {
          breakfast: '08:00',
          lunch: '12:00',
          dinner: '18:00'
        }
      },
      health: {
        units: {
          weight: 'kg',
          height: 'cm',
          temperature: 'celsius'
        },
        goals: {
          daily_calories: null,
          daily_water: null,
          weekly_exercise: null
        },
        tracking: {
          auto_log_meals: false,
          sync_fitness_apps: false,
          share_with_family: true
        }
      },
      privacy: {
        profile_visibility: 'family',
        data_sharing: false,
        analytics: true
      }
    };
  };

  // Helper function to merge preferences with defaults
  const mergeWithDefaults = (preferences: any): UserPreferences => {
    const defaults = createDefaultPreferences();
    
    if (!preferences || typeof preferences !== 'object') {
      return defaults;
    }

    return {
      dashboard: {
        ...defaults.dashboard,
        ...preferences.dashboard
      },
      notifications: {
        ...defaults.notifications,
        ...preferences.notifications,
        reminder_times: {
          ...defaults.notifications.reminder_times,
          ...preferences.notifications?.reminder_times
        }
      },
      health: {
        units: {
          ...defaults.health.units,
          ...preferences.health?.units
        },
        goals: {
          ...defaults.health.goals,
          ...preferences.health?.goals
        },
        tracking: {
          ...defaults.health.tracking,
          ...preferences.health?.tracking
        }
      },
      privacy: {
        ...defaults.privacy,
        ...preferences.privacy
      }
    };
  };

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
      age: null,
      weight: null,
      height: null,
      activity_level: 'moderate',
      health_goals: 'General health',
      dietary_restrictions: 'None',
      family_id: null,
      preferences: createDefaultPreferences()
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
        let preferences = null;
        
        // Try to get preferences from database, fallback to localStorage if column doesn't exist
        if (profileData.preferences) {
          preferences = mergeWithDefaults(profileData.preferences);
        } else {
          // Check localStorage for preferences
          try {
            const storedPrefs = localStorage.getItem('user_preferences');
            if (storedPrefs) {
              preferences = mergeWithDefaults(JSON.parse(storedPrefs));
            } else {
              preferences = createDefaultPreferences();
            }
          } catch {
            preferences = createDefaultPreferences();
          }
        }

        const completeProfile: UserProfile = {
          ...profileData,
          full_name: profileData.full_name || 'User', // Preserve existing name from database
          phone_number: profileData.phone_number || null,
          preferences: preferences
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
            .insert([{ ...newProfileData, preferences: null as any }]);
          
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

  // New method to update specific preference sections
  const updatePreferences = async (section: keyof UserPreferences, updates: any) => {
    if (!user?.id || !profile) {
      throw new Error('No user or profile found');
    }

    try {
      const currentPreferences = profile.preferences || createDefaultPreferences();
      const updatedPreferences = {
        ...currentPreferences,
        [section]: {
          ...currentPreferences[section],
          ...updates
        }
      };

      // Try to update database, but handle gracefully if preferences column doesn't exist
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ preferences: updatedPreferences })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          // Check if it's a column not found error
          if (error.message?.includes("preferences") && error.message?.includes("schema cache")) {
            console.warn('Preferences column not found in database, using localStorage fallback');
            throw new Error('PREFERENCES_COLUMN_NOT_FOUND');
          }
          throw error;
        }

        // Update local state with database response
        const updatedProfile = {
          ...profile,
          preferences: mergeWithDefaults(data.preferences)
        };
        setProfile(updatedProfile);

      } catch (dbError: any) {
        if (dbError.message === 'PREFERENCES_COLUMN_NOT_FOUND') {
          // Fallback: Update local state and localStorage
          console.log('Using localStorage fallback for preferences');
          const updatedProfile = {
            ...profile,
            preferences: updatedPreferences
          };
          setProfile(updatedProfile);
          
          // Store in localStorage as backup
          localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
        } else {
          throw dbError;
        }
      }

      // Also update localStorage for immediate effect
      if (section === 'dashboard' && updates.default_view) {
        localStorage.setItem('dashboard_preference', updates.default_view);
      }

      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update preferences",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Helper method to get specific preference values with defaults
  const getPreference = <T,>(section: keyof UserPreferences, key: string, defaultValue: T): T => {
    if (!profile?.preferences) {
      return defaultValue;
    }

    const sectionData = profile.preferences[section] as any;
    if (!sectionData || typeof sectionData !== 'object') {
      return defaultValue;
    }

    // Handle nested keys like 'units.weight'
    const keys = key.split('.');
    let value = sectionData;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
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

      const updatesToSend: any = { ...updates };
      if ('preferences' in updatesToSend) {
        // Preferences should be updated via updatePreferences to ensure JSON compatibility
        delete updatesToSend.preferences;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updatesToSend)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure the updated profile includes all required fields
      let preferences = null;
      
      // Handle preferences gracefully
      if (data.preferences) {
        preferences = mergeWithDefaults(data.preferences);
      } else if (profile?.preferences) {
        // Keep existing preferences if database doesn't have them
        preferences = profile.preferences;
      } else {
        // Try localStorage fallback
        try {
          const storedPrefs = localStorage.getItem('user_preferences');
          if (storedPrefs) {
            preferences = mergeWithDefaults(JSON.parse(storedPrefs));
          } else {
            preferences = createDefaultPreferences();
          }
        } catch {
          preferences = createDefaultPreferences();
        }
      }

      const completeProfile: UserProfile = {
        ...data,
        full_name: data.full_name || 'User', // Preserve existing name
        phone_number: data.phone_number || null,
        preferences: preferences
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
    updateProfile,
    updatePreferences,
    getPreference
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export { useUser, UserProvider }; 