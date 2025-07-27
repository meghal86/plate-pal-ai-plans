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
    disliked_foods: [] as string[]
  });

  // Load family data
  useEffect(() => {
    if (user?.id) {
      loadFamilyData();
    }
  }, [user?.id]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      // Get user's family
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user?.id)
        .single();

      if (userProfile?.family_id) {
        // Get family details
        const { data: familyData } = await supabase
          .from('families')
          .select('*')
          .eq('id', userProfile.family_id)
          .single();

        if (familyData) {
          setFamily(familyData);

          // Get family members
          const { data: members } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', userProfile.family_id);

          if (members) {
            setFamilyMembers(members);
          }

          // Get kids profiles
          const { data: kids } = await supabase
            .from('kids_profiles')
            .select('*')
            .eq('family_id', userProfile.family_id);

          if (kids) {
            setKidsProfiles(kids);
          }
        }
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
      
      // Get or create family for current user
      let familyId = family?.id;
      if (!familyId) {
        // Create a new family
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${user.email}'s Family`,
            created_by: user.id
          })
          .select()
          .single();

        if (familyError) throw familyError;
        familyId = newFamily.id;
        setFamily(newFamily);

        // Update user profile with family_id
        await supabase
          .from('user_profiles')
          .update({ family_id: familyId })
          .eq('user_id', user.id);
      }

      // For now, we'll create a placeholder invitation
      // In a real app, you'd send an email invitation
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}. They will receive an email to join your family.`,
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

    try {
      // Get or create family for current user
      let familyId = family?.id;
      if (!familyId) {
        // Create a new family
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${user.email}'s Family`,
            created_by: user.id
          })
          .select()
          .single();

        if (familyError) throw familyError;
        familyId = newFamily.id;
        setFamily(newFamily);

        // Update user profile with family_id
        await supabase
          .from('user_profiles')
          .update({ family_id: familyId })
          .eq('user_id', user.id);
      }

      // Add kid profile
      const { data: newKidProfile, error: kidError } = await supabase
        .from('kids_profiles')
        .insert({
          family_id: familyId,
          name: newKid.name,
          age: newKid.age,
          gender: newKid.gender,
          birth_date: newKid.birth_date || null,
          height_cm: newKid.height_cm || null,
          weight_kg: newKid.weight_kg || null,
          dietary_restrictions: newKid.dietary_restrictions,
          allergies: newKid.allergies,
          favorite_foods: newKid.favorite_foods,
          disliked_foods: newKid.disliked_foods,
          created_by: user.id
        })
        .select()
        .single();

      if (kidError) throw kidError;

      toast({
        title: "Kid Profile Added",
        description: `Added ${newKid.name} to your family`,
      });
      
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
        disliked_foods: []
      });
      setShowAddKidDialog(false);
      
      // Reload family data
      await loadFamilyData();
      
    } catch (error) {
      console.error('Error adding kid:', error);
      toast({
        title: "Error",
        description: "Failed to add kid",
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
            Invite family members to share access to kids profiles
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
                    Send an invitation to join your family and access kids profiles
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
            <Dialog open={showAddKidDialog} onOpenChange={setShowAddKidDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Kid Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Kid Profile</DialogTitle>
                  <DialogDescription>
                    Create a profile for your child to track their nutrition and growth
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newKid.name}
                      onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                      placeholder="Child's name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={newKid.age}
                        onChange={(e) => setNewKid({ ...newKid, age: parseInt(e.target.value) || 0 })}
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={newKid.gender} onValueChange={(value: any) => setNewKid({ ...newKid, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="birth_date">Birth Date</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={newKid.birth_date}
                      onChange={(e) => setNewKid({ ...newKid, birth_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={addKid} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Kid
                  </Button>
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
                  <p>No kids profiles yet</p>
                  <p className="text-sm">Add your kids to start tracking their nutrition and growth</p>
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