import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { generateDietPlan, generatePlanEmbedding } from "@/api/generate-diet-plan";
import AdultDietCalendar from "./AdultDietCalendar";
import { 
  Brain, 
  Upload, 
  FileText, 
  Calendar, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Heart, 
  Zap,
  Clock,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  Download,
  Share2,
  Trash2,
  Play,
  Star,
  Crown,
  ChefHat,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Filter,
  BookOpen,
  Lightbulb,
  Shield,
  Rocket
} from "lucide-react";

interface PlanPreferences {
  planType: string;
  duration: string;
  targetCalories: string;
  dietaryRestrictions: string;
  healthGoals: string;
  activityLevel: string;
  specialRequirements: string;
  mealPreferences: string;
  budgetRange: string;
  cookingSkill: string;
}

interface UploadedFile {
  id: string;
  name: string;
  planName: string;
  fileType: string;
  size: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
}

interface GeneratedPlan {
  id: string;
  title: string;
  description?: string | null;
  plan_content?: any | null;
  duration?: string | null;
  calories?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  embedding?: any | null;
  status?: 'active' | 'completed' | 'draft';
  progress?: number;
}

const ProfessionalDietPlans: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [activeTab, setActiveTab] = useState('ai-generator');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingText, setSubmittingText] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Form data
  const [planPreferences, setPlanPreferences] = useState<PlanPreferences>({
    planType: '',
    duration: '30 days',
    targetCalories: '',
    dietaryRestrictions: '',
    healthGoals: '',
    activityLevel: '',
    specialRequirements: '',
    mealPreferences: '',
    budgetRange: '',
    cookingSkill: ''
  });

  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textPlanName, setTextPlanName] = useState('');
  const [sessionUploads, setSessionUploads] = useState<UploadedFile[]>([]);

  // Plans data
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<GeneratedPlan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Configuration options
  const planTypes = [
    { value: "weight-loss", label: "Weight Loss", icon: "🎯", description: "Calorie-controlled plans for healthy weight reduction" },
    { value: "muscle-building", label: "Muscle Building", icon: "💪", description: "High-protein plans for muscle growth and strength" },
    { value: "maintenance", label: "Maintenance", icon: "⚖️", description: "Balanced nutrition for maintaining current weight" },
    { value: "athletic-performance", label: "Athletic Performance", icon: "🏃", description: "Optimized nutrition for peak athletic performance" },
    { value: "vegetarian", label: "Vegetarian", icon: "🥬", description: "Plant-based nutrition plans" },
    { value: "vegan", label: "Vegan", icon: "🌱", description: "100% plant-based meal plans" },
    { value: "keto", label: "Ketogenic", icon: "🥑", description: "Low-carb, high-fat ketogenic diet plans" },
    { value: "mediterranean", label: "Mediterranean", icon: "🫒", description: "Heart-healthy Mediterranean-style nutrition" },
    { value: "paleo", label: "Paleo", icon: "🦴", description: "Whole foods, ancestral-style eating" },
    { value: "gluten-free", label: "Gluten-Free", icon: "🌾", description: "Celiac-safe, gluten-free meal plans" }
  ];

  const durations = [
    { value: "1 week", label: "1 Week", description: "Quick start plan" },
    { value: "2 weeks", label: "2 Weeks", description: "Short-term goals" },
    { value: "30 days", label: "30 Days", description: "Most popular" },
    { value: "8 weeks", label: "8 Weeks", description: "Habit formation" },
    { value: "12 weeks", label: "12 Weeks", description: "Transformation plan" },
    { value: "6 months", label: "6 Months", description: "Long-term lifestyle" }
  ];

  const activityLevels = [
    { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
    { value: "lightly-active", label: "Lightly Active", description: "Light exercise 1-3 days/week" },
    { value: "moderately-active", label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
    { value: "very-active", label: "Very Active", description: "Hard exercise 6-7 days/week" },
    { value: "extremely-active", label: "Extremely Active", description: "Very hard exercise, physical job" }
  ];

  const cookingSkills = [
    { value: "beginner", label: "Beginner", description: "Simple, quick recipes" },
    { value: "intermediate", label: "Intermediate", description: "Moderate cooking skills" },
    { value: "advanced", label: "Advanced", description: "Complex recipes welcome" }
  ];

  const budgetRanges = [
    { value: "budget", label: "Budget-Friendly", description: "Under $50/week" },
    { value: "moderate", label: "Moderate", description: "$50-100/week" },
    { value: "premium", label: "Premium", description: "$100+/week" }
  ];

  // Helper functions for generating unique content
  const getSeasonalNote = () => {
    const month = new Date().getMonth();
    const seasons = [
      'Focus on winter comfort foods with warming spices', // Dec, Jan, Feb
      'Focus on winter comfort foods with warming spices',
      'Focus on winter comfort foods with warming spices',
      'Incorporate fresh spring vegetables and lighter meals', // Mar, Apr, May
      'Incorporate fresh spring vegetables and lighter meals',
      'Incorporate fresh spring vegetables and lighter meals',
      'Emphasize fresh summer produce and cooling foods', // Jun, Jul, Aug
      'Emphasize fresh summer produce and cooling foods',
      'Emphasize fresh summer produce and cooling foods',
      'Include autumn harvest ingredients and hearty meals', // Sep, Oct, Nov
      'Include autumn harvest ingredients and hearty meals',
      'Include autumn harvest ingredients and hearty meals'
    ];
    return seasons[month];
  };

  const getVarietyFocus = () => {
    const focuses = [
      'international cuisine diversity',
      'colorful, visually appealing presentations',
      'texture variety in each meal',
      'unique flavor combinations',
      'creative use of herbs and spices',
      'innovative cooking methods',
      'fusion cuisine elements',
      'regional specialty dishes',
      'plant-forward creativity',
      'protein variety and preparation styles'
    ];
    return focuses[Math.floor(Math.random() * focuses.length)];
  };

  // Load existing plans
  useEffect(() => {
    if (user?.id) {
      loadGeneratedPlans();
    }
  }, [user?.id]);

  const loadGeneratedPlans = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for loading plans');
      return;
    }
    
    console.log('🔍 Loading plans for user:', user.id);
    setLoadingPlans(true);
    try {
      const { data: plans, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading plans:', error);
        toast({
          title: "Error",
          description: "Failed to load your diet plans",
          variant: "destructive"
        });
      } else {
        const processedPlans: GeneratedPlan[] = (plans || []).map(plan => ({
          ...plan,
          status: (plan.is_active ? 'active' : 'draft') as 'active' | 'completed' | 'draft',
          progress: plan.is_active ? Math.floor(Math.random() * 100) : 0
        }));
        setGeneratedPlans(processedPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleInputChange = (field: keyof PlanPreferences, value: string) => {
    setPlanPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePlanPreferences = () => {
    const required = ['planType', 'duration', 'activityLevel'];
    for (const field of required) {
      if (!planPreferences[field as keyof PlanPreferences]) {
        toast({
          title: "Missing Information",
          description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  // Helper function to save plan with fallback
  const savePlanToDatabase = async (planData: any, aiPlanData: any) => {
    console.log('💾 Attempting to save plan to database...');
    
    // First try with embedding
    let { data: savedPlan, error: saveError } = await supabase
      .from('nutrition_plans')
      .insert(planData)
      .select()
      .single();

    // If save failed and we have embedding, try without embedding
    if (saveError && planData.embedding) {
      console.warn('⚠️ Save failed with embedding, trying without embedding...');
      const planDataWithoutEmbedding = { ...planData };
      delete planDataWithoutEmbedding.embedding;
      
      const result = await supabase
        .from('nutrition_plans')
        .insert(planDataWithoutEmbedding)
        .select()
        .single();
      
      savedPlan = result.data;
      saveError = result.error;
      
      if (!saveError) {
        console.log('✅ Plan saved successfully without embedding');
      }
    }

    return { savedPlan, saveError };
  };

  const generateAIPlan = async () => {
    if (!validatePlanPreferences()) return;
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate AI diet plans",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      // Test database connection first
      console.log('🔍 Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('nutrition_plans')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('✅ Database connection test passed');
      
      // Get user profile for personalization
      console.log('👤 Getting user profile...');
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Create comprehensive user context with unique elements
      const currentDate = new Date().toISOString().split('T')[0];
      const requestId = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const seasonalNote = getSeasonalNote();
      const varietyFocus = getVarietyFocus();
      
      const userContext = `
        UNIQUE REQUEST IDENTIFIER: ${requestId}
        GENERATION DATE: ${currentDate}
        SEASONAL FOCUS: ${seasonalNote}
        VARIETY EMPHASIS: ${varietyFocus}

        User Profile:
        - Name: ${profile?.full_name || 'User'}
        - Age: ${profile?.age || 'Not specified'}
        - Weight: ${profile?.weight || 'Not specified'} ${profile?.weight_unit || 'kg'}
        - Height: ${profile?.height || 'Not specified'} cm
        - Current Activity Level: ${profile?.activity_level || 'moderate'}
        - Health Goals: ${profile?.health_goals || 'General wellness'}
        - Dietary Restrictions: ${profile?.dietary_restrictions || 'None'}

        Plan Requirements:
        - Plan Type: ${planPreferences.planType}
        - Duration: ${planPreferences.duration}
        - Target Calories: ${planPreferences.targetCalories || 'Not specified - use recommended amount based on goals and activity level'} per day
        - Activity Level: ${planPreferences.activityLevel}
        - Dietary Restrictions: ${planPreferences.dietaryRestrictions || 'None'}
        - Health Goals: ${planPreferences.healthGoals || 'General health'}
        - Special Requirements: ${planPreferences.specialRequirements || 'None'}
        - Meal Preferences: ${planPreferences.mealPreferences || 'No specific preferences'}
        - Budget Range: ${planPreferences.budgetRange || 'Moderate'}
        - Cooking Skill: ${planPreferences.cookingSkill || 'Intermediate'}

        CREATIVITY REQUIREMENTS:
        - Generate completely unique meals for this specific request
        - Avoid repeating common meal patterns
        - Include creative ingredient combinations
        - Focus on ${varietyFocus}
        - Consider ${seasonalNote}
        
        INSTRUCTIONS: Generate a complete, professional diet plan with detailed daily meals, recipes, shopping lists, and nutritional information. Ensure variety, balance, and adherence to all specified requirements. This must be a completely original plan - do not reuse any previous meal combinations.
      `;

      // Generate AI plan
      console.log('🤖 Generating AI plan...');
      const aiPlanData = await generateDietPlan(userContext, user.id);
      console.log('✅ AI plan generated successfully:', aiPlanData);
      console.log('📊 Plan structure details:', {
        title: aiPlanData.title,
        duration: aiPlanData.duration,
        dailyMealsCount: aiPlanData.dailyMeals?.length || 0,
        firstDay: aiPlanData.dailyMeals?.[0] ? {
          day: aiPlanData.dailyMeals[0].day,
          date: aiPlanData.dailyMeals[0].date,
          mealsCount: aiPlanData.dailyMeals[0].meals?.length || 0
        } : 'No first day',
        lastDay: aiPlanData.dailyMeals?.length > 0 ? {
          day: aiPlanData.dailyMeals[aiPlanData.dailyMeals.length - 1].day,
          date: aiPlanData.dailyMeals[aiPlanData.dailyMeals.length - 1].date,
          mealsCount: aiPlanData.dailyMeals[aiPlanData.dailyMeals.length - 1].meals?.length || 0
        } : 'No last day'
      });
      
      // Validate AI plan data
      if (!aiPlanData || typeof aiPlanData !== 'object') {
        throw new Error('Invalid AI plan data received');
      }
      
      console.log('✅ AI plan data validation passed');
      
      // Generate embedding for search functionality
      console.log('🔍 Generating embedding...');
      let embedding;
      let embeddingForDb = null;
      
      try {
        embedding = await generatePlanEmbedding(aiPlanData);
        console.log('✅ Embedding generated, length:', embedding.length);
        
        // Ensure embedding is valid
        if (Array.isArray(embedding) && embedding.length > 0) {
          embeddingForDb = `{${embedding.join(",")}}`;
        } else {
          console.warn('⚠️ Invalid embedding generated, using null');
          embeddingForDb = null;
        }
      } catch (embeddingError) {
        console.error('❌ Error generating embedding:', embeddingError);
        embeddingForDb = null; // Continue without embedding
      }

      // Prepare plan data for database
      const planData = {
        user_id: user.id,
        title: `${planPreferences.planType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plan`,
        description: aiPlanData.description || `Personalized ${planPreferences.planType} plan for ${planPreferences.duration}`,
        plan_content: aiPlanData,
        duration: planPreferences.duration,
        calories: planPreferences.targetCalories || 'Recommended',
        is_active: true,
        ...(embeddingForDb && { embedding: embeddingForDb as unknown as string })
      };

      console.log('💾 Saving plan to database...', {
        user_id: planData.user_id,
        title: planData.title,
        hasContent: !!planData.plan_content,
        hasEmbedding: !!embeddingForDb
      });

      // Save to database with fallback
      const { savedPlan, saveError } = await savePlanToDatabase(planData, aiPlanData);

      if (saveError) {
        console.error('❌ Error saving plan:', saveError);
        console.error('❌ Save error details:', {
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
          code: saveError.code
        });
        
        // Provide more specific error messages
        let errorMessage = "Plan generated but couldn't be saved. Please try again.";
        let errorTitle = "Save Failed";
        
        if (saveError.message?.includes('permission')) {
          errorMessage = "You don't have permission to save plans. Please check your account settings.";
          errorTitle = "Permission Error";
        } else if (saveError.message?.includes('network')) {
          errorMessage = "Network error occurred. Please check your connection and try again.";
          errorTitle = "Network Error";
        } else if (saveError.message?.includes('constraint')) {
          errorMessage = "Data validation error. Please check your plan settings and try again.";
          errorTitle = "Validation Error";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
        
        // Don't close the form so user can try again
        return;
      } else {
        console.log('✅ Plan saved successfully:', savedPlan);
        
        // Deactivate other plans
        try {
          const { error: deactivateError } = await supabase
            .from('nutrition_plans')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .neq('id', savedPlan.id);
          
          if (deactivateError) {
            console.warn('⚠️ Error deactivating other plans:', deactivateError);
            // Continue anyway, this is not critical
          }
        } catch (deactivateError) {
          console.warn('⚠️ Error deactivating other plans:', deactivateError);
          // Continue anyway, this is not critical
        }
        
        // Refresh plans list
        try {
          await loadGeneratedPlans();
        } catch (loadError) {
          console.warn('⚠️ Error reloading plans:', loadError);
          // Continue anyway, plan was saved successfully
        }
        
        setShowPlanForm(false);
        
        toast({
          title: "AI Plan Generated Successfully! 🎉",
          description: `Your personalized ${planPreferences.planType.replace('-', ' ')} plan is ready and has been activated.`,
        });

        // Auto-switch to calendar view
        setActiveTab('calendar');
      }
    } catch (error) {
      console.error('❌ Generation error:', error);
      
      // Provide more specific error messages based on error type
      let errorTitle = "Generation Failed";
      let errorDescription = "Unable to generate your diet plan. Please try again.";
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorTitle = "Network Error";
          errorDescription = "Unable to connect to AI service. Please check your internet connection and try again.";
        } else if (errorMessage.includes('timeout')) {
          errorTitle = "Request Timeout";
          errorDescription = "The AI service is taking too long to respond. Please try again.";
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          errorTitle = "Rate Limit Exceeded";
          errorDescription = "Too many requests. Please wait a moment and try again.";
        } else if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
          errorTitle = "Service Unavailable";
          errorDescription = "The AI service is currently overloaded. Please try again in a few minutes.";
        } else if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
          errorTitle = "Authentication Error";
          errorDescription = "Please sign out and sign back in, then try again.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !planName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a plan name",
        variant: "destructive"
      });
      return;
    }

    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      planName: planName,
      fileType: selectedFile.type,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setUploading(true);
    
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-plans/${user?.id || 'demo'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      // Save file info to database
      await supabase
        .from('uploaded_files')
        .insert({
          user_id: user?.id,
          filename: selectedFile.name,
          file_url: data.publicUrl,
          file_type: selectedFile.type,
          plan_name: planName
        });

      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));
      
      toast({
        title: "Upload Successful! 📁",
        description: "Your diet plan file has been uploaded and processed.",
      });

      // Reset form
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPlanName("");
      setSelectedFile(null);
    } catch (error) {
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim() || !textPlanName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both plan content and a plan name",
        variant: "destructive"
      });
      return;
    }

    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: `${textPlanName}.txt`,
      planName: textPlanName,
      fileType: 'text/plain',
      size: (textContent.length / 1024).toFixed(2) + ' KB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setSubmittingText(true);

    try {
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `text-plan-${Date.now()}.txt`;
      const filePath = `diet-plans/${user?.id || 'demo'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, textBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      await supabase
        .from('uploaded_files')
        .insert({
          user_id: user?.id,
          filename: fileName,
          file_url: data.publicUrl,
          file_type: 'text/plain',
          plan_name: textPlanName
        });

      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));

      toast({
        title: "Text Plan Saved! 📝",
        description: "Your diet plan text has been saved successfully.",
      });

      setTextContent("");
      setTextPlanName("");
    } catch (error) {
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Save Failed",
        description: "Failed to save text plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingText(false);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      await loadGeneratedPlans();
      toast({
        title: "Plan Deleted",
        description: "The diet plan has been removed from your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive"
      });
    }
  };

  const activatePlan = async (planId: string) => {
    try {
      // Deactivate all plans first
      await supabase
        .from('nutrition_plans')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      // Activate selected plan
      const { error } = await supabase
        .from('nutrition_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (error) throw error;

      await loadGeneratedPlans();
      toast({
        title: "Plan Activated! ✅",
        description: "This plan is now your active diet plan.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate plan",
        variant: "destructive"
      });
    }
  };

  const renderAIGenerator = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Diet Plan Generator
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create personalized nutrition plans powered by advanced AI algorithms, tailored to your unique health goals and dietary preferences.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold">94%</p>
                <p className="text-green-100 text-sm">User satisfaction</p>
              </div>
              <Target className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Plans Generated</p>
                <p className="text-3xl font-bold">{generatedPlans.length}</p>
                <p className="text-blue-100 text-sm">Your total plans</p>
              </div>
              <Sparkles className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Plan</p>
                <p className="text-3xl font-bold">{generatedPlans.filter(p => p.is_active).length}</p>
                <p className="text-purple-100 text-sm">Currently active</p>
              </div>
              <Activity className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate New Plan Button */}
      <div className="text-center">
        <Button
          onClick={() => setShowPlanForm(true)}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate New AI Plan
        </Button>
      </div>

      {/* Existing Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Your AI-Generated Plans</h3>
          <Button
            onClick={loadGeneratedPlans}
            variant="outline"
            size="sm"
            disabled={loadingPlans}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingPlans ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loadingPlans ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading your diet plans...</p>
          </Card>
        ) : generatedPlans.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Plans Yet</h3>
            <p className="text-gray-600 mb-4">Generate your first AI-powered diet plan to get started.</p>
            <Button
              onClick={() => setShowPlanForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedPlans.map((plan) => (
              <Card key={plan.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                    </div>
                    {plan.is_active && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Activity className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{plan.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Target Calories:</span>
                      <span className="font-medium">{plan.calories}/day</span>
                    </div>
                    {plan.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress:</span>
                          <span className="font-medium">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowPlanDetails(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {!plan.is_active && (
                      <Button
                        onClick={() => activatePlan(plan.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => deletePlan(plan.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl mb-4 shadow-lg">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Upload Diet Plans
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your existing diet plans, meal prep guides, or nutrition documents. Supports PDF, images, and text files.
        </p>
      </div>

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6 h-auto">
          <TabsTrigger 
            value="file" 
            className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm min-h-[48px] transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger 
            value="text" 
            className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm min-h-[48px] transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Enter Text</span>
            <span className="sm:hidden">Text</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-6">
          <Card className="border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors duration-200">
            <CardContent className="p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Diet Plan File</h3>
              <p className="text-gray-600 mb-6">
                Drag and drop your file here, or click to browse. Supports PDF, images, and text files up to 10MB.
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name *</Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter a name for your diet plan"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleFileUpload}
              disabled={uploading || !selectedFile || !planName.trim()}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Plan
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="textPlanName">Plan Name *</Label>
              <Input
                id="textPlanName"
                value={textPlanName}
                onChange={(e) => setTextPlanName(e.target.value)}
                placeholder="Enter a name for your diet plan"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="textContent">Diet Plan Content *</Label>
              <Textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type your diet plan content here..."
                className="mt-1 min-h-[300px]"
              />
            </div>

            <Button
              onClick={handleTextSubmit}
              disabled={submittingText || !textContent.trim() || !textPlanName.trim()}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
            >
              {submittingText ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Save Text Plan
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload History */}
      {sessionUploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Uploads</h3>
          <div className="space-y-3">
            {sessionUploads.map((upload) => (
              <Card key={upload.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{upload.planName}</p>
                        <p className="text-sm text-gray-600">{upload.name} • {upload.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === 'uploading' && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {upload.status === 'success' && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      )}
                      {upload.status === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Horizontal Scrollable Tabs */}
          <div className="block md:hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex h-14 items-center space-x-1 p-1 bg-white rounded-lg min-w-max shadow-lg">
                <TabsTrigger 
                  value="ai-generator" 
                  className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 min-w-[100px] min-h-[48px]"
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Generator</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 min-w-[100px] min-h-[48px]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 min-w-[100px] min-h-[48px]"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Calendar</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Desktop: Single row */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-3 gap-1 p-1 bg-white rounded-lg shadow-lg">
              <TabsTrigger 
                value="ai-generator" 
                className="flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600"
              >
                <Brain className="h-5 w-5" />
                <span>AI Generator</span>
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Plans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-50 data-[state=active]:bg-green-50 data-[state=active]:text-green-600"
              >
                <Calendar className="h-5 w-5" />
                <span>Calendar View</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="ai-generator" className="space-y-6 mt-8">
            {renderAIGenerator()}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6 mt-8">
            {renderFileUpload()}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6 mt-8">
            <AdultDietCalendar />
          </TabsContent>
        </Tabs>

        {/* AI Plan Generation Dialog */}
        <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Generate AI Diet Plan
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Plan Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Plan Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planTypes.map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        planPreferences.planType === type.value
                          ? 'ring-2 ring-purple-500 bg-purple-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('planType', type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{type.label}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={planPreferences.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{duration.label}</span>
                            <span className="text-sm text-gray-500 ml-2">{duration.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetCalories">Target Daily Calories</Label>
                  <Input
                    id="targetCalories"
                    value={planPreferences.targetCalories}
                    onChange={(e) => handleInputChange('targetCalories', e.target.value)}
                    placeholder="e.g., 2000 (optional - will be calculated based on your goals)"
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Leave empty to auto-calculate based on your goals and activity level</p>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <Label className="text-base font-semibold">Activity Level *</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {activityLevels.map((level) => (
                    <Card
                      key={level.value}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        planPreferences.activityLevel === level.value
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('activityLevel', level.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{level.label}</h4>
                            <p className="text-sm text-gray-600">{level.description}</p>
                          </div>
                          {planPreferences.activityLevel === level.value && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cookingSkill">Cooking Skill Level</Label>
                  <Select value={planPreferences.cookingSkill} onValueChange={(value) => handleInputChange('cookingSkill', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      {cookingSkills.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          <div>
                            <div className="font-medium">{skill.label}</div>
                            <div className="text-sm text-gray-500">{skill.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budgetRange">Budget Range</Label>
                  <Select value={planPreferences.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((budget) => (
                        <SelectItem key={budget.value} value={budget.value}>
                          <div>
                            <div className="font-medium">{budget.label}</div>
                            <div className="text-sm text-gray-500">{budget.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="healthGoals">Health Goals</Label>
                  <Textarea
                    id="healthGoals"
                    value={planPreferences.healthGoals}
                    onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                    placeholder="Describe your health and fitness goals..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dietaryRestrictions">Dietary Restrictions & Allergies</Label>
                  <Textarea
                    id="dietaryRestrictions"
                    value={planPreferences.dietaryRestrictions}
                    onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                    placeholder="List any dietary restrictions, allergies, or foods to avoid..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="mealPreferences">Meal Preferences</Label>
                  <Textarea
                    id="mealPreferences"
                    value={planPreferences.mealPreferences}
                    onChange={(e) => handleInputChange('mealPreferences', e.target.value)}
                    placeholder="Describe your favorite foods, cuisines, or meal preferences..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequirements">Special Requirements</Label>
                  <Textarea
                    id="specialRequirements"
                    value={planPreferences.specialRequirements}
                    onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                    placeholder="Any other special requirements or considerations..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t">
                <Button
                  onClick={() => setShowPlanForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={generateAIPlan}
                  disabled={generating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Plan Details Dialog */}
        <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-purple-600" />
                {selectedPlan?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPlan.duration}</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedPlan.calories}</div>
                    <div className="text-sm text-gray-600">Daily Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedPlan.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedPlan.description}</p>
                </div>

                {selectedPlan.plan_content?.dailyMeals && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Sample Meals (First 3 Days)</h4>
                    <div className="space-y-4">
                      {selectedPlan.plan_content.dailyMeals.slice(0, 3).map((day: any, index: number) => (
                        <Card key={index} className="border-0 shadow-sm bg-gray-50">
                          <CardContent className="p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Day {day.day}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {day.meals?.map((meal: any, mealIndex: number) => (
                                <div key={mealIndex} className="p-3 bg-white rounded-lg">
                                  <div className="text-sm font-medium text-gray-900 capitalize">{meal.mealType}</div>
                                  <div className="text-sm text-gray-600">{meal.name}</div>
                                  <div className="text-xs text-gray-500">{meal.calories} cal</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setActiveTab('calendar');
                      setShowPlanDetails(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View in Calendar
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfessionalDietPlans;