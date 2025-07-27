import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Baby, ChefHat, BookOpen, Heart, Users, Calendar, Trophy, CheckCircle, Clock, Target, Lightbulb, User, Play, RefreshCw, Search, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import KidsRecipes from '@/components/KidsRecipes';
import PlanCalendar from '@/components/PlanCalendar';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];
type Family = Database['public']['Tables']['families']['Row'];

const Kids: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Only use user, not profile to avoid conflicts
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);

  // Separate function to get user's family_id without affecting main profile
  const getUserFamilyId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error getting user family_id:', error);
        return null;
      }
      
      return data?.family_id || null;
    } catch (error) {
      console.error('Error getting user family_id:', error);
      return null;
    }
  };

  // Dedicated function to load kids profiles without affecting main profile
  const loadKidsProfilesDedicated = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // First, get the user's family_id separately
      const familyId = await getUserFamilyId(user.id);
      setUserFamilyId(familyId);
      
      if (!familyId) {
        console.log('No family_id found for user');
        setLoading(false);
        return;
      }
      
      // Then load kids profiles using the family_id
      const { data: kids, error } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading kids profiles:', error);
      } else {
        setKidsProfiles(kids || []);
        // Auto-select first kid if available
        if (kids && kids.length > 0 && !selectedKid) {
          setSelectedKid(kids[0]);
        }
      }
    } catch (error) {
      console.error('Error loading kids profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load kids profiles on component mount
  useEffect(() => {
    if (user?.id) {
      loadKidsProfilesDedicated();
    }
  }, [user?.id]); // Only depend on user.id, not profile

  // Refresh kids profiles function
  const refreshKidsProfiles = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get fresh family_id
      const familyId = await getUserFamilyId(user.id);
      setUserFamilyId(familyId);
      
      if (!familyId) {
        console.log('No family_id found for user');
        setLoading(false);
        return;
      }
      
      const { data: kids, error } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading kids profiles:', error);
      } else {
        setKidsProfiles(kids || []);
        // Auto-select first kid if available
        if (kids && kids.length > 0 && !selectedKid) {
          setSelectedKid(kids[0]);
        }
      }
    } catch (error) {
      console.error('Error loading kids profiles:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Baby className="h-8 w-8 text-orange-500" />
            Kids Zone
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A dedicated space for kid-friendly nutrition, recipes, and healthy eating habits
          </p>
        </div>

        {/* Kids Profiles Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Your Kids
            </h2>
            <Button size="sm" variant="outline" className="flex items-center gap-1 h-8 px-2" onClick={handleAddKid}>
              <Plus className="h-3 w-3" />
              <span className="text-xs">Add Kid</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : kidsProfiles.length === 0 ? (
            <Card className="p-6 text-center">
              <Baby className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-2">No Kids Added Yet</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add your kids to get personalized nutrition plans and track their growth
              </p>
              <Button size="sm" className="flex items-center gap-2" onClick={handleAddKid}>
                <Plus className="h-3 w-3" />
                Add Your First Kid
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {kidsProfiles.map((kid) => (
                <Card 
                  key={kid.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedKid?.id === kid.id 
                      ? 'ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg border-orange-200' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setSelectedKid(kid)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className={`h-8 w-8 ${selectedKid?.id === kid.id ? 'ring-2 ring-orange-300' : ''}`}>
                        <AvatarFallback className={`font-semibold text-xs ${selectedKid?.id === kid.id ? 'bg-orange-200 text-orange-700' : 'bg-orange-100 text-orange-600'}`}>
                          {getKidInitials(kid.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate text-sm ${selectedKid?.id === kid.id ? 'text-orange-800' : 'text-gray-900'}`}>
                          {kid.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span>{getKidAge(kid.birth_date)}y</span>
                          <span>•</span>
                          <span className="capitalize">{kid.gender}</span>
                        </div>
                      </div>
                      {selectedKid?.id === kid.id && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-medium text-orange-600 hidden sm:inline">Active</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Only show if a kid is selected */}
        {selectedKid ? (
          <Tabs defaultValue="recipes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="recipes" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600"
              >
                <ChefHat className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Recipes</span>
                <span className="sm:hidden">Recipes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="nutrition" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600"
              >
                <Heart className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Nutrition</span>
                <span className="sm:hidden">Nutrition</span>
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
              >
                <BookOpen className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Education</span>
                <span className="sm:hidden">Education</span>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600"
              >
                <Users className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Community</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600"
              >
                <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>
            </TabsList>

            {/* Recipes Tab */}
            <TabsContent value="recipes" className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Recipes for {selectedKid.name}
                </h3>
                <p className="text-gray-600">
                  Age-appropriate recipes tailored for {selectedKid.name} ({getKidAge(selectedKid.birth_date)} years old)
                </p>
              </div>
              <KidsRecipes selectedChild={selectedKid} />
            </TabsContent>

            {/* Nutrition Tab */}
            <TabsContent value="nutrition" className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nutrition & Growth for {selectedKid.name}
                </h3>
                <p className="text-gray-600">
                  Track {selectedKid.name}'s growth and nutritional milestones
                </p>
              </div>
              
              {/* Growth Tracking Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Metrics */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Growth Tracking Dashboard
                    </CardTitle>
                    <CardDescription>
                      Monitor {selectedKid.name}'s height, weight, and nutritional milestones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Current Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{selectedKid.height_cm || '--'}"</div>
                          <div className="text-sm text-blue-600">Height</div>
                          <div className="text-xs text-blue-500">+2" this month</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{selectedKid.weight_kg || '--'} lbs</div>
                          <div className="text-sm text-green-600">Weight</div>
                          <div className="text-xs text-green-500">+1.5 lbs this month</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">85%</div>
                          <div className="text-sm text-purple-600">Growth Percentile</div>
                          <div className="text-xs text-purple-500">Above average</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">18.5</div>
                          <div className="text-sm text-orange-600">BMI</div>
                          <div className="text-xs text-orange-500">Healthy range</div>
                        </div>
                      </div>

                      {/* Growth Chart */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Growth Trend (Last 6 Months)</h4>
                        <div className="h-48 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-end justify-between h-full space-x-2">
                            {[
                              { month: 'Jan', height: 40, weight: 32 },
                              { month: 'Feb', height: 40.5, weight: 32.5 },
                              { month: 'Mar', height: 41, weight: 33 },
                              { month: 'Apr', height: 41.5, weight: 33.5 },
                              { month: 'May', height: 42, weight: 34 },
                              { month: 'Jun', height: 42, weight: 35 }
                            ].map((data, index) => (
                              <div key={data.month} className="flex flex-col items-center space-y-2">
                                <div className="flex flex-col items-center space-y-1">
                                  <div 
                                    className="w-6 bg-blue-400 rounded-t"
                                    style={{ height: `${(data.height / 45) * 120}px` }}
                                  ></div>
                                  <div 
                                    className="w-6 bg-green-400 rounded-t"
                                    style={{ height: `${(data.weight / 40) * 120}px` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">{data.month}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-blue-400 rounded"></div>
                              <span className="text-xs text-gray-600">Height</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-green-400 rounded"></div>
                              <span className="text-xs text-gray-600">Weight</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Growth Milestones
                    </CardTitle>
                    <CardDescription>
                      Track developmental milestones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-semibold text-green-700">Height Milestone</div>
                          <div className="text-sm text-green-600">Reached 42 inches</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-semibold text-blue-700">Weight Milestone</div>
                          <div className="text-sm text-blue-600">Reached 35 pounds</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-semibold text-yellow-700">Next Milestone</div>
                          <div className="text-sm text-yellow-600">44 inches (2 months)</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Nutrition Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-500" />
                      Daily Nutrition Goals
                    </CardTitle>
                    <CardDescription>
                      Track daily nutritional intake
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Calories</span>
                          <span className="text-sm text-gray-600">1,200 / 1,400</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Protein</span>
                          <span className="text-sm text-gray-600">45g / 50g</span>
                        </div>
                        <Progress value={90} className="h-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Calcium</span>
                          <span className="text-sm text-gray-600">800mg / 1,000mg</span>
                        </div>
                        <Progress value={80} className="h-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Iron</span>
                          <span className="text-sm text-gray-600">7mg / 10mg</span>
                        </div>
                        <Progress value={70} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Growth Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations for optimal growth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                        <h4 className="font-semibold text-amber-700">Increase Iron Intake</h4>
                        <p className="text-sm text-amber-600">Add more leafy greens and lean meats to support growth</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-semibold text-blue-700">More Calcium-Rich Foods</h4>
                        <p className="text-sm text-blue-600">Include dairy products, fortified cereals, and green vegetables</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <h4 className="font-semibold text-green-700">Physical Activity</h4>
                        <p className="text-sm text-green-600">Encourage 60 minutes of active play daily</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Age-Based Nutrition Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="h-5 w-5 text-blue-500" />
                    Age-Based Nutrition Guidelines
                  </CardTitle>
                  <CardDescription>
                    Nutritional requirements for different age groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                        <Baby className="h-4 w-4" />
                        2-5 Years
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">Daily Calories</div>
                          <div className="text-sm text-blue-600">1,000-1,400 calories</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">Protein</div>
                          <div className="text-sm text-blue-600">13-20 grams</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">Calcium</div>
                          <div className="text-sm text-blue-600">700-1,000 mg</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">Iron</div>
                          <div className="text-sm text-blue-600">7-10 mg</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        6-12 Years
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-700">Daily Calories</div>
                          <div className="text-sm text-green-600">1,400-2,200 calories</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-700">Protein</div>
                          <div className="text-sm text-green-600">19-34 grams</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-700">Calcium</div>
                          <div className="text-sm text-green-600">1,000-1,300 mg</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-700">Iron</div>
                          <div className="text-sm text-green-600">8-10 mg</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-6">
              {/* Learning Resources Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
                <p className="text-gray-600">Fun and educational content about nutrition and healthy eating</p>
              </div>

              {/* Interactive Learning Modules */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Food Groups Explorer */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      </div>
                      Food Groups Explorer
                    </CardTitle>
                    <CardDescription>
                      Learn about the five food groups and their benefits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Fruits', color: 'bg-red-100', icon: '🍎', desc: 'Vitamins & Fiber' },
                          { name: 'Vegetables', color: 'bg-green-100', icon: '🥦', desc: 'Minerals & Antioxidants' },
                          { name: 'Grains', color: 'bg-yellow-100', icon: '🍞', desc: 'Energy & Fiber' },
                          { name: 'Protein', color: 'bg-blue-100', icon: '🥩', desc: 'Muscle Building' },
                          { name: 'Dairy', color: 'bg-purple-100', icon: '🥛', desc: 'Calcium & Protein' }
                        ].map((group) => (
                          <div key={group.name} className={`${group.color} p-3 rounded-lg text-center`}>
                            <div className="text-2xl mb-1">{group.icon}</div>
                            <div className="font-semibold text-sm">{group.name}</div>
                            <div className="text-xs text-gray-600">{group.desc}</div>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Nutrition Quiz */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      Nutrition Quiz
                    </CardTitle>
                    <CardDescription>
                      Test your knowledge about healthy eating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Quick Quiz:</h4>
                        <p className="text-sm mb-3">Which food group helps build strong bones?</p>
                        <div className="space-y-2">
                          {[
                            { option: 'A', text: 'Fruits', correct: false },
                            { option: 'B', text: 'Dairy', correct: true },
                            { option: 'C', text: 'Grains', correct: false },
                            { option: 'D', text: 'Vegetables', correct: false }
                          ].map((item) => (
                            <div key={item.option} className="flex items-center space-x-2 p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer">
                              <span className="font-bold text-blue-600">{item.option}.</span>
                              <span className="text-sm">{item.text}</span>
                              {item.correct && <span className="ml-auto text-green-600">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Take Full Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Healthy Habits Tracker */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                      Healthy Habits
                    </CardTitle>
                    <CardDescription>
                      Track your daily healthy eating habits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {[
                          { habit: 'Drink Water', icon: '💧', progress: 80 },
                          { habit: 'Eat Fruits', icon: '🍎', progress: 65 },
                          { habit: 'Eat Vegetables', icon: '🥕', progress: 45 },
                          { habit: 'Limit Sugar', icon: '🍭', progress: 90 }
                        ].map((item) => (
                          <div key={item.habit} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span>{item.icon}</span>
                                <span>{item.habit}</span>
                              </span>
                              <span className="text-gray-600">{item.progress}%</span>
                            </div>
                            <Progress value={item.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Habits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Educational Videos & Articles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Learning */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      </div>
                      Video Learning
                    </CardTitle>
                    <CardDescription>
                      Watch fun videos about nutrition and healthy eating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { title: 'Why Eat Your Vegetables?', duration: '3:45', thumbnail: '🥕', level: 'Beginner' },
                        { title: 'The Power of Protein', duration: '4:20', thumbnail: '🥩', level: 'Intermediate' },
                        { title: 'Sugar: Friend or Foe?', duration: '5:15', thumbnail: '🍭', level: 'Advanced' }
                      ].map((video) => (
                        <div key={video.title} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                          <div className="text-2xl">{video.thumbnail}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{video.title}</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span>{video.duration}</span>
                              <span>•</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{video.level}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Interactive Articles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      </div>
                      Interactive Articles
                    </CardTitle>
                    <CardDescription>
                      Read and learn about nutrition with interactive elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { title: 'The Rainbow Plate', content: 'Learn why eating colorful foods is important for your health', readTime: '2 min', difficulty: 'Easy' },
                        { title: 'Superfoods for Kids', content: 'Discover foods that give you super powers', readTime: '3 min', difficulty: 'Medium' },
                        { title: 'Building a Balanced Meal', content: 'How to create the perfect plate for every meal', readTime: '4 min', difficulty: 'Hard' }
                      ].map((article) => (
                        <div key={article.title} className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow">
                          <h4 className="font-semibold text-sm mb-1">{article.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{article.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{article.readTime}</span>
                              <span>•</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">{article.difficulty}</span>
                            </div>
                            <Button size="sm" variant="ghost">
                              <BookOpen className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Games Section */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Fun Games</h3>
                  <p className="text-gray-600">Play and learn about healthy eating!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Food Matching Game */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                        </div>
                        Food Matching Game
                      </CardTitle>
                      <CardDescription>
                        Match foods to their correct food groups
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { food: '🍎', group: 'Fruits', color: 'bg-red-100' },
                              { food: '🥦', group: 'Vegetables', color: 'bg-green-100' },
                              { food: '🥩', group: 'Protein', color: 'bg-blue-100' },
                              { food: '🥛', group: 'Dairy', color: 'bg-purple-100' }
                            ].map((item, index) => (
                              <div key={index} className={`${item.color} p-3 rounded-lg text-center cursor-pointer hover:scale-105 transition-transform`}>
                                <div className="text-2xl mb-1">{item.food}</div>
                                <div className="text-xs font-medium">{item.group}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          Play Full Game
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Healthy Plate Builder */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                        </div>
                        Plate Builder
                      </CardTitle>
                      <CardDescription>
                        Build a balanced meal on your plate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg">
                          <div className="relative w-32 h-32 mx-auto bg-white rounded-full border-4 border-gray-200">
                            {/* Plate sections */}
                            <div className="absolute inset-2 bg-green-200 rounded-full opacity-30"></div>
                            <div className="absolute inset-4 bg-yellow-200 rounded-full opacity-30"></div>
                            <div className="absolute inset-6 bg-red-200 rounded-full opacity-30"></div>
                            <div className="absolute inset-8 bg-blue-200 rounded-full opacity-30"></div>
                            <div className="absolute inset-10 bg-purple-200 rounded-full opacity-30"></div>
                            
                            {/* Food items on plate */}
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xl">🥦</div>
                            <div className="absolute top-8 right-6 text-xl">🍎</div>
                            <div className="absolute bottom-8 left-6 text-xl">🥩</div>
                            <div className="absolute bottom-4 right-8 text-xl">🥛</div>
                            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-xl">🍞</div>
                          </div>
                          <div className="text-center mt-3">
                            <div className="text-sm font-medium">Balanced Plate!</div>
                            <div className="text-xs text-gray-600">All food groups included</div>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <ChefHat className="h-4 w-4 mr-2" />
                          Build New Plate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Memory Game */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                      </div>
                      Nutrition Memory Game
                    </CardTitle>
                    <CardDescription>
                      Find matching pairs of healthy foods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            '🍎', '🥦', '🥩', '🥛', '🍞', '🥕', '🍇', '🥚'
                          ].map((food, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg text-center cursor-pointer hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-300">
                              <div className="text-xl">{food}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-3">
                          <div className="text-sm font-medium">Score: 8/8</div>
                          <div className="text-xs text-gray-600">Perfect match!</div>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Word Search */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      </div>
                      Nutrition Word Search
                    </CardTitle>
                    <CardDescription>
                      Find nutrition-related words in the grid
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
                        <div className="grid grid-cols-8 gap-1 text-center">
                          {[
                            'V', 'I', 'T', 'A', 'M', 'I', 'N', 'S',
                            'E', 'G', 'E', 'T', 'A', 'B', 'L', 'E',
                            'G', 'R', 'A', 'I', 'N', 'S', 'H', 'E',
                            'A', 'T', 'I', 'N', 'G', 'P', 'R', 'O',
                            'L', 'T', 'E', 'I', 'N', 'T', 'E', 'I',
                            'T', 'H', 'A', 'L', 'T', 'H', 'Y', 'N',
                            'H', 'Y', 'D', 'R', 'A', 'T', 'E', 'D',
                            'S', 'U', 'G', 'A', 'R', 'F', 'R', 'E'
                          ].map((letter, index) => (
                            <div key={index} className="bg-white p-2 rounded text-xs font-mono cursor-pointer hover:bg-orange-100 transition-colors">
                              {letter}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="text-sm font-medium">Words to find:</div>
                          <div className="text-xs text-gray-600 space-x-2">
                            <span className="line-through">VITAMINS</span>
                            <span className="line-through">VEGETABLE</span>
                            <span className="line-through">GRAINS</span>
                            <span>PROTEIN</span>
                            <span>HEALTHY</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        New Puzzle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Achievement System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Learning Achievements
                  </CardTitle>
                  <CardDescription>
                    Earn badges and rewards for your learning progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Nutrition Expert', icon: '🥇', earned: true, progress: 100 },
                      { name: 'Veggie Lover', icon: '🥬', earned: true, progress: 100 },
                      { name: 'Water Champion', icon: '💧', earned: false, progress: 75 },
                      { name: 'Quiz Master', icon: '🎯', earned: false, progress: 60 },
                      { name: 'Game Champion', icon: '🎮', earned: false, progress: 40 },
                      { name: 'Memory Master', icon: '🧠', earned: false, progress: 30 }
                    ].map((achievement) => (
                      <div key={achievement.name} className={`text-center p-4 rounded-lg border-2 ${achievement.earned ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
                        <div className="text-xs text-gray-600">
                          {achievement.earned ? 'Earned!' : `${achievement.progress}% Complete`}
                        </div>
                        {!achievement.earned && (
                          <Progress value={achievement.progress} className="h-1 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent Community */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-500" />
                      Parent Community
                    </CardTitle>
                    <CardDescription>
                      Connect with other parents and share experiences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center p-6 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">Coming Soon</div>
                        <p className="text-sm text-teal-600">Share recipes, tips, and experiences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expert Advice */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      Expert Advice
                    </CardTitle>
                    <CardDescription>
                      Get advice from nutritionists and pediatricians
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">Coming Soon</div>
                        <p className="text-sm text-orange-600">Q&A sessions with nutrition experts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Your Recipe Calendar</h2>
                <p className="text-gray-600">View and manage your saved recipes for {selectedKid.name}</p>
              </div>
              <PlanCalendar selectedChild={selectedKid} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Kid to Get Started</h3>
            <p className="text-gray-600">
              Choose a child from the list on the left to view their personalized nutrition and growth information.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Kids; 