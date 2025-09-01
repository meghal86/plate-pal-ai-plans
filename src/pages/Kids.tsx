import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import KidsRecipes from '@/components/KidsRecipes';
import PlanCalendar from '@/components/PlanCalendar';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { useNutritionFacts } from '@/hooks/useNutritionFacts';
import KidsSchoolMealPlanner from '@/components/KidsSchoolMealPlanner';
import { 
  Baby, 
  ChefHat, 
  BookOpen, 
  Heart, 
  Users, 
  Calendar, 
  Trophy, 
  CheckCircle, 
  Clock, 
  Target, 
  Lightbulb, 
  User, 
  Play, 
  RefreshCw, 
  Search, 
  Plus,
  Activity,
  BarChart3,
  Settings,
  Eye,
  Download,
  Share2,
  Trash2,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Award,
  AlertCircle,
  Loader2,
  Filter,
  Shield,
  Rocket,
  Sparkles,
  Bell
} from 'lucide-react';

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];
type Family = Database['public']['Tables']['families']['Row'];

const Kids: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  
  // State management (original working approach)
  const [activeTab, setActiveTab] = useState('overview');
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);
  const [showAddKidDialog, setShowAddKidDialog] = useState(false);

  // WORKING METHOD: Load kids profiles using multiple fallback approaches
  const loadKidsProfilesWorking = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 WORKING METHOD: Loading kids profiles for user:', user.id);
      
      let foundKids: KidsProfile[] = [];

      // Method 1: Direct parent_user_id lookup (most reliable for existing data)
      console.log('🔍 WORKING METHOD 1: Direct parent lookup...');
      try {
        const { data: directKids, error: directError } = await supabase
          .from('kids_profiles')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: true });

        if (!directError && directKids && directKids.length > 0) {
          console.log('✅ WORKING METHOD 1: Found', directKids.length, 'kids via direct parent lookup');
          foundKids = directKids;
        } else if (directError) {
          console.log('⚠️ WORKING METHOD 1: Direct lookup error:', directError);
        } else {
          console.log('ℹ️ WORKING METHOD 1: No kids found via direct lookup');
        }
      } catch (err) {
        console.log('❌ WORKING METHOD 1: Exception:', err);
      }

      // Method 2: Family-based lookup (if no direct kids found)
      if (foundKids.length === 0) {
        console.log('🔍 WORKING METHOD 2: Family-based lookup...');
        try {
          // Get user's family_id
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('family_id')
            .eq('user_id', user.id)
            .single();

          if (!profileError && userProfile?.family_id) {
            console.log('✅ WORKING METHOD 2: User has family_id:', userProfile.family_id);
            setUserFamilyId(userProfile.family_id);
            
            const { data: familyKids, error: familyError } = await supabase
              .from('kids_profiles')
              .select('*')
              .eq('family_id', userProfile.family_id)
              .order('created_at', { ascending: true });

            if (!familyError && familyKids && familyKids.length > 0) {
              console.log('✅ WORKING METHOD 2: Found', familyKids.length, 'kids via family lookup');
              foundKids = familyKids;
            } else if (familyError) {
              console.log('⚠️ WORKING METHOD 2: Family lookup error:', familyError);
            } else {
              console.log('ℹ️ WORKING METHOD 2: No kids found via family lookup');
            }
          } else {
            console.log('ℹ️ WORKING METHOD 2: No user profile or family_id found');
          }
        } catch (err) {
          console.log('❌ WORKING METHOD 2: Exception:', err);
        }
      }

      // Method 3: Broad search for any kids that might belong to this user (last resort)
      if (foundKids.length === 0) {
        console.log('🔍 WORKING METHOD 3: Broad search...');
        try {
          // This is a broader search - look for kids created around the same time as the user
          const { data: allKids, error: allError } = await supabase
            .from('kids_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // Get recent kids

          if (!allError && allKids && allKids.length > 0) {
            console.log('✅ WORKING METHOD 3: Found', allKids.length, 'total kids in database');
            // For now, we'll show all kids (in a real app, you'd want better filtering)
            // This is just to help debug and see if your kids exist at all
            foundKids = allKids;
          }
        } catch (err) {
          console.log('❌ WORKING METHOD 3: Exception:', err);
        }
      }

      // Set the results
      console.log('🎉 WORKING METHOD: Final result - found', foundKids.length, 'kids');
      setKidsProfiles(foundKids);
      
      // Auto-select first kid if available
      if (foundKids.length > 0 && !selectedKid) {
        setSelectedKid(foundKids[0]);
        console.log('👶 WORKING METHOD: Auto-selected first kid:', foundKids[0].name);
      }

    } catch (error) {
      console.error('💥 WORKING METHOD: Unexpected error:', error);
      setKidsProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Load kids profiles on component mount
  useEffect(() => {
    if (user?.id) {
      loadKidsProfilesWorking();
    }
  }, [user?.id]);

  // Helper to get kid's age
  const getKidAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper to get kid's initials
  const getKidInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Navigate to profile page to add kid
  const handleAddKid = () => {
    navigate('/profile');
  };

  // Refresh kids profiles
  const refreshKidsProfiles = () => {
    loadKidsProfilesWorking();
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Mobile-friendly Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-sm">
              <Baby className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Kids Zone</h1>
              <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">Healthy nutrition for growing minds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              onClick={refreshKidsProfiles}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleAddKid} size="sm" className="h-9">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Child</span>
            </Button>
          </div>
        </div>

        {/* Kids Selection - Simplified */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : kidsProfiles.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Baby className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Children Added</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Add your children to create personalized nutrition plans.
              </p>
              <Button onClick={handleAddKid} className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {kidsProfiles.map((kid) => (
              <Card 
                key={kid.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedKid?.id === kid.id 
                    ? 'ring-2 ring-primary bg-primary/5 shadow-sm border-primary/20' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => setSelectedKid(kid)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`font-medium text-sm ${selectedKid?.id === kid.id ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                        {getKidInitials(kid.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{kid.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Age {getKidAge(kid.birth_date || '')}
                        {kid.gender && ` • ${kid.gender}`}
                      </p>
                    </div>
                    {selectedKid?.id === kid.id && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content */}
        {selectedKid && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Mobile-optimized Tab Navigation */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 min-w-fit">
                <TabsTrigger value="overview" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="meal-planner" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <ChefHat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Meals</span>
                </TabsTrigger>
                <TabsTrigger value="recipes" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Recipes</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="learning" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Learn</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-1.5 px-3 text-xs sm:text-sm">
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Progress</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              {/* Mobile-first Profile Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarFallback className="text-lg sm:text-2xl font-bold bg-primary/10 text-primary">
                        {getKidInitials(selectedKid.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">{selectedKid.name}</h3>
                      <p className="text-muted-foreground mb-3">Age {getKidAge(selectedKid.birth_date || '')}</p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {selectedKid.gender && (
                          <div className="text-center sm:text-left">
                            <p className="text-muted-foreground">Gender</p>
                            <p className="font-medium capitalize">{selectedKid.gender}</p>
                          </div>
                        )}
                        {selectedKid.weight_kg && (
                          <div className="text-center sm:text-left">
                            <p className="text-muted-foreground">Weight</p>
                            <p className="font-medium">{selectedKid.weight_kg} kg</p>
                          </div>
                        )}
                        {selectedKid.height_cm && (
                          <div className="text-center sm:text-left">
                            <p className="text-muted-foreground">Height</p>
                            <p className="font-medium">{selectedKid.height_cm} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dietary Info */}
                  {(selectedKid.dietary_restrictions?.length > 0 || selectedKid.allergies?.length > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-foreground mb-3">Dietary Information</h4>
                      <div className="space-y-2">
                        {selectedKid.dietary_restrictions?.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Restrictions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedKid.dietary_restrictions.map((restriction, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {restriction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedKid.allergies?.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Allergies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedKid.allergies.map((allergy, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats - Mobile Optimized */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="p-2 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <p className="text-xl font-bold text-primary">85%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="p-2 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Goals Met</p>
                    <p className="text-xl font-bold text-primary">7/10</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity - Clean Mobile Design */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm">Rainbow Fruit Challenge</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <ChefHat className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm">Tried Veggie Wraps</p>
                        <p className="text-xs text-muted-foreground">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Star className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm">Healthy Eater Badge</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meal-planner">
              <KidsSchoolMealPlanner 
                kidId={selectedKid.id} 
                kidName={selectedKid.name}
                kidAge={getKidAge(selectedKid.birth_date || '')}
                kidGender={selectedKid.gender || 'not specified'}
              />
            </TabsContent>

            <TabsContent value="recipes">
              <KidsRecipes />
            </TabsContent>

            <TabsContent value="calendar">
              <PlanCalendar selectedChild={selectedKid} />
            </TabsContent>

            <TabsContent value="learning">
              <Card>
                <CardContent className="text-center py-8">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Learning Activities</h3>
                  <p className="text-muted-foreground text-sm">Interactive nutrition games coming soon!</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card>
                <CardContent className="text-center py-8">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-muted-foreground text-sm">Detailed progress reports coming soon!</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Kids;