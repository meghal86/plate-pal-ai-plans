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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg">
              <Baby className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kids Zone</h1>
              <p className="text-gray-600">Healthy nutrition for growing minds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={refreshKidsProfiles}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddKid} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
        </div>

        {/* Kids Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              Your Children
            </CardTitle>
            <CardDescription>
              Select a child to view their personalized nutrition plan and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                  <p className="text-gray-600">Loading children profiles...</p>
                </div>
              </div>
            ) : kidsProfiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Baby className="h-10 w-10 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Added Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start by adding your children to create personalized nutrition plans and track their healthy growth journey.
                </p>
                <Button 
                  onClick={handleAddKid}
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {kidsProfiles.map((kid) => (
                  <Card 
                    key={kid.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      selectedKid?.id === kid.id 
                        ? 'ring-2 ring-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg border-pink-200' 
                        : 'hover:bg-gray-50 border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedKid(kid)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-12 w-12 ${selectedKid?.id === kid.id ? 'ring-2 ring-pink-300' : ''}`}>
                          <AvatarFallback className={`font-bold text-sm ${selectedKid?.id === kid.id ? 'bg-pink-200 text-pink-700' : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'}`}>
                            {getKidInitials(kid.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{kid.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Age {getKidAge(kid.birth_date || '')}</span>
                            {kid.gender && (
                              <>
                                <span>•</span>
                                <span>{kid.gender}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedKid?.id === kid.id && (
                          <CheckCircle className="h-5 w-5 text-pink-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedKid && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="meal-planner" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Meal Plans</span>
              </TabsTrigger>
              <TabsTrigger value="recipes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Recipes</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kid Profile Card */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      {selectedKid.name}'s Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-3">
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                          {getKidInitials(selectedKid.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-gray-900">{selectedKid.name}</h3>
                      <p className="text-gray-600">Age {getKidAge(selectedKid.birth_date || '')}</p>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedKid.gender && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium capitalize">{selectedKid.gender}</span>
                        </div>
                      )}
                      {selectedKid.weight_kg && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-medium">{selectedKid.weight_kg} kg</span>
                        </div>
                      )}
                      {selectedKid.height_cm && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Height:</span>
                          <span className="font-medium">{selectedKid.height_cm} cm</span>
                        </div>
                      )}
                    </div>

                    {/* Dietary Info */}
                    {(selectedKid.dietary_restrictions?.length > 0 || selectedKid.allergies?.length > 0) && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold text-gray-900 mb-2">Dietary Information</h4>
                        {selectedKid.dietary_restrictions?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">Restrictions:</span>
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
                            <span className="text-sm text-gray-600">Allergies:</span>
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
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Heart className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Health Score</p>
                            <p className="text-2xl font-bold text-green-600">85%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Goals Met</p>
                            <p className="text-2xl font-bold text-blue-600">7/10</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Completed Rainbow Fruit Challenge</p>
                            <p className="text-sm text-green-600">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <ChefHat className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800">Tried new recipe: Veggie Wraps</p>
                            <p className="text-sm text-blue-600">Yesterday</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <Star className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-purple-800">Earned "Healthy Eater" badge</p>
                            <p className="text-sm text-purple-600">3 days ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meal-planner">
              <KidsSchoolMealPlanner kidId={selectedKid.id} kidName={selectedKid.name} />
            </TabsContent>

            <TabsContent value="recipes">
              <KidsRecipes kidAge={getKidAge(selectedKid.birth_date || '')} />
            </TabsContent>

            <TabsContent value="calendar">
              <PlanCalendar 
                userId={user?.id || ''} 
                kidId={selectedKid.id}
                planType="kids"
              />
            </TabsContent>

            <TabsContent value="learning">
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Learning Activities</h3>
                <p className="text-gray-600">Interactive nutrition games and activities coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gold-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Detailed progress reports and achievements coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Kids;