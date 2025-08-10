import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Share2, ShoppingCart, Bell, UserPlus, Copy, Mail, CheckCircle, Clock, X, Baby } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import SharedShoppingList from "@/components/SharedShoppingList";
import CookAssignment from "@/components/CookAssignment";
import Layout from "@/components/Layout";

// Make supabase available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// Use the generated types from Supabase
import type { Database } from '@/integrations/supabase/types';

type Family = Database['public']['Tables']['families']['Row'];
type FamilyMember = Database['public']['Tables']['family_members']['Row'];
type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];

interface ShoppingList {
  id: string;
  name: string;
  items: any[];
  is_shared: boolean;
  created_at: string;
}

const Family = () => {
  const { user } = useUser();
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'parent' | 'guardian' | 'caregiver'>('parent');
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadFamilyData();
    }
  }, [user?.id]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.log('❌ No user ID found');
        return;
      }

      console.log('🔍 Loading family data for user:', user.id);

      // Get user's family from user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error loading user profile:', profileError);
      } else {
        console.log('✅ User profile loaded:', userProfile);
      }

      if (userProfile?.family_id) {
        console.log('🏠 Loading family details for family_id:', userProfile.family_id);

        // Get family details
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('id', userProfile.family_id)
          .single();

        if (familyError) {
          console.error('❌ Error loading family data:', familyError);
        } else {
          console.log('✅ Family data loaded:', familyData);
        }

        if (familyData) {
          setCurrentFamily(familyData);

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

          // Load shared shopping lists (keeping the existing logic)
          const { data: shoppingData } = await supabase
            .from('shopping_lists')
            .select('*')
            .eq('family_id', userProfile.family_id);

          if (shoppingData) {
            const normalizedShoppingData = shoppingData.map(list => ({
              ...list,
              items: Array.isArray(list.items) ? list.items : []
            }));
            setShoppingLists(normalizedShoppingData);
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

  const createFamily = async () => {
    if (!newFamilyName.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please enter a family name",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🏗️ Creating family with name:', newFamilyName, 'for user:', user.id);

      // Create a new family
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          name: newFamilyName,
          created_by: user.id
        })
        .select()
        .single();

      if (familyError) {
        console.error('❌ Error creating family:', familyError);
        throw familyError;
      }

      console.log('✅ Family created successfully:', newFamily);

      // Add user as a family member with 'accepted' status
      await supabase
        .from('family_members')
        .insert({
          family_id: newFamily.id,
          user_id: user.id,
          role: 'parent',
          status: 'accepted',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString()
        });

      // Update user profile with family_id
      await supabase
        .from('user_profiles')
        .update({ family_id: newFamily.id })
        .eq('user_id', user.id);

      setCurrentFamily(newFamily);
      setNewFamilyName("");
      toast({
        title: "Success",
        description: "Family created successfully!",
      });
      
      loadFamilyData();
    } catch (error) {
      console.error('Error creating family:', error);
      toast({
        title: "Error",
        description: "Failed to create family",
        variant: "destructive",
      });
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail || !user?.id) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get or create family for current user
      let familyId = currentFamily?.id;
      if (!familyId) {
        // Create a new family first
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
        setCurrentFamily(newFamily);

        // Add user as a family member
        await supabase
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

        // Update user profile with family_id
        await supabase
          .from('user_profiles')
          .update({ family_id: familyId })
          .eq('user_id', user.id);
      }

      // Create invitation record (for demo purposes)
      // In a real app, you'd send an email invitation
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}. They will receive an email to join your family.`,
      });
      
      setInviteEmail('');
      setInviteRole('parent');
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

  const joinFamily = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    try {
      // For demo purposes, we'll simulate joining a family
      // In a real app, you'd look up the invite code and add the user to the family
      toast({
        title: "Success",
        description: "Successfully joined the family!",
      });
      
      setInviteCode("");
      loadFamilyData();
    } catch (error) {
      console.error('Error joining family:', error);
      toast({
        title: "Error",
        description: "Failed to join family",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = () => {
    if (currentFamily?.id) {
      // Generate a simple invite code based on family ID
      const inviteCode = `FAMILY-${currentFamily.id.slice(0, 8).toUpperCase()}`;
      navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const createShoppingList = async () => {
    if (!currentFamily || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          family_id: currentFamily.id,
          user_id: user.id,
          name: `Shopping List - ${new Date().toLocaleDateString()}`,
          items: [],
          is_shared: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shopping list created!",
      });
      
      loadFamilyData();
    } catch (error) {
      console.error('Error creating shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to create shopping list",
        variant: "destructive",
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
      <Layout showSidebar={true}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Family & Kids</h1>
          <p className="text-gray-600">
            Manage your family members, kids profiles, shared shopping lists, and meal assignments
          </p>
        </div>

        {!currentFamily ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Family */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create a Family
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-name">Family Name</Label>
                  <Input
                    id="family-name"
                    placeholder="The Johnson Family"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                  />
                </div>
                <Button onClick={createFamily} className="w-full">
                  Create Family
                </Button>
              </CardContent>
            </Card>

            {/* Join Family */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Join a Family
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>
                <Button onClick={joinFamily} className="w-full" variant="outline">
                  Join Family
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Family Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {currentFamily.name}
                  </span>
                  <Badge variant="secondary">
                    {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
                  </Badge>

                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm text-muted-foreground">Invite Code:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">FAMILY-{currentFamily.id.slice(0, 8).toUpperCase()}</code>
                  <Button size="sm" variant="ghost" onClick={copyInviteCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Enhanced Invite Section */}
                {currentFamily?.created_by === user?.id && (
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
                            <SelectItem value="parent">Parent</SelectItem>
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
                </Dialog>)}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Family Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Family Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{member.user_id === currentFamily?.created_by ? 'Admin' : 'Family Member'}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {member.role}{member.user_id === currentFamily?.created_by ? ' (admin)' : ''}
                            </p>
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
                </CardContent>
              </Card>

              {/* Kids Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Baby className="h-5 w-5 mr-2 text-pink-500" />
                      Kids Profiles
                    </span>
                    <Link to="/profile">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Kid
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                            {kid.allergies && kid.allergies.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                Allergies: {kid.allergies.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {kidsProfiles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Baby className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No kids profiles yet</p>
                        <p className="text-sm">Add your kids to start tracking their nutrition</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shopping Lists */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Shared Shopping Lists
                  </span>
                  <Button size="sm" onClick={createShoppingList}>
                    <Plus className="h-4 w-4 mr-1" />
                    New List
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shoppingLists.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No shopping lists yet. Create one to get started!
                    </p>
                  ) : (
                    shoppingLists.map((list) => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{list.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant={list.is_shared ? 'default' : 'secondary'}>
                          {list.is_shared ? 'Shared' : 'Private'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cook Assignment */}
            <CookAssignment familyId={currentFamily.id} familyMembers={familyMembers} />

            {/* Shared Shopping List Component */}
            {shoppingLists.length > 0 && (
              <SharedShoppingList 
                familyId={currentFamily.id} 
                listId={shoppingLists[0].id} 
              />
            )}

            {/* Family Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Family Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Bell className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm">Time to start cooking dinner: Lemon-Dill Salmon! 🐟</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <ShoppingCart className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm">Sarah added "Fresh basil" to the shopping list</span>
                  </div>
                  <div className="flex items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Users className="h-4 w-4 mr-2 text-orange-600" />
                    <span className="text-sm">Mike is assigned to cook tomorrow's breakfast</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Family;