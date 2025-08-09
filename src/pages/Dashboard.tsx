import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

import { 
  Baby, 
  User, 
  Calendar, 
  ChefHat, 
  Target, 
  TrendingUp,
  Apple,
  Heart,
  Clock,
  Star,
  Settings,
  BarChart3,
  BookOpen,
  Utensils,
  Trophy,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Plus,
  Activity,
  Flame,
  Users,
  Crown
} from "lucide-react";

type UserPreference = 'kids' | 'adult';

const Dashboard: React.FC = () => {
  const { user, profile: userProfile, refreshProfile: refreshUserProfile, updatePreferences, getPreference } = useUser();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<UserPreference>('kids');
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user preference on mount
  useEffect(() => {
    // Always stop loading after component mounts
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    // Get preference using the new system
    const preference = getPreference('dashboard', 'default_view', null as UserPreference | null);
    
    if (preference) {
      setCurrentView(preference);
    } else {
      // Check localStorage as fallback
      const storedPreference = localStorage.getItem('dashboard_preference') as UserPreference;
      if (storedPreference === 'kids' || storedPreference === 'adult') {
        setCurrentView(storedPreference);
        // Sync to database
        if (user && userProfile) {
          updateUserPreference(storedPreference);
        }
      } else {
        // No preference set anywhere, show modal to set one
        setShowPreferenceModal(true);
      }
    }
    
    setLoading(false);
    clearTimeout(timer);

    return () => clearTimeout(timer);
  }, [userProfile, user]);

  // Fallback: Force stop loading after 2 seconds regardless
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const updateUserPreference = async (preference: UserPreference) => {
    if (!user) return;

    try {
      // Update local state immediately for better UX
      setCurrentView(preference);
      setShowPreferenceModal(false);

      // Update using the new preference system
      await updatePreferences('dashboard', {
        default_view: preference
      });

      toast({
        title: "Preference Updated",
        description: `Dashboard set to ${preference === 'kids' ? 'Kids Meal Planning' : 'Adult Diet Planning'} mode`,
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update dashboard preference",
        variant: "destructive"
      });
    }
  };

  const toggleView = () => {
    const newView = currentView === 'kids' ? 'adult' : 'kids';
    updateUserPreference(newView);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Welcome Section */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {currentView === 'kids' 
                  ? 'Family nutrition & meal planning' 
                  : 'Personal diet & fitness goals'
                }
              </p>
            </div>
            
            {/* Compact Toggle */}
            <div className="flex items-center gap-1 bg-card rounded-full p-1 shadow-sm border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateUserPreference('kids')}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  currentView === 'kids' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Baby className="h-3 w-3 mr-1" />
                Kids
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateUserPreference('adult')}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  currentView === 'adult' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <User className="h-3 w-3 mr-1" />
                Adult
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {currentView === 'kids' ? <KidsView /> : <AdultView />}
      </div>

      {/* Preference Setting Modal */}
      <Dialog open={showPreferenceModal} onOpenChange={setShowPreferenceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Choose Your Focus</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              Select your primary focus to customize your dashboard:
            </p>
            
            <div className="space-y-3">
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  currentView === 'kids' ? 'border-orange-500 bg-orange-50' : 'border-border hover:border-orange-300'
                }`}
                onClick={() => updateUserPreference('kids')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Baby className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Kids Meal Planning</h3>
                      <p className="text-xs text-muted-foreground">
                        Family nutrition & school meals
                      </p>
                    </div>
                    {currentView === 'kids' && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  currentView === 'adult' ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-blue-300'
                }`}
                onClick={() => updateUserPreference('adult')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Adult Diet Planning</h3>
                      <p className="text-xs text-muted-foreground">
                        Personal nutrition & fitness goals
                      </p>
                    </div>
                    {currentView === 'adult' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Kids View Component
const KidsView: React.FC = () => {
  const { user, userProfile } = useUser();
  
  // Mock data - in real app, this would come from API
  const mockKids = [
    { id: '1', name: 'Emma', age: 8, gender: 'female' },
    { id: '2', name: 'Alex', age: 6, gender: 'male' },
    { id: '3', name: 'Sophie', age: 10, gender: 'female' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Kids Meal Planning
              </h2>
              <p className="text-orange-100 text-sm sm:text-base">
                AI-powered nutrition planning for healthy, happy kids
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Active Kids</p>
                <p className="text-xl font-bold text-orange-800">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-sm">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Meal Plans</p>
                <p className="text-xl font-bold text-green-800">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Recipes</p>
                <p className="text-xl font-bold text-purple-800">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Success</p>
                <p className="text-xl font-bold text-blue-800">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Feature - Kids Meal Planner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Your Kids</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Add Kid
          </Button>
        </div>
        
        <div className="grid gap-4">
          {mockKids.map((kid) => (
            <Card key={kid.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {kid.name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{kid.name}</h4>
                      <p className="text-xs text-muted-foreground">Age {kid.age}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Plan Meals
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Kids Meal Planner Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            Kids Meal Planner
          </CardTitle>
          <CardDescription>
            Create AI-powered meal plans for your children
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Generate personalized, nutritious meal plans tailored to your child's age, preferences, and dietary needs.
          </p>
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Start Planning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Adult View Component
const AdultView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Adult Diet Planning
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                Personalized nutrition plans for your health & fitness goals
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Calories</p>
                <p className="text-lg font-bold text-blue-800">1,847</p>
                <p className="text-xs text-blue-600">of 2,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Progress</p>
                <p className="text-lg font-bold text-green-800">-3.2 lbs</p>
                <p className="text-xs text-green-600">this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Protein</p>
                <p className="text-lg font-bold text-purple-800">89%</p>
                <p className="text-xs text-purple-600">125g/140g</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Streak</p>
                <p className="text-lg font-bold text-orange-800">12</p>
                <p className="text-xs text-orange-600">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-500" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calorie Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Calories</span>
              <span className="text-sm text-muted-foreground">1,847 / 2,000</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
            </div>
          </div>
          
          {/* Macros */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-green-600">125g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-500" style={{ width: '89%' }}></div>
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">180g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-red-600">65g</div>
              <div className="text-xs text-muted-foreground">Fat</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-red-400 to-red-600 h-1 rounded-full transition-all duration-500" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-all cursor-pointer" tabIndex={0}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Utensils className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Meal Recommendations</h4>
                <p className="text-xs text-muted-foreground">Get personalized meal suggestions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer" tabIndex={0}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Progress Tracking</h4>
                <p className="text-xs text-muted-foreground">View detailed analytics</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Diet Plans Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Professional Diet Plans
          </CardTitle>
          <CardDescription>
            AI-generated nutrition plans for your health goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Create personalized diet plans using advanced AI algorithms tailored to your specific health and fitness objectives.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Generate Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;