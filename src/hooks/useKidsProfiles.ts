import { useState, useEffect } from 'react';
import { kidsProfileService, type KidsProfile } from '@/services/kids-profile-service';
import { EmergencyKidsService } from '@/services/emergency-kids-service';
import { supabase } from '@/integrations/supabase/client';

export interface UseKidsProfilesResult {
  kidsProfiles: KidsProfile[];
  selectedKid: KidsProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  selectKid: (kid: KidsProfile | null) => void;
  createKid: (kidData: Omit<KidsProfile, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateKid: (kidId: string, kidData: Partial<KidsProfile>) => Promise<boolean>;
  deleteKid: (kidId: string) => Promise<boolean>;
  hasKids: boolean;
}

export const useKidsProfiles = (): UseKidsProfilesResult => {
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKidsProfiles = async () => {
    try {
      console.log('�  EMERGENCY: Starting to fetch kids profiles...');
      setLoading(true);
      setError(null);

      // Try emergency service first
      console.log('� EMdERGENCY: Using emergency kids service...');
      const emergencyResult = await EmergencyKidsService.getKidsForUser();
      console.log('🚨 EMERGENCY: Emergency result:', emergencyResult);
      
      if (emergencyResult.success && Array.isArray(emergencyResult.data)) {
        console.log(`✅ EMERGENCY: Successfully loaded ${emergencyResult.data.length} kids profiles`);
        setKidsProfiles(emergencyResult.data);
        
        // Auto-select first kid if no kid is selected and kids exist
        if (emergencyResult.data.length > 0 && !selectedKid) {
          setSelectedKid(emergencyResult.data[0]);
          console.log('👶 EMERGENCY: Auto-selected first kid:', emergencyResult.data[0].name);
        }
        
        // Clear selected kid if it no longer exists
        if (selectedKid && !emergencyResult.data.find(kid => kid.id === selectedKid.id)) {
          setSelectedKid(emergencyResult.data.length > 0 ? emergencyResult.data[0] : null);
          console.log('🔄 EMERGENCY: Updated selected kid');
        }
        
        return; // Success with emergency service
      }

      // Fallback to original service if emergency fails
      console.log('⚠️ EMERGENCY: Emergency service failed, trying original service...');
      const result = await kidsProfileService.getKidsProfiles();
      console.log('📊 Original service result:', result);
      
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ Successfully loaded ${result.data.length} kids profiles via original service`);
        setKidsProfiles(result.data);
        
        // Auto-select first kid if no kid is selected and kids exist
        if (result.data.length > 0 && !selectedKid) {
          setSelectedKid(result.data[0]);
          console.log('👶 Auto-selected first kid:', result.data[0].name);
        }
        
        // Clear selected kid if it no longer exists
        if (selectedKid && !result.data.find(kid => kid.id === selectedKid.id)) {
          setSelectedKid(result.data.length > 0 ? result.data[0] : null);
          console.log('🔄 Updated selected kid');
        }
      } else {
        console.error('❌ Both services failed. Emergency error:', emergencyResult.error, 'Original error:', result.error);
        setError(`Both services failed. Emergency: ${emergencyResult.error}, Original: ${result.error}`);
        setKidsProfiles([]);
        setSelectedKid(null);
      }
    } catch (err) {
      console.error('💥 Unexpected error in useKidsProfiles:', err);
      setError('Unexpected error occurred');
      setKidsProfiles([]);
      setSelectedKid(null);
    } finally {
      console.log('🏁 Finished fetching kids profiles, setting loading to false');
      setLoading(false);
    }
  };

  const selectKid = (kid: KidsProfile | null) => {
    setSelectedKid(kid);
  };

  const createKid = async (kidData: Omit<KidsProfile, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const result = await kidsProfileService.createKidsProfile(kidData);
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        // Add the new kid to the list
        const newKid = result.data as KidsProfile;
        setKidsProfiles(prev => [...prev, newKid]);
        
        // Select the new kid
        setSelectedKid(newKid);
        
        return true;
      } else {
        setError(result.error || 'Failed to create kid profile');
        return false;
      }
    } catch (err) {
      console.error('Error creating kid:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  const updateKid = async (kidId: string, kidData: Partial<KidsProfile>): Promise<boolean> => {
    try {
      const result = await kidsProfileService.updateKidsProfile(kidId, kidData);
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        const updatedKid = result.data as KidsProfile;
        
        // Update the kid in the list
        setKidsProfiles(prev => 
          prev.map(kid => kid.id === kidId ? updatedKid : kid)
        );
        
        // Update selected kid if it's the one being updated
        if (selectedKid?.id === kidId) {
          setSelectedKid(updatedKid);
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to update kid profile');
        return false;
      }
    } catch (err) {
      console.error('Error updating kid:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  const deleteKid = async (kidId: string): Promise<boolean> => {
    try {
      const result = await kidsProfileService.deleteKidsProfile(kidId);
      
      if (result.success) {
        // Remove the kid from the list
        setKidsProfiles(prev => prev.filter(kid => kid.id !== kidId));
        
        // Clear selected kid if it's the one being deleted
        if (selectedKid?.id === kidId) {
          const remainingKids = kidsProfiles.filter(kid => kid.id !== kidId);
          setSelectedKid(remainingKids.length > 0 ? remainingKids[0] : null);
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to delete kid profile');
        return false;
      }
    } catch (err) {
      console.error('Error deleting kid:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  const refetch = async () => {
    await fetchKidsProfiles();
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeKidsProfiles = async () => {
      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.warn('⏰ Kids profiles loading timeout, setting loading to false');
          setLoading(false);
          setError('Loading timeout - please try refreshing the page');
        }
      }, 10000); // 10 second timeout

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('🔐 No session found, setting loading to false');
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      if (mounted) {
        await fetchKidsProfiles();
        clearTimeout(timeoutId);
      }
    };

    initializeKidsProfiles();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        // User signed in, fetch kids profiles
        await fetchKidsProfiles();
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear profiles
        setKidsProfiles([]);
        setSelectedKid(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return {
    kidsProfiles,
    selectedKid,
    loading,
    error,
    refetch,
    selectKid,
    createKid,
    updateKid,
    deleteKid,
    hasKids: kidsProfiles.length > 0
  };
};