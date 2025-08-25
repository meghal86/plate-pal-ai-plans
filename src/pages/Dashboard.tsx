import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ResponsiveDashboard from "@/components/ResponsiveDashboard";
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
  User
} from "lucide-react";

type UserPreference = 'kids' | 'adult';

const Dashboard: React.FC = () => {
  const { user, profile: userProfile, updatePreferences, getPreference } = useUser();
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
      <ResponsiveDashboard 
        currentView={currentView}
        onViewChange={updateUserPreference}
      />

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

export default Dashboard;