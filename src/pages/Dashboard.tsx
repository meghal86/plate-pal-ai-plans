import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useKidsProfiles } from "@/hooks/useKidsProfiles";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { 
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
  Crown,
  Baby,
  User,
  Upload,
  Scale,
  Droplets,
  Bell,
  Menu,
  X
} from "lucide-react";

type UserPreference = 'kids' | 'adult';

const Dashboard: React.FC = () => {
  const { user, profile: userProfile, updatePreferences, getPreference } = useUser();
  const { profile } = useUserProfile();
  const { kidsProfiles, loading: kidsLoading, hasKids } = useKidsProfiles();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<UserPreference>('kids');
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user name with better fallback logic - memoized to prevent re-renders
  const userName = React.useMemo(() => {
    if (profile?.full_name && profile.full_name !== "User") {
      return profile.full_name.split(' ')[0];
    }
    
    if (userProfile?.full_name && userProfile.full_name !== "User") {
      return userProfile.full_name.split(' ')[0];
    }
    
    if (profile?.email || userProfile?.email) {
      const email = profile?.email || userProfile?.email;
      const emailPrefix = email!.split('@')[0];
      return emailPrefix
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    }
    
    return "User";
  }, [profile?.full_name, profile?.email, userProfile?.full_name, userProfile?.email]);

  // Load user preference on mount - fixed to prevent infinite loops
  useEffect(() => {
    let isMounted = true;
    
    const initializePreferences = async () => {
      if (!isMounted) return;
      
      try {
        const preference = getPreference('dashboard', 'default_view', null as UserPreference | null);
        
        if (preference && isMounted) {
          setCurrentView(preference);
        } else {
          const storedPreference = localStorage.getItem('dashboard_preference') as UserPreference;
          if (storedPreference === 'kids' || storedPreference === 'adult') {
            if (isMounted) {
              setCurrentView(storedPreference);
            }
            // Only sync to database if we have user data and component is still mounted
            if (user && userProfile && isMounted) {
              try {
                await updatePreferences('dashboard', {
                  default_view: storedPreference
                });
              } catch (error) {
                console.error('Error syncing preference:', error);
              }
            }
          } else if (isMounted) {
            setShowPreferenceModal(true);
          }
        }
      } catch (error) {
        console.error('Error initializing preferences:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set a timeout to ensure loading stops even if there are issues
    const loadingTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1000);

    initializePreferences();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimer);
    };
  }, []); // Empty dependency array to run only once on mount

  const updateUserPreference = async (preference: UserPreference) => {
    if (!user) return;

    try {
      setCurrentView(preference);
      setShowPreferenceModal(false);

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

  // Calculate adult stats - memoized to prevent unnecessary recalculations
  const adultStats = React.useMemo(() => {
    const userWeight = typeof profile?.weight_kg === 'number' ? profile.weight_kg : 70;
    const userHeight = typeof profile?.height_cm === 'number' ? profile.height_cm : 170;
    
    const userAge = profile?.date_of_birth 
      ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
      : 30;
    
    const activityLevel = profile?.activity_level || 'moderately_active';
    
    const bmr = userWeight * 10 + userHeight * 6.25 - userAge * 5 + 
      (profile?.gender === 'female' ? -161 : 5);
    
    const getActivityMultiplier = (level: string) => {
      switch (level) {
        case 'sedentary': return 1.2;
        case 'lightly_active': return 1.375;
        case 'moderately_active': return 1.55;
        case 'very_active': return 1.725;
        case 'extremely_active': return 1.9;
        default: return 1.55;
      }
    };
    
    const activityMultiplier = getActivityMultiplier(activityLevel);
    const targetCalories = Math.round(bmr * activityMultiplier);
    const currentCalories = Math.round(targetCalories * 0.65);
    const currentProtein = Math.round(userWeight * 1.2 * 0.7);
    const targetProtein = Math.round(userWeight * 1.2);
    
    return {
      currentCalories,
      targetCalories,
      currentProtein,
      targetProtein,
      userWeight
    };
  }, [
    profile?.weight_kg,
    profile?.height_cm,
    profile?.date_of_birth,
    profile?.activity_level,
    profile?.gender
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Welcome */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-slate-900">
                    Welcome back, {userName}!
                  </h1>
                  <p className="text-sm text-slate-600">
                    {currentView === 'kids' 
                      ? 'Family nutrition & meal planning' 
                      : 'Personal diet & fitness goals'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateUserPreference('kids')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentView === 'kids' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Baby className="h-4 w-4 mr-2" />
                  Kids
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateUserPreference('adult')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentView === 'adult' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  Adult
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                size="sm"
                onClick={() => navigate(currentView === 'kids' ? '/kids' : '/upload')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 py-4">
              <div className="space-y-4">
                {/* Mobile View Toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateUserPreference('kids');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      currentView === 'kids' 
                        ? 'bg-white text-orange-600 shadow-sm' 
                        : 'text-slate-600'
                    }`}
                  >
                    <Baby className="h-4 w-4 mr-2" />
                    Kids
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateUserPreference('adult');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      currentView === 'adult' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600'
                    }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Adult
                  </Button>
                </div>

                {/* Mobile Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  
                  <Button
                    className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    onClick={() => {
                      navigate(currentView === 'kids' ? '/kids' : '/upload');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'kids' ? (
          <KidsView 
            kidsProfiles={kidsProfiles}
            hasKids={hasKids}
            kidsLoading={kidsLoading}
            navigate={navigate}
          />
        ) : (
          <AdultView 
            adultStats={adultStats}
            navigate={navigate}
          />
        )}
      </main>

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

// Kids View Component - Memoized to prevent unnecessary re-renders
interface KidsViewProps {
  kidsProfiles: any[];
  hasKids: boolean;
  kidsLoading: boolean;
  navigate: (path: string) => void;
}

const KidsView: React.FC<KidsViewProps> = React.memo(({
  kidsProfiles,
  hasKids,
  kidsLoading,
  navigate
}) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Kids Meal Planning</h2>
                  <p className="text-orange-100 text-lg">
                    AI-powered nutrition planning for healthy, happy kids
                  </p>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => navigate('/kids')}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Meal Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Active Kids</p>
                <p className="text-2xl font-bold text-orange-800">{kidsProfiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Meal Plans</p>
                <p className="text-2xl font-bold text-green-800">{hasKids ? kidsProfiles.length * 2 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-sm">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Recipes</p>
                <p className="text-2xl font-bold text-purple-800">{hasKids ? kidsProfiles.length * 8 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-blue-800">{hasKids ? '85%' : '0%'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kids List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Your Kids
              </CardTitle>
              <CardDescription>
                Manage meal plans and nutrition for your children
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/kids')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Kid
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {kidsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasKids ? (
            <div className="space-y-4">
              {kidsProfiles.map((kid) => (
                <div key={kid.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/kids')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {kid.name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold">{kid.name}</h4>
                      <p className="text-sm text-muted-foreground">Age {kid.age}</p>
                    </div>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/kids');
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Plan Meals
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Baby className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold mb-2">No kids added yet</h4>
              <p className="text-muted-foreground mb-6">
                Add your children to start creating personalized meal plans
              </p>
              <Button 
                onClick={() => navigate('/kids')}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Kid
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// Adult View Component - Memoized to prevent unnecessary re-renders
interface AdultViewProps {
  adultStats: {
    currentCalories: number;
    targetCalories: number;
    currentProtein: number;
    targetProtein: number;
    userWeight: number;
  };
  navigate: (path: string) => void;
}

const AdultView: React.FC<AdultViewProps> = React.memo(({
  adultStats,
  navigate
}) => {
  const { currentCalories, targetCalories, currentProtein, targetProtein } = adultStats;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Adult Diet Planning</h2>
                  <p className="text-blue-100 text-lg">
                    Personalized nutrition plans for your health & fitness goals
                  </p>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => navigate('/upload')}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Diet Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Calories Today</p>
                <p className="text-2xl font-bold text-blue-800">{currentCalories.toLocaleString()}</p>
                <p className="text-xs text-blue-600">of {targetCalories.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Progress</p>
                <p className="text-2xl font-bold text-green-800">Day 12</p>
                <p className="text-xs text-green-600">of 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-sm">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Protein</p>
                <p className="text-2xl font-bold text-purple-800">{Math.round((currentProtein / targetProtein) * 100)}%</p>
                <p className="text-xs text-purple-600">{currentProtein}g/{targetProtein}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-sm">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Streak</p>
                <p className="text-2xl font-bold text-orange-800">7</p>
                <p className="text-xs text-orange-600">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Today's Progress
          </CardTitle>
          <CardDescription>
            Track your daily nutrition goals and achievements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Daily Calories</span>
              <span className="text-sm text-muted-foreground">{currentCalories.toLocaleString()} / {targetCalories.toLocaleString()}</span>
            </div>
            <Progress 
              value={(currentCalories / targetCalories) * 100} 
              className="h-3"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">{currentProtein}g</div>
              <div className="text-sm text-green-700 mb-2">Protein</div>
              <Progress 
                value={(currentProtein / targetProtein) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-1">45g</div>
              <div className="text-sm text-orange-700 mb-2">Carbs</div>
              <Progress 
                value={60} 
                className="h-2"
              />
            </div>
            
            <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="text-2xl font-bold text-cyan-600 mb-1">6/8</div>
              <div className="text-sm text-cyan-700 mb-2">Water (glasses)</div>
              <Progress 
                value={75} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blue-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate('/upload')}
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs">View Progress</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Meal Calendar</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate('/profile')}
              >
                <Settings className="h-6 w-6" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-500" />
              Professional Plans
            </CardTitle>
            <CardDescription>
              Expert-crafted nutrition plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Access professionally designed diet plans created by certified nutritionists for optimal results.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              onClick={() => navigate('/upload')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Professional Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default Dashboard;