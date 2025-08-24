import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useKidsProfiles } from "@/hooks/useKidsProfiles";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useResponsive } from "@/hooks/useResponsive";
import { useNavigate } from "react-router-dom";

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
  Crown,
  Upload,
  Droplets,
  Scale
} from "lucide-react";

interface ResponsiveDashboardProps {
  currentView: 'kids' | 'adult';
  onViewChange: (view: 'kids' | 'adult') => void;
}

const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({ 
  currentView, 
  onViewChange 
}) => {
  const { user, profile: userProfile } = useUser();
  const { profile } = useUserProfile();
  const { kidsProfiles, loading: kidsLoading, hasKids } = useKidsProfiles();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get user name with better fallback logic
  const getUserName = () => {
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
  };

  const userName = getUserName();

  // Calculate responsive grid classes
  const getStatsGridClasses = () => {
    if (isMobile) return 'grid-cols-2';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-4';
  };

  const getMainGridClasses = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1 lg:grid-cols-3';
  };

  // Real data calculations for adult view
  const calculateAdultStats = () => {
    const userWeight = typeof profile?.weight_kg === 'number' ? profile.weight_kg : 70;
    const userHeight = typeof profile?.height_cm === 'number' ? profile.height_cm : 170;
    
    // Calculate age from date_of_birth if available
    const userAge = profile?.date_of_birth 
      ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
      : 30;
    
    const activityLevel = profile?.activity_level || 'moderately_active';
    
    // Calculate BMR using Mifflin-St Jeor Equation
    const bmr = userWeight * 10 + userHeight * 6.25 - userAge * 5 + 
      (profile?.full_name?.toLowerCase().includes('female') ? -161 : 5);
    
    // Map activity levels to multipliers
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
    
    // Mock current intake (would come from meal logging)
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
  };

  const adultStats = calculateAdultStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'gap-4' : 'items-center justify-between'}`}>
            {/* Welcome Section */}
            <div className="flex-1">
              <h1 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Welcome back, {userName}! 👋
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
                onClick={() => onViewChange('kids')}
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
                onClick={() => onViewChange('adult')}
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
        {currentView === 'kids' ? (
          <KidsViewContent 
            kidsProfiles={kidsProfiles}
            hasKids={hasKids}
            kidsLoading={kidsLoading}
            isMobile={isMobile}
            isTablet={isTablet}
            getStatsGridClasses={getStatsGridClasses}
            navigate={navigate}
          />
        ) : (
          <AdultViewContent 
            adultStats={adultStats}
            isMobile={isMobile}
            isTablet={isTablet}
            getStatsGridClasses={getStatsGridClasses}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
};

// Kids View Component
interface KidsViewContentProps {
  kidsProfiles: any[];
  hasKids: boolean;
  kidsLoading: boolean;
  isMobile: boolean;
  isTablet: boolean;
  getStatsGridClasses: () => string;
  navigate: (path: string) => void;
}

const KidsViewContent: React.FC<KidsViewContentProps> = ({
  kidsProfiles,
  hasKids,
  kidsLoading,
  isMobile,
  isTablet,
  getStatsGridClasses,
  navigate
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className={`relative ${isMobile ? 'p-6' : 'p-8'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className={`relative flex ${isMobile ? 'flex-col' : 'flex-row'} items-start ${isMobile ? 'gap-4' : 'items-center gap-4'}`}>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                Kids Meal Planning
              </h2>
              <p className={`text-orange-100 ${isMobile ? 'text-sm' : 'text-base'}`}>
                AI-powered nutrition planning for healthy, happy kids
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => navigate('/kids')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className={`grid gap-4 ${getStatsGridClasses()}`}>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Active Kids</p>
                <p className="text-xl font-bold text-orange-800">{kidsProfiles.length}</p>
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
                <p className="text-xl font-bold text-green-800">{hasKids ? kidsProfiles.length * 2 : 0}</p>
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
                <p className="text-xl font-bold text-purple-800">{hasKids ? kidsProfiles.length * 8 : 0}</p>
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
                <p className="text-xl font-bold text-blue-800">{hasKids ? '85%' : '0%'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kids List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Your Kids</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/kids')}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Kid
          </Button>
        </div>
        
        {kidsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasKids ? (
          <div className="grid gap-4">
            {kidsProfiles.map((kid) => (
              <Card key={kid.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/kids')}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/kids');
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Plan Meals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Baby className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="font-semibold mb-2">No kids added yet</h4>
              <p className="text-muted-foreground text-sm mb-4">
                Add your children to start creating personalized meal plans
              </p>
              <Button 
                onClick={() => navigate('/kids')}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Kid
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Adult View Component
interface AdultViewContentProps {
  adultStats: {
    currentCalories: number;
    targetCalories: number;
    currentProtein: number;
    targetProtein: number;
    userWeight: number;
  };
  isMobile: boolean;
  isTablet: boolean;
  getStatsGridClasses: () => string;
  navigate: (path: string) => void;
}

const AdultViewContent: React.FC<AdultViewContentProps> = ({
  adultStats,
  isMobile,
  isTablet,
  getStatsGridClasses,
  navigate
}) => {
  const { currentCalories, targetCalories, currentProtein, targetProtein } = adultStats;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className={`relative ${isMobile ? 'p-6' : 'p-8'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className={`relative flex ${isMobile ? 'flex-col' : 'flex-row'} items-start ${isMobile ? 'gap-4' : 'items-center gap-4'}`}>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                Adult Diet Planning
              </h2>
              <p className={`text-blue-100 ${isMobile ? 'text-sm' : 'text-base'}`}>
                Personalized nutrition plans for your health & fitness goals
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => navigate('/upload')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className={`grid gap-4 ${getStatsGridClasses()}`}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Calories</p>
                <p className="text-lg font-bold text-blue-800">{currentCalories.toLocaleString()}</p>
                <p className="text-xs text-blue-600">of {targetCalories.toLocaleString()}</p>
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
                <p className="text-lg font-bold text-green-800">Day 12</p>
                <p className="text-xs text-green-600">of 30 days</p>
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
                <p className="text-lg font-bold text-purple-800">{Math.round((currentProtein / targetProtein) * 100)}%</p>
                <p className="text-xs text-purple-600">{currentProtein}g/{targetProtein}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Streak</p>
                <p className="text-lg font-bold text-orange-800">7</p>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Calories</span>
              <span className="text-sm text-muted-foreground">{currentCalories.toLocaleString()} / {targetCalories.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((currentCalories / targetCalories) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{currentProtein}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((currentProtein / targetProtein) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">45g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-cyan-600">6/8</div>
              <div className="text-xs text-muted-foreground">Water</div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
              <Utensils className="h-6 w-6" />
              <span className="text-xs sm:text-sm">Meal Recommendations</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs sm:text-sm">Progress Tracking</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
              <Upload className="h-6 w-6" />
              <span className="text-xs sm:text-sm">Upload Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
              <Settings className="h-6 w-6" />
              <span className="text-xs sm:text-sm">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Professional Diet Plans Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-500" />
            Professional Diet Plans
          </CardTitle>
          <CardDescription>
            Get expert-crafted nutrition plans tailored to your goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Access professionally designed diet plans created by certified nutritionists for optimal results.
          </p>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
            onClick={() => navigate('/upload')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveDashboard;