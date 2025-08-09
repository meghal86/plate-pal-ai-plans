import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { sendFamilyInviteEmail } from '@/api/resend-email';
import {
  Users,
  UserPlus,
  Baby,
  Plus,
  Mail,
  CheckCircle,
  Clock,
  X,
  Edit,
  Trash2
} from 'lucide-react';

// Use the generated types from Supabase
import type { Database } from '@/integrations/supabase/types';

type FamilyMember = Database['public']['Tables']['family_members']['Row'];
type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];
type Family = Database['public']['Tables']['families']['Row'];

const FamilyInvite: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();

  // Debug authentication only once when component mounts
  useEffect(() => {
    console.log('🔐 FamilyInvite - User authentication check:', {
      user: user,
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user?.id
    });
  }, [user?.id]); // Only log when user ID changes
  
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'spouse' | 'guardian' | 'caregiver'>('spouse');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAddKidDialog, setShowAddKidDialog] = useState(false);
  const [newKid, setNewKid] = useState({
    name: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    birth_date: '',
    height_cm: 0,
    weight_kg: 0,
    dietary_restrictions: [] as string[],
    allergies: [] as string[],
    favorite_foods: [] as string[],
    disliked_foods: [] as string[],
    preferences: {
      dietary_preferences: [] as string[],
      allergies: [] as string[],
      favorite_foods: [] as string[],
      disliked_foods: [] as string[],
      cooking_skill: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      meal_preferences: [] as string[],
      special_notes: ''
    }
  });

  // Helper to calculate age from birthdate
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper to handle array inputs (add/remove items)
  const handleArrayInput = (field: keyof typeof newKid.preferences, value: string, action: 'add' | 'remove') => {
    setNewKid(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: action === 'add' 
          ? [...prev.preferences[field] as string[], value]
          : (prev.preferences[field] as string[]).filter(item => item !== value)
      }
    }));
  };

  // Helper to add item to array
  const addToArray = (field: keyof typeof newKid.preferences) => {
    const inputId = `${field}-input`;
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input && input.value.trim()) {
      handleArrayInput(field, input.value.trim(), 'add');
      input.value = '';
    }
  };

  // Handle Enter and Tab key press for array inputs
  const handleKeyPress = (field: keyof typeof newKid.preferences, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      if (input.value.trim()) {
        handleArrayInput(field, input.value.trim(), 'add');
        input.value = '';
      }
    }
  };

  // Handle input blur (when user clicks away or tabs out)
  const handleInputBlur = (field: keyof typeof newKid.preferences, e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    if (input.value.trim()) {
      handleArrayInput(field, input.value.trim(), 'add');
      input.value = '';
    }
  };

  // Helper to remove item from array
  const removeFromArray = (field: keyof typeof newKid.preferences, item: string) => {
    handleArrayInput(field, item, 'remove');
  };

  // Reset form to initial state
  const resetForm = () => {
    setNewKid({
      name: '',
      age: 0,
      gender: 'male',
      birth_date: '',
      height_cm: 0,
      weight_kg: 0,
      dietary_restrictions: [],
      allergies: [],
      favorite_foods: [],
      disliked_foods: [],
      preferences: {
        dietary_preferences: [],
        allergies: [],
        favorite_foods: [],
        disliked_foods: [],
        cooking_skill: 'beginner',
        meal_preferences: [],
        special_notes: ''
      }
    });
  };

  // Open add kid dialog and reset form
  const openAddKidDialog = () => {
    resetForm();
    setShowAddKidDialog(true);
  };

  // Debug function to check database
  const debugKidsProfiles = async () => {
    try {
      console.log('🔍 DEBUG: Starting comprehensive kids search...');
      console.log('🔍 DEBUG: User ID:', user.id);
      console.log('🔍 DEBUG: User email:', user.email);

      // Check 1: All kids in database
      const { data: allKids, error: allKidsError } = await supabase
        .from('kids_profiles')
        .select('*');

      console.log('🔍 DEBUG: All kids in database:', allKids);
      console.log('🔍 DEBUG: All kids error:', allKidsError);

      // Check 2: Kids by user ID
      const { data: userKids, error: userKidsError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('created_by', user.id);

      console.log('🔍 DEBUG: Kids by user ID:', userKids);
      console.log('🔍 DEBUG: User kids error:', userKidsError);

      // Check 3: Kids with null family_id
      const { data: nullFamilyKids, error: nullFamilyError } = await supabase
        .from('kids_profiles')
        .select('*')
        .is('family_id', null);

      console.log('🔍 DEBUG: Kids with null family_id:', nullFamilyKids);
      console.log('🔍 DEBUG: Null family error:', nullFamilyError);

      // Check 4: Current family info
      console.log('🔍 DEBUG: Current family:', family);

      // Show results in toast
      const totalKids = allKids?.length || 0;
      const userKidsCount = userKids?.length || 0;
      const nullKidsCount = nullFamilyKids?.length || 0;

      toast({
        title: "Debug Results",
        description: `Total kids: ${totalKids}, Your kids: ${userKidsCount}, Orphaned: ${nullKidsCount}. Check console for details.`,
      });

    } catch (error) {
      console.error('❌ DEBUG ERROR:', error);
      toast({
        title: "Debug Failed",
        description: "Check console for error details.",
        variant: "destructive",
      });
    }
  };

  // Comprehensive recovery function
  const recoverAllFamilyData = async () => {
    try {
      console.log('🚨 COMPREHENSIVE RECOVERY: Starting full recovery...');

      // Step 1: Find or create family
      let currentFamily = family;
      if (!currentFamily) {
        console.log('🏗️ Creating family for recovery...');
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${user.email?.split('@')[0]}'s Family`,
            created_by: user.id
          })
          .select()
          .single();

        if (familyError) {
          console.error('❌ Error creating family:', familyError);
          throw familyError;
        }

        currentFamily = newFamily;
        setFamily(newFamily);
        console.log('✅ Family created:', currentFamily.id);
      }

      // Step 2: Add user as family member if not exists
      console.log('👥 Adding user as family member...');
      const { error: memberError } = await supabase
        .from('family_members')
        .upsert({
          family_id: currentFamily.id,
          user_id: user.id,
          role: 'parent',
          status: 'accepted',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString()
        }, {
          onConflict: 'family_id,user_id'
        });

      if (memberError) {
        console.error('❌ Error adding family member:', memberError);
      } else {
        console.log('✅ User added as family member');
      }

      // Step 3: Find and recover kids
      console.log('👶 Searching for kids to recover...');
      const { data: allKids } = await supabase
        .from('kids_profiles')
        .select('*')
        .or(`created_by.eq.${user.id},family_id.is.null`);

      console.log('👶 Found kids:', allKids);

      if (allKids && allKids.length > 0) {
        // Link kids to family
        const { error: kidsError } = await supabase
          .from('kids_profiles')
          .update({
            family_id: currentFamily.id,
            created_by: user.id
          })
          .in('id', allKids.map(kid => kid.id));

        if (kidsError) {
          console.error('❌ Error updating kids:', kidsError);
        } else {
          console.log('✅ Kids linked to family');
          setKidsProfiles(allKids);
        }
      }

      // Step 4: Reload all data
      await loadFamilyData();

      toast({
        title: "Family Data Recovered! 🎉",
        description: `Successfully recovered family with ${allKids?.length || 0} kids.`,
      });

    } catch (error) {
      console.error('❌ Comprehensive recovery error:', error);
      toast({
        title: "Recovery Failed",
        description: "Failed to recover family data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Manual recovery function (legacy)
  const recoverKidsProfiles = async () => {
    await recoverAllFamilyData();
  };

  // Load family data
  useEffect(() => {
    if (user?.id) {
      loadFamilyData();
    }
  }, [user?.id]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading family data for user:', user?.id);
      console.log('🔍 User object:', user);
      console.log('🔍 User email:', user?.email);
      console.log('🔍 User created at:', user?.created_at);

      if (!user?.id) {
        console.log('❌ No user ID found');
        return;
      }

      // 🚨 EMERGENCY RECOVERY: Check for ALL kids that might belong to this user
      console.log('🚨 EMERGENCY RECOVERY: Comprehensive kids search...');
      console.log('🚨 User email:', user.email);

      // Search 1: By user ID
      const { data: kidsByUserId } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('created_by', user.id);

      // Search 2: By null family_id
      const { data: orphanedKids } = await supabase
        .from('kids_profiles')
        .select('*')
        .is('family_id', null);

      // Search 3: ALL kids (to see what exists)
      const { data: allKids } = await supabase
        .from('kids_profiles')
        .select('*');

      console.log('🚨 Kids by user ID:', kidsByUserId);
      console.log('🚨 Orphaned kids:', orphanedKids);
      console.log('🚨 ALL kids in database:', allKids);

      // Combine all potential kids
      const potentialKids = [
        ...(kidsByUserId || []),
        ...(orphanedKids || [])
      ].filter((kid, index, self) =>
        index === self.findIndex(k => k.id === kid.id)
      ); // Remove duplicates

      console.log('🚨 Potential kids to recover:', potentialKids);

      if (potentialKids && potentialKids.length > 0) {
        console.log('✅ EMERGENCY: Found existing kids, will restore them!');
      }
      
      // Get user's family
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user?.id)
        .single();

      console.log('🔍 User profile result:', { userProfile, userProfileError });

      let familyData = null;

      if (userProfile?.family_id) {
        // Get family details from user profile
        const { data: profileFamily } = await supabase
          .from('families')
          .select('*')
          .eq('id', userProfile.family_id)
          .single();

        familyData = profileFamily;
      } else {
        // Check if user has created any families
        const { data: createdFamilies } = await supabase
          .from('families')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (createdFamilies && createdFamilies.length > 0) {
          familyData = createdFamilies[0];

          // Update user profile with the family_id
          await supabase
            .from('user_profiles')
            .update({ family_id: familyData.id })
            .eq('user_id', user.id);
        }
      }

      if (familyData) {
        setFamily(familyData);
        console.log('✅ Family loaded:', familyData);

        // Get family members
        console.log('👥 Loading family members for family:', familyData.id);
        const { data: members, error: membersError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyData.id);

        console.log('👥 Family members result:', { members, membersError });

        if (membersError) {
          console.error('❌ Error loading family members:', membersError);
        } else if (members) {
          setFamilyMembers(members);
          console.log('✅ Family members loaded:', members.length);
        } else {
          // Check if user should be added as family member
          console.log('🔍 No family members found, checking if user should be added...');

          // Add current user as family member if not exists
          const { error: addMemberError } = await supabase
            .from('family_members')
            .insert({
              family_id: familyData.id,
              user_id: user.id,
              role: 'parent',
              status: 'accepted',
              invited_by: user.id,
              invited_at: new Date().toISOString(),
              accepted_at: new Date().toISOString()
            });

          if (addMemberError) {
            console.error('❌ Error adding user as family member:', addMemberError);
          } else {
            console.log('✅ Added user as family member');
            // Reload family members
            const { data: updatedMembers } = await supabase
              .from('family_members')
              .select('*')
              .eq('family_id', familyData.id);

            if (updatedMembers) {
              setFamilyMembers(updatedMembers);
              console.log('✅ Family members reloaded:', updatedMembers.length);
            }
          }
        }

        // Get kids profiles
        console.log('👶 Loading kids profiles for family:', familyData.id);
        const { data: kids, error: kidsError } = await supabase
          .from('kids_profiles')
          .select('*')
          .eq('family_id', familyData.id);

        console.log('👶 Kids profiles result:', { kids, kidsError });

        if (kidsError) {
          console.error('❌ Error loading kids profiles:', kidsError);
        } else if (kids && kids.length > 0) {
          setKidsProfiles(kids);
          console.log('✅ Kids profiles loaded:', kids.length);
        } else {
          // EMERGENCY RECOVERY: Use the potential kids we found earlier
          console.log('🔍 No kids found for family, using emergency recovery...');

          if (potentialKids && potentialKids.length > 0) {
            console.log('🔧 EMERGENCY RECOVERY: Restoring potential kids...');
            console.log('🔧 Kids to restore:', potentialKids);

            // Update kids to link to current family
            const { error: updateError } = await supabase
              .from('kids_profiles')
              .update({
                family_id: familyData.id,
                created_by: user.id // Ensure ownership
              })
              .in('id', potentialKids.map(kid => kid.id));

            if (updateError) {
              console.error('❌ Error updating kids family_id:', updateError);
            } else {
              console.log('✅ EMERGENCY RECOVERY: Kids family_id updated successfully');
            }

            setKidsProfiles(potentialKids);
            console.log('✅ EMERGENCY RECOVERY: Kids profiles restored:', potentialKids.length);

            toast({
              title: "Kids Profiles Recovered! 🎉",
              description: `Emergency recovery found and restored ${potentialKids.length} kids profile(s).`,
            });
          } else {
            console.log('❌ EMERGENCY RECOVERY: No kids found anywhere');

            // Show all kids for debugging
            if (allKids && allKids.length > 0) {
              console.log('🔍 DEBUG: All kids in database:', allKids);
              toast({
                title: "Debug Info",
                description: `Found ${allKids.length} total kids in database. Check console for details.`,
              });
            }
          }
        }
      } else {
        console.log('ℹ️ No family found for user');
        setFamily(null);
        setFamilyMembers([]);
        setKidsProfiles([]);
      }
      
    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: "Error",
        description: "Failed to load family data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail || !user?.id) return;

    try {
      // For now, we'll allow inviting any email address
      // In a production app, you might want to implement email verification
      // or use a different method to check if the user exists
      
      // SIMPLE APPROACH: Just create a family directly for the invitation
      console.log('🏗️ Creating family directly for invitation...');

      const { data: inviteFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          name: `${user.email?.split('@')[0]}'s Family - ${Date.now()}`,
          created_by: user.id
        })
        .select()
        .single();

      if (familyError || !inviteFamily) {
        console.error('❌ Failed to create family:', familyError);
        throw new Error('Failed to create family for invitation');
      }

      const familyId = inviteFamily.id;
      console.log('✅ Family created for invitation:', familyId);

      // Generate invite link
      const inviteToken = crypto.randomUUID();
      const inviteLink = `${window.location.origin}/family-invite?family=${familyId}&email=${encodeURIComponent(inviteEmail)}&token=${inviteToken}`;

      // Get user profile for inviter name
      const { data: inviterProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Inviter profile data:', inviterProfile);

      // Build inviter name from available data
      let inviterName = 'Someone';
      if (inviterProfile?.full_name && inviterProfile.full_name.trim()) {
        inviterName = inviterProfile.full_name.trim();
      } else if (user.email) {
        // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
        const emailName = user.email.split('@')[0];
        inviterName = emailName
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }

      console.log('👤 Final inviter name:', inviterName);
      // Generate family name
      let familyName = family?.name;
      if (!familyName) {
        if (inviterProfile?.full_name && inviterProfile.full_name.trim()) {
          const firstName = inviterProfile.full_name.trim().split(' ')[0];
          familyName = `${firstName}'s Family`;
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          const first = emailName.split(/[._-]/)[0];
          familyName = `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()}'s Family`;
        } else {
          familyName = 'Family';
        }
      }

      console.log('🏠 Family name for invitation:', familyName);

      // Send email invitation
      console.log('📧 Sending family invitation email...');
      const emailResult = await sendFamilyInviteEmail({
        inviterName,
        inviterEmail: user.email || '',
        familyName,
        inviteEmail,
        role: inviteRole,
        inviteLink
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Validate familyId before creating invitation
      if (!familyId) {
        console.error('❌ No family ID available for invitation');
        throw new Error('No family found. Please create a family first.');
      }

      // SKIP DATABASE STORAGE FOR NOW - just send email
      console.log('📝 Skipping database storage - sending email only');
      console.log('📋 Invitation details:', {
        familyId,
        inviteEmail,
        inviteRole,
        inviteToken,
        inviteLink
      });

      toast({
        title: "Invitation Sent! 📧",
        description: `Email invitation sent to ${inviteEmail}. They will receive an email to join your family.`,
      });

      setInviteEmail('');
      setShowInviteDialog(false);

      // Reload family data
      await loadFamilyData();
      
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const addKid = async () => {
    if (!newKid.name || !user?.id) return;

    console.log('🚀 Starting addKid function');
    console.log('👤 User:', user);
    console.log('👶 New kid data:', newKid);

    try {
      // Get or create family for current user
      let familyId = family?.id;
      console.log('🏠 Current family ID:', familyId);
      
      if (!familyId) {
        console.log('🏠 Creating new family...');
        // Create a new family
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${user.email}'s Family`,
            created_by: user.id
          })
          .select()
          .single();

        console.log('🏠 Family creation result:', { newFamily, familyError });

        if (familyError) throw familyError;
        familyId = newFamily.id;
        setFamily(newFamily);

        console.log('👥 Adding user as family member...');
        // Add user as a family member with 'accepted' status
        const { error: memberError } = await supabase
          .from('family_members')
          .insert({
            family_id: familyId,
            user_id: user.id,
            role: 'parent',
            status: 'accepted',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString()
          });

        console.log('👥 Member creation result:', { memberError });

        if (memberError) throw memberError;

        // Update user profile with family_id
        await supabase
          .from('user_profiles')
          .update({ family_id: familyId })
          .eq('user_id', user.id);
      }

      console.log('👶 Creating kid profile...');
      // Add kid profile
      const { data: newKidProfile, error: kidError } = await supabase
        .from('kids_profiles')
        .insert({
          family_id: familyId,
          name: newKid.name,
          age: calculateAge(newKid.birth_date), // Use calculated age
          gender: newKid.gender,
          birth_date: newKid.birth_date || null,
          height_cm: newKid.height_cm || null,
          weight_kg: newKid.weight_kg || null,
          dietary_restrictions: newKid.preferences.dietary_preferences,
          allergies: newKid.preferences.allergies,
          favorite_foods: newKid.preferences.favorite_foods,
          disliked_foods: newKid.preferences.disliked_foods,
          created_by: user.id,
          preferences: newKid.preferences // Save structured preferences
        })
        .select()
        .single();

      console.log('👶 Kid creation result:', { newKidProfile, kidError });

      if (kidError) throw kidError;

      toast({
        title: "Kid Profile Added",
        description: `Added ${newKid.name} to your family`,
      });
      
      resetForm();
      setShowAddKidDialog(false);
      
      // Reload family data
      await loadFamilyData();
      
    } catch (error) {
      console.error('❌ Error adding kid:', error);
      console.error('❌ Error details:', {
        error,
        newKid,
        familyId: family?.id,
        userId: user?.id
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add kid",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Family & Kids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Family Members
          </CardTitle>
          <CardDescription>
            Invite family members to share access to kids profiles, meal plans, dietary preferences, and all family data. Each member gets their own login with full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Invite Button */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Family Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Family Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your family. They'll get their own login with access to:
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Kids' nutrition profiles and dietary preferences</li>
                      <li>• Shared meal plans and recipes</li>
                      <li>• Family shopping lists</li>
                      <li>• Health tracking and progress reports</li>
                      <li>• All family data and settings</li>
                    </ul>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="family@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={sendInvite} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Family Members List */}
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Family Member</div>
                      <div className="text-sm text-gray-600 capitalize">{member.role}</div>
                    </div>
                  </div>
                  {getStatusBadge(member.status)}
                </div>
              ))}
              
              {familyMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No family members yet</p>
                  <p className="text-sm">Invite your spouse or family members to get started</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kids Profiles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-500" />
            Kids Profiles
          </CardTitle>
          <CardDescription>
            Manage your kids' profiles and nutritional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Kid Button */}
            <Button variant="outline" className="w-full sm:w-auto" onClick={openAddKidDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Kid Profile
            </Button>
            
            <Dialog open={showAddKidDialog} onOpenChange={(open) => {
              setShowAddKidDialog(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl w-[95vw] sm:w-auto mx-auto sm:mx-0">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-xl sm:text-lg">Add Kid Profile</DialogTitle>
                  <DialogDescription className="text-sm">
                    Create a profile for your child to track their nutrition and growth
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 sm:space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
                      <Input
                        id="name"
                        value={newKid.name}
                        onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                        placeholder="Child's name"
                        className="h-10 sm:h-9"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-sm sm:text-base">Gender</Label>
                        <Select value={newKid.gender} onValueChange={(value: any) => setNewKid({ ...newKid, gender: value })}>
                          <SelectTrigger className="h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="birth_date" className="text-sm sm:text-base">Birth Date</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={newKid.birth_date}
                          onChange={(e) => {
                            const birth_date = e.target.value;
                            setNewKid({
                              ...newKid,
                              birth_date,
                              age: calculateAge(birth_date)
                            });
                          }}
                          className="h-10 sm:h-9"
                        />
                        {newKid.birth_date && (
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            Age: <span className="font-semibold">{calculateAge(newKid.birth_date)}</span> years
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Preferences & Dietary Information</h3>
                    
                    {/* Dietary Preferences */}
                    <div>
                      <Label className="text-sm sm:text-base">Dietary Preferences</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'].map(pref => (
                          <label key={pref} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={newKid.preferences.dietary_preferences.includes(pref)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleArrayInput('dietary_preferences', pref, 'add');
                                } else {
                                  removeFromArray('dietary_preferences', pref);
                                }
                              }}
                              className="rounded h-4 w-4"
                            />
                            <span className="text-sm">{pref}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Allergies and Foods - Stack on mobile */}
                    <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      {/* Allergies */}
                      <div>
                        <Label className="text-sm sm:text-base">Allergies</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="allergies-input"
                            placeholder="Type allergy and press Enter/Tab (e.g., Peanuts)"
                            className="flex-1 h-10 sm:h-9"
                            onKeyPress={(e) => handleKeyPress('allergies', e)}
                            onBlur={(e) => handleInputBlur('allergies', e)}
                          />
                          <Button 
                            type="button" 
                            onClick={() => addToArray('allergies')} 
                            size="sm" 
                            className="h-10 sm:h-9 px-3 sm:hidden"
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                        {newKid.preferences.allergies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {newKid.preferences.allergies.map(allergy => (
                              <Badge key={allergy} variant="secondary" className="cursor-pointer text-xs px-2 py-1" onClick={() => removeFromArray('allergies', allergy)}>
                                {allergy} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Favorite Foods */}
                      <div>
                        <Label className="text-sm sm:text-base">Favorite Foods</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="favorite_foods-input"
                            placeholder="Type favorite food and press Enter/Tab (e.g., Pizza)"
                            className="flex-1 h-10 sm:h-9"
                            onKeyPress={(e) => handleKeyPress('favorite_foods', e)}
                            onBlur={(e) => handleInputBlur('favorite_foods', e)}
                          />
                          <Button 
                            type="button" 
                            onClick={() => addToArray('favorite_foods')} 
                            size="sm" 
                            className="h-10 sm:h-9 px-3 sm:hidden"
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                        {newKid.preferences.favorite_foods.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {newKid.preferences.favorite_foods.map(food => (
                              <Badge key={food} variant="outline" className="cursor-pointer text-xs px-2 py-1" onClick={() => removeFromArray('favorite_foods', food)}>
                                {food} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Disliked Foods */}
                    <div>
                      <Label className="text-sm sm:text-base">Disliked Foods</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="disliked_foods-input"
                          placeholder="Type disliked food and press Enter/Tab (e.g., Broccoli)"
                          className="flex-1 h-10 sm:h-9"
                          onKeyPress={(e) => handleKeyPress('disliked_foods', e)}
                          onBlur={(e) => handleInputBlur('disliked_foods', e)}
                        />
                        <Button 
                          type="button" 
                          onClick={() => addToArray('disliked_foods')} 
                          size="sm" 
                          className="h-10 sm:h-9 px-3 sm:hidden"
                          variant="outline"
                        >
                          Add
                        </Button>
                      </div>
                      {newKid.preferences.disliked_foods.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newKid.preferences.disliked_foods.map(food => (
                            <Badge key={food} variant="destructive" className="cursor-pointer text-xs px-2 py-1" onClick={() => removeFromArray('disliked_foods', food)}>
                              {food} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cooking Skill and Meal Preferences - Stack on mobile */}
                    <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      {/* Cooking Skill Level */}
                      <div>
                        <Label className="text-sm sm:text-base">Cooking Skill Level</Label>
                        <Select 
                          value={newKid.preferences.cooking_skill} 
                          onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                            setNewKid(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, cooking_skill: value }
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (needs help)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (some independence)</SelectItem>
                            <SelectItem value="advanced">Advanced (can cook independently)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Meal Preferences */}
                      <div>
                        <Label className="text-sm sm:text-base">Meal Preferences</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
                            <label key={meal} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={newKid.preferences.meal_preferences.includes(meal)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleArrayInput('meal_preferences', meal, 'add');
                                  } else {
                                    removeFromArray('meal_preferences', meal);
                                  }
                                }}
                                className="rounded h-4 w-4"
                              />
                              <span className="text-sm">{meal}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Special Notes */}
                    <div>
                      <Label className="text-sm sm:text-base">Special Notes</Label>
                      <textarea
                        className="w-full border rounded-md p-3 min-h-[80px] sm:min-h-[60px] mt-2 text-sm"
                        placeholder="Any additional notes about food preferences, cooking habits, or special requirements..."
                        value={newKid.preferences.special_notes}
                        onChange={(e) => setNewKid(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, special_notes: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddKidDialog(false)}
                      className="flex-1 h-12 sm:h-9"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={addKid} 
                      className="flex-1 h-12 sm:h-9"
                      disabled={!newKid.name || !newKid.birth_date}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Kid Profile
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Kids List */}
            <div className="space-y-3">
              {kidsProfiles.map((kid) => (
                <div key={kid.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Baby className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <div className="font-medium">{kid.name}</div>
                      <div className="text-sm text-gray-600">
                        {kid.age} years old • {kid.gender}
                      </div>
                      {kid.preferences && typeof kid.preferences === 'object' && !Array.isArray(kid.preferences) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {kid.preferences.dietary_preferences && Array.isArray(kid.preferences.dietary_preferences) && kid.preferences.dietary_preferences.length > 0 && (
                            <span className="mr-2">Diet: {kid.preferences.dietary_preferences.join(', ')}</span>
                          )}
                          {kid.preferences.cooking_skill && typeof kid.preferences.cooking_skill === 'string' && (
                            <span className="mr-2">• Skill: {kid.preferences.cooking_skill}</span>
                          )}
                          {kid.preferences.special_notes && typeof kid.preferences.special_notes === 'string' && kid.preferences.special_notes.length > 0 && (
                            <span>• Notes: {kid.preferences.special_notes.substring(0, 50)}...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {kidsProfiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Baby className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No kids profiles found</p>
                  <p className="text-sm">Add your kids to start tracking their nutrition and growth</p>

                  {/* Recovery Buttons */}
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      onClick={recoverAllFamilyData}
                      className="text-sm mr-2"
                    >
                      🔧 Recover All Family Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={debugKidsProfiles}
                      className="text-sm"
                    >
                      🔍 Debug Kids Database
                    </Button>
                    <p className="text-xs text-gray-400 mt-1">
                      Click if you had kids profiles before
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInvite; 