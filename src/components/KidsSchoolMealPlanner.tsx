import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@/contexts/UserContext';
import { 
  generateKidsSchoolPlan, 
  generateAlternativeMeal,
  KidsSchoolPlan, 
  KidsMeal, 
  KidsPlanPreferences,
  KidsDailyPlan
} from '@/api/generate-kids-meal-plan';
import { notificationService, NotificationPreferences } from '@/services/notification-service';
import { KidsMealPlansService } from '@/services/kids-meal-plans-service';
import type { Database } from '@/integrations/supabase/types';
import { 
  ChefHat, 
  Calendar, 
  Clock, 
  Bell, 
  RefreshCw, 
  Plus, 
  Settings, 
  Download,
  Share2,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Target,
  Heart,
  Apple,
  Utensils,
  BookOpen,
  Star,
  Crown,
  Zap,
  Shield,
  Lightbulb,
  Save,
  Play,
  Pause,
  Archive,
  History
} from "lucide-react";

type KidsMealPlan = Database['public']['Tables']['kids_meal_plans']['Row'];

interface KidsSchoolMealPlannerProps {
  kidId: string;
  kidName: string;
  kidAge: number;
  kidGender: string;
}

const KidsSchoolMealPlanner: React.FC<KidsSchoolMealPlannerProps> = ({ 
  kidId, 
  kidName, 
  kidAge, 
  kidGender 
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  
  // State management
  const [activeTab, setActiveTab] = useState('create');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<KidsSchoolPlan | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<KidsMealPlan[]>([]);
  const [activePlan, setActivePlan] = useState<KidsMealPlan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<KidsMeal | null>(null);
  const [replacingMeal, setReplacingMeal] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Form state
  const [planDuration, setPlanDuration] = useState(7);
  const [planPreferences, setPlanPreferences] = useState<KidsPlanPreferences>({
    kid_age: kidAge,
    allergies: [],
    dislikes: [],
    favorites: [],
    dietary_restrictions: [],
    school_lunch_policy: 'packed_lunch',
    prep_time_limit: '15_minutes',
    budget_range: 'moderate',
    special_requirements: ''
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: true,
    breakfast_reminder: true,
    lunch_prep_reminder: true,
    snack_reminder: true,
    breakfast_time: '07:00',
    lunch_prep_time: '21:00',
    snack_time: '15:30',
    weekend_notifications: false
  });

  const handleInputChange = (field: keyof KidsPlanPreferences, value: any) => {
    setPlanPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: keyof KidsPlanPreferences, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setPlanPreferences(prev => ({
      ...prev,
      [field]: items
    }));
  };

  // Load saved plans and active plan on component mount
  useEffect(() => {
    loadSavedPlans();
    loadActivePlan();
  }, [kidId]);

  const loadSavedPlans = async () => {
    try {
      setLoading(true);
      const plans = await KidsMealPlansService.getMealPlansForKid(kidId);
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading saved plans:', error);
      toast({
        title: "Failed to Load Plans",
        description: "Could not load saved meal plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivePlan = async () => {
    try {
      const plan = await KidsMealPlansService.getActiveMealPlan(kidId);
      setActivePlan(plan);
      if (plan) {
        const planData = KidsMealPlansService.parsePlanData(plan.plan_data);
        setCurrentPlan(planData);
        setCurrentPlanId(plan.id);
        setActiveTab('plan');
      }
    } catch (error) {
      console.error('Error loading active plan:', error);
    }
  };

  const savePlan = async () => {
    if (!currentPlan || !user) return;

    try {
      setLoading(true);
      const savedPlan = await KidsMealPlansService.saveMealPlan(
        kidId,
        currentPlan,
        planPreferences,
        user.id
      );

      setSavedPlans(prev => [savedPlan, ...prev]);
      setCurrentPlanId(savedPlan.id);

      toast({
        title: "Plan Saved!",
        description: `${currentPlan.title} has been saved successfully`,
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (planId: string) => {
    try {
      setLoading(true);
      const activatedPlan = await KidsMealPlansService.activateMealPlan(planId);
      
      // Update local state
      setActivePlan(activatedPlan);
      setSavedPlans(prev => prev.map(plan => ({
        ...plan,
        is_active: plan.id === planId
      })));

      // Load the plan data
      const planData = KidsMealPlansService.parsePlanData(activatedPlan.plan_data);
      setCurrentPlan(planData);
      setCurrentPlanId(planId);
      setActiveTab('plan');

      toast({
        title: "Plan Activated!",
        description: `${activatedPlan.title} is now your active meal plan`,
      });
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: "Activation Failed",
        description: "Failed to activate meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivatePlan = async (planId: string) => {
    try {
      setLoading(true);
      await KidsMealPlansService.deactivateMealPlan(planId);
      
      // Update local state
      setActivePlan(null);
      setSavedPlans(prev => prev.map(plan => ({
        ...plan,
        is_active: false
      })));
      setCurrentPlan(null);
      setCurrentPlanId(null);

      toast({
        title: "Plan Deactivated",
        description: "Meal plan has been deactivated",
      });
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: "Deactivation Failed",
        description: "Failed to deactivate meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      setLoading(true);
      await KidsMealPlansService.deleteMealPlan(planId);
      
      // Update local state
      setSavedPlans(prev => prev.filter(plan => plan.id !== planId));
      
      // If this was the current plan, clear it
      if (currentPlanId === planId) {
        setCurrentPlan(null);
        setCurrentPlanId(null);
        setActivePlan(null);
      }

      toast({
        title: "Plan Deleted",
        description: "Meal plan has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPlan = async (planId: string) => {
    try {
      setLoading(true);
      const plan = await KidsMealPlansService.getMealPlanById(planId);
      if (plan) {
        const planData = KidsMealPlansService.parsePlanData(plan.plan_data);
        const preferences = KidsMealPlansService.parsePreferences(plan.preferences);
        
        setCurrentPlan(planData);
        setCurrentPlanId(plan.id);
        setPlanPreferences(preferences);
        setActiveTab('plan');
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user) return;

    try {
      setGenerating(true);
      
      const plan = await generateKidsSchoolPlan(planPreferences, kidName, planDuration);
      plan.kid_id = kidId;
      
      setCurrentPlan(plan);
      
      // Automatically save the generated plan
      const savedPlan = await KidsMealPlansService.saveMealPlan(
        kidId,
        plan,
        planPreferences,
        user.id
      );

      setSavedPlans(prev => [savedPlan, ...prev]);
      setCurrentPlanId(savedPlan.id);
      setActiveTab('plan');
      
      toast({
        title: "School Meal Plan Generated & Saved!",
        description: `Created a ${planDuration}-day meal plan for ${kidName}`,
      });

      // Schedule notifications if enabled
      if (notificationPrefs.enabled) {
        try {
          await notificationService.scheduleKidsSchoolPlanNotifications(
            plan, 
            kidName, 
            notificationPrefs
          );
          
          toast({
            title: "Notifications Scheduled!",
            description: "Daily meal reminders have been set up",
          });
        } catch (error) {
          console.error('Failed to schedule notifications:', error);
          toast({
            title: "Notifications Failed",
            description: "Plan created but notifications couldn't be scheduled",
            variant: "destructive"
          });
        }
      }

    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const replaceMeal = async (dayIndex: number, mealType: string) => {
    if (!currentPlan || !currentPlanId) return;
    
    try {
      setGenerating(true);
      const dailyPlan = currentPlan.daily_plans[dayIndex];
      const originalMeal = dailyPlan[mealType as keyof KidsDailyPlan] as KidsMeal;
      
      const alternativeMeal = await generateAlternativeMeal(
        originalMeal, 
        planPreferences, 
        kidName
      );
      
      // Update the plan
      const updatedPlan = { ...currentPlan };
      (updatedPlan.daily_plans[dayIndex] as any)[mealType] = alternativeMeal;
      
      // Recalculate nutrition summary
      const day = updatedPlan.daily_plans[dayIndex];
      day.total_calories = day.breakfast.calories + day.lunch.calories + day.snack.calories;
      day.nutrition_summary = {
        protein: day.breakfast.nutrition.protein + day.lunch.nutrition.protein + day.snack.nutrition.protein,
        carbs: day.breakfast.nutrition.carbs + day.lunch.nutrition.carbs + day.snack.nutrition.carbs,
        fat: day.breakfast.nutrition.fat + day.lunch.nutrition.fat + day.snack.nutrition.fat,
        fiber: day.breakfast.nutrition.fiber + day.lunch.nutrition.fiber + day.snack.nutrition.fiber,
        calcium: day.breakfast.nutrition.calcium + day.lunch.nutrition.calcium + day.snack.nutrition.calcium,
        iron: day.breakfast.nutrition.iron + day.lunch.nutrition.iron + day.snack.nutrition.iron
      };
      
      setCurrentPlan(updatedPlan);

      // Save the updated plan to database
      await KidsMealPlansService.updateMealPlan(currentPlanId, {
        plan_data: updatedPlan as any
      });
      
      toast({
        title: "Meal Replaced & Saved!",
        description: `${originalMeal.name} has been replaced with ${alternativeMeal.name}`,
      });
      
    } catch (error) {
      console.error('Error replacing meal:', error);
      toast({
        title: "Replacement Failed",
        description: "Failed to generate alternative meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const testNotifications = async () => {
    try {
      await notificationService.testNotification(kidName);
      toast({
        title: "Test Notification Sent!",
        description: "Check your notifications to see if it worked",
      });
    } catch (error) {
      toast({
        title: "Notification Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const getMealTypeColor = (type: string) => {
    const colors = {
      breakfast: 'from-yellow-500 to-orange-500',
      lunch: 'from-green-500 to-emerald-500',
      snack: 'from-purple-500 to-pink-500'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-slate-500';
  };

  const getMealTypeIcon = (type: string) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🥪',
      snack: '🍎'
    };
    return icons[type as keyof typeof icons] || '🍽️';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-orange-800">
                School Meal Planner for {kidName}
              </CardTitle>
              <CardDescription className="text-orange-700">
                AI-powered meal planning for school days with smart notifications
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Badge className="bg-orange-200 text-orange-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium Feature
            </Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              School-Safe
            </Badge>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              <Bell className="h-3 w-3 mr-1" />
              Smart Notifications
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 gap-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner">
          <TabsTrigger 
            value="create" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </TabsTrigger>
          <TabsTrigger 
            value="plans" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <History className="h-4 w-4" />
            My Plans
          </TabsTrigger>
          <TabsTrigger 
            value="plan" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Calendar className="h-4 w-4" />
            Active Plan
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Create Plan Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Create School Meal Plan
              </CardTitle>
              <CardDescription>
                Generate a personalized 7-day school meal plan for {kidName} (Age {kidAge})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Duration Selection */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Plan Duration
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Choose how many days you want in your meal plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[7, 14, 21, 30].map((days) => (
                      <Button
                        key={days}
                        variant={planDuration === days ? "default" : "outline"}
                        onClick={() => setPlanDuration(days)}
                        className={`h-16 flex flex-col items-center justify-center ${
                          planDuration === days 
                            ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg" 
                            : "hover:bg-blue-50 border-blue-200"
                        }`}
                      >
                        <span className="text-2xl font-bold">{days}</span>
                        <span className="text-xs">
                          {days === 7 ? "1 Week" : days === 14 ? "2 Weeks" : days === 21 ? "3 Weeks" : "1 Month"}
                        </span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Duration Input */}
                  <div className="mt-4 flex items-center gap-3">
                    <Label htmlFor="custom-duration" className="text-sm font-medium text-blue-800">
                      Custom Duration:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="custom-duration"
                        type="number"
                        min="1"
                        max="90"
                        value={planDuration}
                        onChange={(e) => setPlanDuration(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-blue-700">days</span>
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                        Max: 90 days
                      </Badge>
                    </div>
                  </div>

                  {/* Duration Info */}
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        Your {planDuration}-day plan will include {planDuration * 3} total meals 
                        ({planDuration} breakfasts, {planDuration} lunches, {planDuration} snacks)
                      </span>
                    </div>
                    
                    {/* Duration Recommendations */}
                    <div className="text-xs text-blue-700">
                      {planDuration <= 7 && "Perfect for trying out the meal planner"}
                      {planDuration > 7 && planDuration <= 14 && "Great for reducing weekly meal planning stress"}
                      {planDuration > 14 && planDuration <= 21 && "Ideal for establishing healthy eating routines"}
                      {planDuration > 21 && "Excellent for long-term meal planning and maximum variety"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allergies */}
                <div>
                  <Label htmlFor="allergies">Allergies & Food Restrictions</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g., nuts, dairy, gluten (comma separated)"
                    onChange={(e) => handleArrayInputChange('allergies', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Dislikes */}
                <div>
                  <Label htmlFor="dislikes">Foods {kidName} Dislikes</Label>
                  <Input
                    id="dislikes"
                    placeholder="e.g., broccoli, fish, spicy food (comma separated)"
                    onChange={(e) => handleArrayInputChange('dislikes', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Favorites */}
                <div>
                  <Label htmlFor="favorites">{kidName}'s Favorite Foods</Label>
                  <Input
                    id="favorites"
                    placeholder="e.g., pasta, chicken, apples (comma separated)"
                    onChange={(e) => handleArrayInputChange('favorites', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* School Policy */}
                <div>
                  <Label htmlFor="school_policy">School Lunch Policy</Label>
                  <Select onValueChange={(value) => handleInputChange('school_lunch_policy', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select school policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="packed_lunch">Packed lunch allowed</SelectItem>
                      <SelectItem value="no_nuts">No nuts policy</SelectItem>
                      <SelectItem value="no_heating">No heating available</SelectItem>
                      <SelectItem value="vegetarian_only">Vegetarian only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prep Time */}
                <div>
                  <Label htmlFor="prep_time">Maximum Prep Time</Label>
                  <Select onValueChange={(value) => handleInputChange('prep_time_limit', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select prep time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5_minutes">5 minutes or less</SelectItem>
                      <SelectItem value="15_minutes">15 minutes</SelectItem>
                      <SelectItem value="30_minutes">30 minutes</SelectItem>
                      <SelectItem value="no_limit">No time limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select onValueChange={(value) => handleInputChange('budget_range', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget-friendly</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="premium">Premium ingredients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  placeholder="Any other special requirements, dietary needs, or preferences..."
                  value={planPreferences.special_requirements}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generatePlan}
                disabled={generating}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating {planDuration}-Day Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate {planDuration}-Day School Meal Plan
                  </>
                )}
              </Button>
              
              {/* Plan Preview */}
              {planDuration > 7 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Extended Plan Benefits</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• More variety with {planDuration * 3} unique meals</li>
                    <li>• Reduced meal planning stress for {Math.ceil(planDuration / 7)} weeks</li>
                    <li>• Better nutrition balance over longer period</li>
                    {planDuration >= 30 && <li>• Monthly meal planning with seasonal variety</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-500" />
                    Saved Meal Plans for {kidName}
                  </CardTitle>
                  <CardDescription>
                    Manage your saved meal plans and activate the one you want to use
                  </CardDescription>
                </div>
                <Button 
                  onClick={loadSavedPlans}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="text-blue-700 border-blue-300"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading plans...</span>
                </div>
              ) : savedPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Plans</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't created any meal plans for {kidName} yet.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('create')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPlans.map((plan) => (
                    <Card key={plan.id} className={`relative ${plan.is_active ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={plan.is_active ? "default" : "outline"}
                              className={plan.is_active ? "bg-green-500 text-white" : ""}
                            >
                              {plan.is_active ? (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Pause className="h-3 w-3 mr-1" />
                                  Saved
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {plan.duration} days
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePlan(plan.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-xs text-gray-500">
                            Created: {new Date(plan.created_at!).toLocaleDateString()}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => loadSavedPlan(plan.id)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            {plan.is_active ? (
                              <Button
                                size="sm"
                                onClick={() => deactivatePlan(plan.id)}
                                variant="outline"
                                className="flex-1 text-orange-600 border-orange-300"
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => activatePlan(plan.id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      
                      {plan.is_active && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <Crown className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan View Tab */}
        <TabsContent value="plan" className="space-y-6">
          {currentPlan ? (
            <div className="space-y-6">
              {/* Plan Header */}
              <Card className={`${activePlan?.id === currentPlanId ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className={activePlan?.id === currentPlanId ? 'text-green-800' : 'text-blue-800'}>
                            {currentPlan.title}
                          </CardTitle>
                          {activePlan?.id === currentPlanId && (
                            <Badge className="bg-green-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Active Plan
                            </Badge>
                          )}
                        </div>
                        <CardDescription className={activePlan?.id === currentPlanId ? 'text-green-700' : 'text-blue-700'}>
                          {currentPlan.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!currentPlanId && (
                        <Button 
                          size="sm" 
                          onClick={savePlan}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Save Plan
                        </Button>
                      )}
                      
                      {currentPlanId && activePlan?.id !== currentPlanId && (
                        <Button 
                          size="sm" 
                          onClick={() => activatePlan(currentPlanId)}
                          disabled={loading}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Activate
                        </Button>
                      )}
                      
                      {currentPlanId && activePlan?.id === currentPlanId && (
                        <Button 
                          size="sm" 
                          onClick={() => deactivatePlan(currentPlanId)}
                          disabled={loading}
                          variant="outline"
                          className="text-orange-600 border-orange-300"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Pause className="h-4 w-4 mr-1" />
                          )}
                          Deactivate
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline" className={activePlan?.id === currentPlanId ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" className={activePlan?.id === currentPlanId ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Daily Plans */}
              <div className="grid grid-cols-1 gap-6">
                {currentPlan.daily_plans.map((day, dayIndex) => (
                  <Card key={day.day} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-blue-800">
                            Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </CardTitle>
                          <CardDescription className="text-blue-700">
                            Total: {day.total_calories} calories • 
                            Protein: {day.nutrition_summary.protein}g • 
                            Calcium: {day.nutrition_summary.calcium}mg
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Breakfast */}
                        <MealCard 
                          meal={day.breakfast}
                          mealType="breakfast"
                          onReplace={() => replaceMeal(dayIndex, 'breakfast')}
                          onView={() => {
                            setSelectedMeal(day.breakfast);
                            setShowMealDialog(true);
                          }}
                          isGenerating={generating}
                        />

                        {/* Lunch */}
                        <MealCard 
                          meal={day.lunch}
                          mealType="lunch"
                          onReplace={() => replaceMeal(dayIndex, 'lunch')}
                          onView={() => {
                            setSelectedMeal(day.lunch);
                            setShowMealDialog(true);
                          }}
                          isGenerating={generating}
                        />

                        {/* Snack */}
                        <MealCard 
                          meal={day.snack}
                          mealType="snack"
                          onReplace={() => replaceMeal(dayIndex, 'snack')}
                          onView={() => {
                            setSelectedMeal(day.snack);
                            setShowMealDialog(true);
                          }}
                          isGenerating={generating}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Meal Plan Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create a personalized school meal plan for {kidName} to get started.
                </p>
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings 
            preferences={notificationPrefs}
            onPreferencesChange={setNotificationPrefs}
            kidName={kidName}
            onTestNotification={testNotifications}
          />
        </TabsContent>
      </Tabs>

      {/* Meal Detail Dialog */}
      {selectedMeal && (
        <MealDetailDialog 
          meal={selectedMeal}
          isOpen={showMealDialog}
          onClose={() => {
            setShowMealDialog(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </div>
  );
};

// Meal Card Component
const MealCard: React.FC<{
  meal: KidsMeal;
  mealType: string;
  onReplace: () => void;
  onView: () => void;
  isGenerating: boolean;
}> = ({ meal, mealType, onReplace, onView, isGenerating }) => {
  const getMealTypeColor = (type: string) => {
    const colors = {
      breakfast: 'from-yellow-50 to-orange-50 border-yellow-200',
      lunch: 'from-green-50 to-emerald-50 border-green-200',
      snack: 'from-purple-50 to-pink-50 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'from-gray-50 to-slate-50 border-gray-200';
  };

  const getMealTypeIcon = (type: string) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🥪',
      snack: '🍎'
    };
    return icons[type as keyof typeof icons] || '🍽️';
  };

  return (
    <Card className={`bg-gradient-to-br ${getMealTypeColor(mealType)} border-2 hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getMealTypeIcon(mealType)}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {mealType}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onView} className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onReplace}
              disabled={isGenerating}
              className="h-6 w-6 p-0"
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meal.emoji}</span>
            <h4 className="font-semibold text-sm">{meal.name}</h4>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{meal.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{meal.prep_time}</span>
            <span>•</span>
            <span>{meal.calories} cal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.floor(meal.kid_friendly_score / 2) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Kid-friendly</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Meal Detail Dialog Component
const MealDetailDialog: React.FC<{
  meal: KidsMeal;
  isOpen: boolean;
  onClose: () => void;
}> = ({ meal, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{meal.emoji}</span>
            {meal.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Meal Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{meal.calories}</div>
              <div className="text-xs text-blue-600">Calories</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{meal.prep_time}</div>
              <div className="text-xs text-green-600">Prep Time</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{meal.difficulty}</div>
              <div className="text-xs text-purple-600">Difficulty</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{meal.kid_friendly_score}/10</div>
              <div className="text-xs text-yellow-600">Kid Score</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-gray-700">{meal.description}</p>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-semibold mb-2">Ingredients</h4>
            <div className="grid grid-cols-2 gap-2">
              {meal.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-semibold mb-2">Instructions</h4>
            <ol className="space-y-2">
              {meal.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition */}
          <div>
            <h4 className="font-semibold mb-2">Nutrition Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-600">{meal.nutrition.protein}g</div>
                <div className="text-xs text-red-600">Protein</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="font-semibold text-yellow-600">{meal.nutrition.carbs}g</div>
                <div className="text-xs text-yellow-600">Carbs</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-600">{meal.nutrition.fat}g</div>
                <div className="text-xs text-purple-600">Fat</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-600">{meal.nutrition.fiber}g</div>
                <div className="text-xs text-green-600">Fiber</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-600">{meal.nutrition.calcium}mg</div>
                <div className="text-xs text-blue-600">Calcium</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-600">{meal.nutrition.iron}mg</div>
                <div className="text-xs text-orange-600">Iron</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          {meal.prep_tips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Prep Tips</h4>
              <ul className="space-y-1">
                {meal.prep_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Storage Tips */}
          {meal.storage_tips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Storage Tips</h4>
              <ul className="space-y-1">
                {meal.storage_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Allergens */}
          {meal.allergens.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Allergen Information</h4>
              <div className="flex flex-wrap gap-2">
                {meal.allergens.map((allergen, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC<{
  preferences: NotificationPreferences;
  onPreferencesChange: (prefs: NotificationPreferences) => void;
  kidName: string;
  onTestNotification: () => void;
}> = ({ preferences, onPreferencesChange, kidName, onTestNotification }) => {
  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-500" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Set up daily meal reminders for {kidName}'s school meals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Enable Notifications</Label>
            <p className="text-sm text-gray-600">Receive daily meal reminders</p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(checked) => updatePreference('enabled', checked)}
          />
        </div>

        {preferences.enabled && (
          <>
            {/* Breakfast Reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Breakfast Reminder</Label>
                  <p className="text-sm text-gray-600">Morning reminder for breakfast</p>
                </div>
                <Switch
                  checked={preferences.breakfast_reminder}
                  onCheckedChange={(checked) => updatePreference('breakfast_reminder', checked)}
                />
              </div>
              {preferences.breakfast_reminder && (
                <div className="ml-4">
                  <Label htmlFor="breakfast_time">Breakfast Time</Label>
                  <Input
                    id="breakfast_time"
                    type="time"
                    value={preferences.breakfast_time}
                    onChange={(e) => updatePreference('breakfast_time', e.target.value)}
                    className="w-32 mt-1"
                  />
                </div>
              )}
            </div>

            {/* Lunch Prep Reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Lunch Prep Reminder</Label>
                  <p className="text-sm text-gray-600">Evening reminder to prepare lunch</p>
                </div>
                <Switch
                  checked={preferences.lunch_prep_reminder}
                  onCheckedChange={(checked) => updatePreference('lunch_prep_reminder', checked)}
                />
              </div>
              {preferences.lunch_prep_reminder && (
                <div className="ml-4">
                  <Label htmlFor="lunch_prep_time">Lunch Prep Time</Label>
                  <Input
                    id="lunch_prep_time"
                    type="time"
                    value={preferences.lunch_prep_time}
                    onChange={(e) => updatePreference('lunch_prep_time', e.target.value)}
                    className="w-32 mt-1"
                  />
                </div>
              )}
            </div>

            {/* Snack Reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Snack Reminder</Label>
                  <p className="text-sm text-gray-600">After-school snack reminder</p>
                </div>
                <Switch
                  checked={preferences.snack_reminder}
                  onCheckedChange={(checked) => updatePreference('snack_reminder', checked)}
                />
              </div>
              {preferences.snack_reminder && (
                <div className="ml-4">
                  <Label htmlFor="snack_time">Snack Time</Label>
                  <Input
                    id="snack_time"
                    type="time"
                    value={preferences.snack_time}
                    onChange={(e) => updatePreference('snack_time', e.target.value)}
                    className="w-32 mt-1"
                  />
                </div>
              )}
            </div>

            {/* Weekend Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Weekend Notifications</Label>
                <p className="text-sm text-gray-600">Include Saturday and Sunday</p>
              </div>
              <Switch
                checked={preferences.weekend_notifications}
                onCheckedChange={(checked) => updatePreference('weekend_notifications', checked)}
              />
            </div>

            {/* Test Notification */}
            <div className="pt-4 border-t">
              <Button 
                onClick={onTestNotification}
                variant="outline"
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KidsSchoolMealPlanner;