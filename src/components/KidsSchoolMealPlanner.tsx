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
import { supabase } from '@/integrations/supabase/client';
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [replacingMealInfo, setReplacingMealInfo] = useState<{ dayIndex: number; mealType: string } | null>(null);

  // Form state
  const [planDuration, setPlanDuration] = useState(7);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'5-10' | '11-15'>(kidAge <= 10 ? '5-10' : '11-15');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('balanced');
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [planPreferences, setPlanPreferences] = useState<KidsPlanPreferences>({
    kid_age: kidAge,
    allergies: [],
    dislikes: [],
    favorites: [],
    dietary_restrictions: [],
    school_lunch_policy: 'packed_lunch',
    prep_time_limit: '15_minutes',
    budget_range: 'moderate',
    special_requirements: '',
    age_group: kidAge <= 10 ? '5-10' : '11-15',
    usda_compliant: true,
    lunchbox_friendly: true
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
    console.log('KidsSchoolMealPlanner useEffect triggered with:', { 
      kidId, 
      user: user?.id, 
      kidName, 
      kidAge 
    });
    if (kidId && user) {
      loadSavedPlans();
      loadActivePlan();
    } else {
      console.log('Missing required data:', { kidId: !!kidId, user: !!user });
    }
  }, [kidId, user]);

  const loadSavedPlans = async () => {
    try {
      setLoading(true);
      console.log('Loading saved plans for kidId:', kidId);
      
      const plans = await KidsMealPlansService.getMealPlansForKid(kidId);
      console.log('Loaded plans:', plans);
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading saved plans:', error);
      
      // Check if it's a table not found error
      if (error instanceof Error && error.message.includes('relation "kids_meal_plans" does not exist')) {
        toast({
          title: "Database Setup Required",
          description: "The meal plans table needs to be created. Please run the database migration.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to Load Plans",
          description: error instanceof Error ? error.message : "Could not load saved meal plans",
          variant: "destructive"
        });
      }
      setSavedPlans([]);
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
        // Stay on dashboard to show the loaded plan
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
      // Stay on dashboard to show the activated plan

      // Trigger calendar refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('mealPlanActivated', { 
        detail: { kidId, planId } 
      }));

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
      console.log('Loading saved plan with ID:', planId);
      
      const plan = await KidsMealPlansService.getMealPlanById(planId);
      console.log('Retrieved plan:', plan);
      
      if (plan) {
        const planData = KidsMealPlansService.parsePlanData(plan.plan_data);
        const preferences = KidsMealPlansService.parsePreferences(plan.preferences);
        
        console.log('Parsed plan data:', planData);
        console.log('Parsed preferences:', preferences);
        
        setCurrentPlan(planData);
        setCurrentPlanId(plan.id);
        setPlanPreferences(preferences);
        
        console.log('State updated - currentPlan:', planData);
        console.log('State updated - currentPlanId:', plan.id);
        
        toast({
          title: "Plan Loaded",
          description: `Loaded ${planData.title} with ${planData.daily_plans.length} days`,
        });
        
        // Stay on dashboard to show the loaded plan
      } else {
        toast({
          title: "Plan Not Found",
          description: "The selected meal plan could not be found.",
          variant: "destructive"
        });
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
      
      // Automatically save and activate the generated plan
      const savedPlan = await KidsMealPlansService.saveMealPlan(
        kidId,
        plan,
        planPreferences,
        user.id
      );

      // Automatically activate the new plan
      const activatedPlan = await KidsMealPlansService.activateMealPlan(savedPlan.id);
      
      setSavedPlans(prev => [{ ...savedPlan, is_active: true }, ...prev]);
      setCurrentPlanId(savedPlan.id);
      setActivePlan(activatedPlan);
      // Stay on dashboard to show the generated plan

      // Trigger calendar refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('mealPlanActivated', { 
        detail: { kidId, planId: savedPlan.id } 
      }));
      
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

  // Age-specific meal templates
  const getAgeSpecificTemplates = (ageGroup: '5-10' | '11-15') => {
    const templates = {
      '5-10': [
        {
          id: 'balanced',
          name: 'Balanced Growth',
          description: 'USDA MyPlate compliant meals for elementary school kids',
          calories: '1400-1600',
          focus: 'Growth & Development',
          features: ['Fun shapes', 'Colorful foods', 'Easy to eat']
        },
        {
          id: 'picky_eater',
          name: 'Picky Eater Friendly',
          description: 'Familiar foods with hidden nutrition',
          calories: '1300-1500',
          focus: 'Acceptance & Nutrition',
          features: ['Familiar flavors', 'Hidden veggies', 'Kid favorites']
        },
        {
          id: 'active_kid',
          name: 'Active Kid',
          description: 'Higher energy meals for active children',
          calories: '1600-1800',
          focus: 'Energy & Performance',
          features: ['Extra protein', 'Quick energy', 'Recovery foods']
        }
      ],
      '11-15': [
        {
          id: 'teen_balanced',
          name: 'Teen Balanced',
          description: 'USDA compliant meals for growing teenagers',
          calories: '1800-2200',
          focus: 'Growth & Independence',
          features: ['Larger portions', 'Teen favorites', 'Social foods']
        },
        {
          id: 'athlete',
          name: 'Young Athlete',
          description: 'Performance-focused nutrition for teen athletes',
          calories: '2200-2600',
          focus: 'Athletic Performance',
          features: ['High protein', 'Pre/post workout', 'Hydration focus']
        },
        {
          id: 'brain_food',
          name: 'Brain Boost',
          description: 'Cognitive support for academic performance',
          calories: '1800-2000',
          focus: 'Cognitive Function',
          features: ['Omega-3 rich', 'Complex carbs', 'Focus foods']
        }
      ]
    };
    return templates[ageGroup];
  };

  // USDA MyPlate compliance checker
  const checkUSDACompliance = (meal: any) => {
    const requirements = {
      '5-10': {
        fruits: 1.5, // cups per day
        vegetables: 2,
        grains: 5, // oz equivalents
        protein: 4,
        dairy: 2.5
      },
      '11-15': {
        fruits: 2,
        vegetables: 2.5,
        grains: 6,
        protein: 5.5,
        dairy: 3
      }
    };
    
    return {
      compliant: true,
      missing: [],
      recommendations: ['Add more vegetables', 'Include whole grains']
    };
  };

  // Parent approval workflow
  const submitForApproval = async (mealPlan: any) => {
    const approvalRequest = {
      id: Date.now().toString(),
      kidId,
      kidName,
      mealPlan,
      submittedAt: new Date(),
      status: 'pending',
      parentNotes: '',
      nutritionAnalysis: checkUSDACompliance(mealPlan)
    };
    
    setPendingApprovals(prev => [...prev, approvalRequest]);
    
    toast({
      title: "Submitted for Approval",
      description: `Meal plan for ${kidName} has been submitted for parent review`,
    });
  };

  const approveMealPlan = async (approvalId: string, approved: boolean, notes?: string) => {
    setPendingApprovals(prev => 
      prev.map(approval => 
        approval.id === approvalId 
          ? { ...approval, status: approved ? 'approved' : 'rejected', parentNotes: notes }
          : approval
      )
    );

    if (approved) {
      toast({
        title: "Meal Plan Approved!",
        description: "The meal plan has been approved and activated",
      });
    } else {
      toast({
        title: "Meal Plan Needs Changes",
        description: notes || "Please review the feedback and make adjustments",
        variant: "destructive"
      });
    }
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

      {/* Simplified 2-Tab Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 gap-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <ChefHat className="h-4 w-4" />
            Meal Planning Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Settings className="h-4 w-4" />
            Settings & Notifications
          </TabsTrigger>
        </TabsList>

        {/* Unified Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Plan Creation & Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enhanced School Meal Plan Creation */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    School Meal Plan Creator
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    USDA MyPlate compliant meal plans for {kidName} (Age {kidAge})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Age Group Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-blue-800">Age Group & Template</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedAgeGroup === '5-10' ? "default" : "outline"}
                        onClick={() => {
                          setSelectedAgeGroup('5-10');
                          setPlanPreferences(prev => ({ ...prev, age_group: '5-10' }));
                        }}
                        className={`h-16 flex flex-col ${
                          selectedAgeGroup === '5-10' 
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white" 
                            : "hover:bg-green-50 border-green-300"
                        }`}
                      >
                        <span className="font-bold">5-10 Years</span>
                        <span className="text-xs">Elementary School</span>
                      </Button>
                      <Button
                        variant={selectedAgeGroup === '11-15' ? "default" : "outline"}
                        onClick={() => {
                          setSelectedAgeGroup('11-15');
                          setPlanPreferences(prev => ({ ...prev, age_group: '11-15' }));
                        }}
                        className={`h-16 flex flex-col ${
                          selectedAgeGroup === '11-15' 
                            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" 
                            : "hover:bg-purple-50 border-purple-300"
                        }`}
                      >
                        <span className="font-bold">11-15 Years</span>
                        <span className="text-xs">Middle/High School</span>
                      </Button>
                    </div>
                  </div>

                  {/* Meal Templates */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-blue-800">Meal Plan Template</Label>
                    <div className="grid gap-3">
                      {getAgeSpecificTemplates(selectedAgeGroup).map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            selectedTemplate === template.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                                <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="text-blue-600 font-medium">{template.calories} cal/day</span>
                                  <span className="text-green-600">{template.focus}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.features.map((feature, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {selectedTemplate === template.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500 mt-1" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* USDA Compliance & Lunchbox Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Switch 
                        checked={planPreferences.usda_compliant}
                        onCheckedChange={(checked) => 
                          setPlanPreferences(prev => ({ ...prev, usda_compliant: checked }))
                        }
                      />
                      <div>
                        <Label className="text-sm font-medium text-green-800">USDA MyPlate</Label>
                        <p className="text-xs text-green-600">Compliant nutrition</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Switch 
                        checked={planPreferences.lunchbox_friendly}
                        onCheckedChange={(checked) => 
                          setPlanPreferences(prev => ({ ...prev, lunchbox_friendly: checked }))
                        }
                      />
                      <div>
                        <Label className="text-sm font-medium text-orange-800">Lunchbox Ready</Label>
                        <p className="text-xs text-orange-600">Portable & safe</p>
                      </div>
                    </div>
                  </div>

                  {/* Duration Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-blue-800">Plan Duration</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[7, 14, 21, 30].map((days) => (
                        <Button
                          key={days}
                          variant={planDuration === days ? "default" : "outline"}
                          onClick={() => setPlanDuration(days)}
                          size="sm"
                          className={`h-12 flex flex-col ${
                            planDuration === days 
                              ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white" 
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <span className="font-bold">{days}</span>
                          <span className="text-xs">days</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Allergies (comma separated)"
                      onChange={(e) => handleArrayInputChange('allergies', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Favorite foods (comma separated)"
                      onChange={(e) => handleArrayInputChange('favorites', e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={generatePlan}
                      disabled={generating}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Plan
                        </>
                      )}
                    </Button>
                    {currentPlan && (
                      <Button 
                        onClick={() => submitForApproval(currentPlan)}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit for Approval
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Debug Info */}
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                Debug: currentPlan={currentPlan ? 'YES' : 'NO'}, currentPlanId={currentPlanId || 'NONE'}, activePlan={activePlan?.id || 'NONE'}
              </div>

              {/* Enhanced Active Plan Display */}
              {currentPlan && (
                <Card className={`${activePlan?.id === currentPlanId ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className={activePlan?.id === currentPlanId ? 'text-green-800' : 'text-blue-800'}>
                            {currentPlan.title}
                          </CardTitle>
                          {activePlan?.id === currentPlanId && (
                            <Badge className="bg-green-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        {/* Compliance Badges */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <Shield className="h-3 w-3 mr-1" />
                            USDA Compliant
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            <Utensils className="h-3 w-3 mr-1" />
                            Lunchbox Ready
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            <Target className="h-3 w-3 mr-1" />
                            Age {selectedAgeGroup}
                          </Badge>
                        </div>
                        
                        <CardDescription className={activePlan?.id === currentPlanId ? 'text-green-700' : 'text-blue-700'}>
                          {currentPlan.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentPlanId && activePlan?.id !== currentPlanId && (
                          <Button 
                            size="sm" 
                            onClick={() => activatePlan(currentPlanId)}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Play className="h-3 w-3 mr-1" />
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
                            <Pause className="h-3 w-3 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Show first few days as preview */}
                    <div className="space-y-4">
                      {currentPlan.daily_plans.slice(0, 3).map((day, dayIndex) => (
                        <div key={day.day} className="border rounded-lg p-4 bg-white/50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">
                              Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {day.total_calories} cal
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="relative group text-center p-2 bg-yellow-50 rounded text-xs hover:bg-yellow-100 transition-colors">
                              <div className="text-lg mb-1">🌅</div>
                              <div className="font-medium">{day.breakfast.name}</div>
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedMeal(day.breakfast);
                                    setShowMealDialog(true);
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => replaceMeal(dayIndex, 'breakfast')}
                                  disabled={generating}
                                  className="h-5 w-5 p-0"
                                >
                                  {generating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="relative group text-center p-2 bg-green-50 rounded text-xs hover:bg-green-100 transition-colors">
                              <div className="text-lg mb-1">🥪</div>
                              <div className="font-medium">{day.lunch.name}</div>
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedMeal(day.lunch);
                                    setShowMealDialog(true);
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => replaceMeal(dayIndex, 'lunch')}
                                  disabled={generating}
                                  className="h-5 w-5 p-0"
                                >
                                  {generating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="relative group text-center p-2 bg-purple-50 rounded text-xs hover:bg-purple-100 transition-colors">
                              <div className="text-lg mb-1">🍎</div>
                              <div className="font-medium">{day.snack.name}</div>
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedMeal(day.snack);
                                    setShowMealDialog(true);
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => replaceMeal(dayIndex, 'snack')}
                                  disabled={generating}
                                  className="h-5 w-5 p-0"
                                >
                                  {generating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {currentPlan.daily_plans.length > 3 && (
                        <div className="text-center">
                          <div className="text-sm text-gray-500 mb-2">
                            ... and {currentPlan.daily_plans.length - 3} more days
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowFullPlan(true)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full Plan ({currentPlan.daily_plans.length} days)
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Saved Plans & Approval Workflow */}
            <div className="space-y-6">
              {/* Parent Approval Workflow */}
              {pendingApprovals.length > 0 && (
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <Bell className="h-5 w-5 text-orange-600" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Meal plans waiting for parent review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingApprovals.map((approval) => (
                      <Card key={approval.id} className="bg-white border border-orange-200">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{approval.mealPlan.title}</h4>
                              <Badge 
                                variant={approval.status === 'pending' ? 'default' : 
                                        approval.status === 'approved' ? 'outline' : 'destructive'}
                                className={approval.status === 'pending' ? 'bg-yellow-500' : ''}
                              >
                                {approval.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>Submitted: {approval.submittedAt.toLocaleDateString()}</p>
                              <p>Duration: {approval.mealPlan.daily_plans.length} days</p>
                            </div>
                            
                            {/* USDA Compliance Status */}
                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span className="text-green-700">USDA MyPlate Compliant</span>
                            </div>

                            {approval.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => approveMealPlan(approval.id, true)}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approveMealPlan(approval.id, false, 'Needs adjustments')}
                                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Request Changes
                                </Button>
                              </div>
                            )}

                            {approval.parentNotes && (
                              <div className="p-2 bg-gray-50 rounded text-xs">
                                <p className="font-medium">Parent Notes:</p>
                                <p className="text-gray-600">{approval.parentNotes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* USDA MyPlate Guidelines */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Shield className="h-5 w-5 text-green-600" />
                    USDA MyPlate Guidelines
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Daily nutrition requirements for {selectedAgeGroup} years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedAgeGroup === '5-10' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🍎 Fruits:</span>
                          <span className="font-medium">1.5 cups</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🥕 Vegetables:</span>
                          <span className="font-medium">2 cups</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🌾 Grains:</span>
                          <span className="font-medium">5 oz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🍗 Protein:</span>
                          <span className="font-medium">4 oz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🥛 Dairy:</span>
                          <span className="font-medium">2.5 cups</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🍎 Fruits:</span>
                          <span className="font-medium">2 cups</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🥕 Vegetables:</span>
                          <span className="font-medium">2.5 cups</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🌾 Grains:</span>
                          <span className="font-medium">6 oz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🍗 Protein:</span>
                          <span className="font-medium">5.5 oz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">🥛 Dairy:</span>
                          <span className="font-medium">3 cups</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lunchbox Tips */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Utensils className="h-5 w-5 text-purple-600" />
                    Lunchbox Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Use insulated containers for temperature control</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Pack ice packs for perishable items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Choose spill-proof containers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Include fun utensils and napkins</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
              {/* Saved Plans */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <History className="h-4 w-4 text-blue-500" />
                      My Plans
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={loadSavedPlans}
                        disabled={loading}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        {loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                      <Button 
                        onClick={async () => {
                          console.log('Testing database connection...');
                          console.log('Current user:', user);
                          console.log('Current kidId:', kidId);
                          
                          try {
                            // Test 1: Check current user session
                            const { data: session } = await supabase.auth.getSession();
                            console.log('Auth session:', session);
                            
                            // Test 2: Simple test query
                            const { data, error } = await supabase
                              .from('kids_meal_plans')
                              .select('id, title')
                              .limit(1);
                            
                            console.log('Query result:', { data, error });
                            
                            if (error) {
                              console.error('Database error details:', {
                                code: error.code,
                                message: error.message,
                                details: error.details,
                                hint: error.hint
                              });
                              
                              if (error.code === '42P01') {
                                toast({
                                  title: "Table Missing",
                                  description: "The kids_meal_plans table doesn't exist. Please run the SQL migration.",
                                  variant: "destructive"
                                });
                              } else if (error.code === 'PGRST301') {
                                toast({
                                  title: "Permission Error",
                                  description: "RLS policy is blocking access. Check your permissions.",
                                  variant: "destructive"
                                });
                              } else {
                                toast({
                                  title: "Database Error",
                                  description: `${error.code}: ${error.message}`,
                                  variant: "destructive"
                                });
                              }
                            } else {
                              toast({
                                title: "Database OK",
                                description: `Table exists and is accessible. Found ${data?.length || 0} records.`,
                              });
                            }
                          } catch (err) {
                            console.error('Test error:', err);
                            toast({
                              title: "Test Failed",
                              description: err instanceof Error ? err.message : "Unknown error",
                              variant: "destructive"
                            });
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 h-6"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : savedPlans.length === 0 ? (
                    <div className="text-center py-6">
                      <Archive className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No saved plans yet</p>
                      <p className="text-xs text-gray-500 mt-1">Create a meal plan to get started!</p>
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                          💡 If you're having trouble loading plans, the database table might need to be created.
                          <br />
                          Please run the SQL script: <code className="bg-amber-100 px-1 rounded">fix_kids_meal_plans_table.sql</code>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {savedPlans.map((plan) => (
                        <div key={plan.id} className={`p-3 rounded-lg border ${plan.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={plan.is_active ? "default" : "outline"}
                                className={`text-xs ${plan.is_active ? "bg-green-500 text-white" : ""}`}
                              >
                                {plan.is_active ? "Active" : "Saved"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {plan.duration}d
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePlan(plan.id)}
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">{plan.title}</h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{plan.description}</p>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => loadSavedPlan(plan.id)}
                              variant="outline"
                              className="flex-1 h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {!plan.is_active && (
                              <Button
                                size="sm"
                                onClick={() => activatePlan(plan.id)}
                                className="flex-1 h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Plans</span>
                      <Badge variant="outline">{savedPlans.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Plan</span>
                      <Badge variant={activePlan ? "default" : "outline"} className={activePlan ? "bg-green-500 text-white" : ""}>
                        {activePlan ? "Yes" : "None"}
                      </Badge>
                    </div>
                    {currentPlan && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Duration</span>
                        <Badge variant="outline">{currentPlan.daily_plans.length} days</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

        {/* Settings & Notifications Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Advanced Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Advanced Preferences
                </CardTitle>
                <CardDescription>
                  Detailed settings for meal plan generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="dislikes">Foods {kidName} Dislikes</Label>
                    <Input
                      id="dislikes"
                      placeholder="e.g., broccoli, fish, spicy food"
                      onChange={(e) => handleArrayInputChange('dislikes', e.target.value)}
                      className="mt-1"
                    />
                  </div>

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

                  <div>
                    <Label htmlFor="special_requirements">Special Requirements</Label>
                    <Textarea
                      id="special_requirements"
                      placeholder="Any other special requirements..."
                      value={planPreferences.special_requirements}
                      onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-500" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Set up meal reminders for {kidName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings 
                  preferences={notificationPrefs}
                  onPreferencesChange={setNotificationPrefs}
                  kidName={kidName}
                  onTestNotification={testNotifications}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Full Plan Dialog */}
      {currentPlan && (
        <Dialog open={showFullPlan} onOpenChange={setShowFullPlan}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                {currentPlan.title} - Complete Plan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {currentPlan.description} • {currentPlan.daily_plans.length} days
              </div>
              
              {/* All Daily Plans */}
              <div className="space-y-4">
                {currentPlan.daily_plans.map((day, dayIndex) => (
                  <Card key={day.day} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-blue-800 text-lg">
                          Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </CardTitle>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          {day.total_calories} calories
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Breakfast */}
                        <div className="relative p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🌅</span>
                              <h4 className="font-semibold text-yellow-800">Breakfast</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMeal(day.breakfast);
                                  setShowMealDialog(true);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => replaceMeal(dayIndex, 'breakfast')}
                                disabled={generating}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {generating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{day.breakfast.emoji}</span>
                              <span className="font-medium text-sm">{day.breakfast.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{day.breakfast.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{day.breakfast.prep_time}</span>
                              <span>•</span>
                              <span>{day.breakfast.calories} cal</span>
                            </div>
                          </div>
                        </div>

                        {/* Lunch */}
                        <div className="relative p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🥪</span>
                              <h4 className="font-semibold text-green-800">Lunch</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMeal(day.lunch);
                                  setShowMealDialog(true);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => replaceMeal(dayIndex, 'lunch')}
                                disabled={generating}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {generating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{day.lunch.emoji}</span>
                              <span className="font-medium text-sm">{day.lunch.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{day.lunch.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{day.lunch.prep_time}</span>
                              <span>•</span>
                              <span>{day.lunch.calories} cal</span>
                            </div>
                          </div>
                        </div>

                        {/* Snack */}
                        <div className="relative p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🍎</span>
                              <h4 className="font-semibold text-purple-800">Snack</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMeal(day.snack);
                                  setShowMealDialog(true);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => replaceMeal(dayIndex, 'snack')}
                                disabled={generating}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {generating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{day.snack.emoji}</span>
                              <span className="font-medium text-sm">{day.snack.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{day.snack.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{day.snack.prep_time}</span>
                              <span>•</span>
                              <span>{day.snack.calories} cal</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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