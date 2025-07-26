import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Share2, ShoppingCart, Bell, UserPlus, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SharedShoppingList from "@/components/SharedShoppingList";
import CookAssignment from "@/components/CookAssignment";
import Layout from "@/components/Layout";

interface Family {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  created_at: string;
}

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ShoppingList {
  id: string;
  name: string;
  items: any[];
  is_shared: boolean;
  created_at: string;
}

const Family = () => {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    try {
      // Get current user's family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .limit(1)
        .single();

      if (familyData) {
        setCurrentFamily(familyData);
        
        // Load family members - simplified without relations for now
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyData.id);

        if (membersData) {
          // Create mock profiles for demo purposes
          const membersWithProfiles = membersData.map(member => ({
            ...member,
            profiles: {
              full_name: member.role === 'admin' ? 'Family Admin' : 'Family Member',
              email: `user-${member.user_id.slice(0, 8)}@example.com`
            }
          }));
          setFamilyMembers(membersWithProfiles);
        }

        // Load shared shopping lists
        const { data: shoppingData, error: shoppingError } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('family_id', familyData.id);

        if (shoppingData) {
          const normalizedShoppingData = shoppingData.map(list => ({
            ...list,
            items: Array.isArray(list.items) ? list.items : []
          }));
          setShoppingLists(normalizedShoppingData);
        }
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (!newFamilyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a family name",
        variant: "destructive",
      });
      return;
    }

    try {
      const tempUserId = crypto.randomUUID(); // Replace with actual user ID when auth is implemented
      
      const { data, error } = await supabase
        .from('families')
        .insert({
          name: newFamilyName,
          creator_id: tempUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as family member
      await supabase
        .from('family_members')
        .insert({
          family_id: data.id,
          user_id: tempUserId,
          role: 'admin',
        });

      setCurrentFamily(data);
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
      // Find family by invite code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (familyError || !familyData) {
        toast({
          title: "Error",
          description: "Invalid invite code",
          variant: "destructive",
        });
        return;
      }

      const tempUserId = crypto.randomUUID(); // Replace with actual user ID when auth is implemented

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: tempUserId,
          role: 'member',
        });

      if (memberError) throw memberError;

      setCurrentFamily(familyData);
      setInviteCode("");
      toast({
        title: "Success",
        description: `Joined ${familyData.name} successfully!`,
      });
      
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
    if (currentFamily?.invite_code) {
      navigator.clipboard.writeText(currentFamily.invite_code);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const createShoppingList = async () => {
    if (!currentFamily) return;

    try {
      const tempUserId = crypto.randomUUID(); // Replace with actual user ID when auth is implemented
      
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          family_id: currentFamily.id,
          user_id: tempUserId,
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Manage your family members, shared shopping lists, and meal assignments
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Invite Code:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{currentFamily.invite_code}</code>
                  <Button size="sm" variant="ghost" onClick={copyInviteCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
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
                        <div>
                          <p className="font-medium">
                            {member.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                        </div>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
            </div>

            {/* Cook Assignment */}
            <CookAssignment familyId={currentFamily.id} familyMembers={familyMembers} />

            {/* Shared Shopping List */}
            {shoppingLists.length > 0 && (
              <SharedShoppingList 
                familyId={currentFamily.id} 
                listId={shoppingLists[0].id} 
              />
            )}

            {/* Notifications */}
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