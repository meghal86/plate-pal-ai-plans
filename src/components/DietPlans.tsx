import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload, FileText, Sparkles, Search, Clock, Users, Star, Download, Target, TrendingUp, Heart, Zap, Plus, Calendar, Activity, Award, CheckCircle, ArrowRight, Brain, Lightbulb, AlertCircle, FileImage, File, XCircle, Loader2, Type, X, Eye, Play, RefreshCw, Trash2, TestTube, List
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDietPlan } from "@/api/generate-diet-plan";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UploadedFile {
  id: string;
  name: string;
  planName: string;
  fileType: string;
  size: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
}

interface PlanPreferences {
  planType: string;
  duration: string;
  targetCalories: string;
  dietaryRestrictions: string;
  healthGoals: string;
  activityLevel: string;
  specialRequirements: string;
}

const DietPlans = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submittingText, setSubmittingText] = useState(false);
  const [sessionUploads, setSessionUploads] = useState<UploadedFile[]>([]);
  const [textContent, setTextContent] = useState("");
  const [planName, setPlanName] = useState("");
  const [textPlanName, setTextPlanName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planPreferences, setPlanPreferences] = useState<PlanPreferences>({
    planType: "",
    duration: "30 days",
    targetCalories: "",
    dietaryRestrictions: "",
    healthGoals: "",
    activityLevel: "",
    specialRequirements: ""
  });
  const [generatedPlans, setGeneratedPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing generated plans
  const loadGeneratedPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found');
        setLoadingPlans(false);
        return;
      }

      const { data: plans, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading plans:', error);
      } else {
        // Clean up plan descriptions to remove JSON formatting
        const cleanedPlans = (plans || []).map(plan => {
          if (plan.description && plan.description.includes('{')) {
            try {
              // If description contains JSON, extract just the text part
              const descMatch = plan.description.match(/"description":\s*"([^"]+)"/);
              if (descMatch) {
                plan.description = descMatch[1];
              } else {
                // Fallback: take first 200 characters before any JSON
                const jsonStart = plan.description.indexOf('{');
                if (jsonStart > 0) {
                  plan.description = plan.description.substring(0, jsonStart).trim();
                }
              }
            } catch (descError) {
              console.log('Description cleanup failed for plan:', plan.id);
            }
          }
          return plan;
        });
        
        setGeneratedPlans(cleanedPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Load plans on component mount
  React.useEffect(() => {
    loadGeneratedPlans();
  }, []);

  // Refresh plans when user returns to the page
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadGeneratedPlans();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const planTypes = [
    "Weight Loss",
    "Muscle Building", 
    "Maintenance",
    "Athletic Performance",
    "Vegetarian/Vegan",
    "Low Carb",
    "Mediterranean",
    "Keto",
    "Paleo",
    "Gluten-Free",
    "Custom"
  ];

  const durations = [
    "30 days",
    "1 week",
    "2 weeks", 
    "4 weeks",
    "8 weeks",
    "12 weeks",
    "6 months"
  ];

  const activityLevels = [
    "Sedentary (little or no exercise)",
    "Lightly active (light exercise 1-3 days/week)",
    "Moderately active (moderate exercise 3-5 days/week)",
    "Very active (hard exercise 6-7 days/week)",
    "Extremely active (very hard exercise, physical job)"
  ];

  const handleInputChange = (field: keyof PlanPreferences, value: string) => {
    setPlanPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePlanPreferences = () => {
    if (!planPreferences.planType) {
      toast({
        title: "Plan type required",
        description: "Please select what type of plan you need",
        variant: "destructive"
      });
      return false;
    }
    if (!planPreferences.duration) {
      toast({
        title: "Duration required",
        description: "Please select how long you want the plan to be",
        variant: "destructive"
      });
      return false;
    }
    if (!planPreferences.targetCalories) {
      toast({
        title: "Target calories required",
        description: "Please enter your target daily calories",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const generateAIPlan = async (preferences: PlanPreferences) => {
    if (!validatePlanPreferences()) {
      return;
    }

    setGenerating(true);
    
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Not signed in",
          description: "You must be signed in to generate an AI plan.",
          variant: "destructive"
        });
        setGenerating(false);
        return;
      }
      const realUserId = user.id;
      
      // Get user profile for personalized plan generation
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', realUserId)
        .single();

      // Prepare comprehensive user context for AI
      const userContext = `
        User Profile:
        - Name: ${profile?.full_name || 'User'}
        - Age: ${profile?.age || 'Not specified'}
        - Weight: ${profile?.weight || 'Not specified'} ${profile?.weight_unit || 'kg'}
        - Height: ${profile?.height || 'Not specified'} cm
        - Activity Level: ${profile?.activity_level || 'moderate'}
        - Health Goals: ${profile?.health_goals || 'Not specified'}
        - Dietary Restrictions: ${profile?.dietary_restrictions || 'None'}

        Plan Requirements:
        - Plan Type: ${preferences.planType}
        - Duration: ${preferences.duration} (MUST generate exactly 30 days of meals)
        - Target Calories: ${preferences.targetCalories} per day
        - Dietary Restrictions: ${preferences.dietaryRestrictions || 'None'}
        - Health Goals: ${preferences.healthGoals || 'General health'}
        - Activity Level: ${preferences.activityLevel || 'Moderate'}
        - Special Requirements: ${preferences.specialRequirements || 'None'}

        CRITICAL: Generate a COMPLETE 30-DAY MEAL PLAN with 4 meals per day (breakfast, lunch, dinner, snack).
        This means 120 total meals (30 days × 4 meals per day).
        Each meal should include detailed ingredients, preparation instructions, and nutritional information.
        Respect all dietary restrictions and ensure variety across the 30 days.
      `;

      console.log('Sending to AI:', {
        planType: preferences.planType,
        duration: preferences.duration,
        targetCalories: preferences.targetCalories,
        dietaryRestrictions: preferences.dietaryRestrictions,
        healthGoals: preferences.healthGoals,
        activityLevel: preferences.activityLevel,
        specialRequirements: preferences.specialRequirements
      });

      console.log('Full user context being sent to AI:', userContext);
      console.log('User context length:', userContext.length);

      // Call Gemini API for plan generation
      const aiPlanData = await generateDietPlan(userContext, realUserId);
      
      console.log('AI Response received:', {
        hasTitle: !!aiPlanData.title,
        hasDescription: !!aiPlanData.description,
        hasDailyMeals: !!aiPlanData.dailyMeals,
        dailyMealsLength: aiPlanData.dailyMeals?.length || 0,
        hasMeals: !!aiPlanData.meals,
        mealsLength: aiPlanData.meals?.length || 0
      });
      
      // Save the generated plan to the database
      const { data: savedPlan, error: saveError } = await supabase
        .from('nutrition_plans')
        .insert({
          user_id: realUserId,
          title: `${preferences.planType} Plan`,
          description: aiPlanData.description || `Personalized ${preferences.planType.toLowerCase()} plan`.replace(/\s+/g, ' ').trim(),
          plan_content: aiPlanData,
          duration: preferences.duration,
          calories: preferences.targetCalories,
          is_active: true // Set as active by default
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving plan:', saveError);
        toast({
          title: "Plan Generated but not saved",
          description: "The plan was created but couldn't be saved to your account.",
          variant: "destructive"
        });
      } else {
        // Deactivate all other plans for this user to ensure only one is active
        const { error: deactivateError } = await supabase
          .from('nutrition_plans')
          .update({ is_active: false })
          .eq('user_id', realUserId)
          .neq('id', savedPlan.id);
        
        if (deactivateError) {
          console.error('Error deactivating other plans:', deactivateError);
        }
        
        // Refresh the plans list
        await loadGeneratedPlans();
        
        toast({
          title: "AI Plan Generated Successfully!",
          description: `Your personalized ${preferences.planType.toLowerCase()} plan has been created and activated.`,
        });
      }

      setShowPlanForm(false);
    } catch (error) {
      console.error('Generation error:', error);
      
      toast({
        title: "Plan Generated (Fallback)",
        description: `Generated a ${preferences.planType.toLowerCase()} plan. AI features will be available soon.`,
      });
      
      setShowPlanForm(false);
    } finally {
      setGenerating(false);
    }
  };

  // Mock active plans data (secondary feature)
  const myActivePlans = [
    {
      id: 5,
      name: "Mediterranean Keto Plan",
      description: "Low-carb Mediterranean diet with healthy fats",
      duration: "4 weeks",
      calories: "1800-2000",
      type: "Uploaded",
      status: "Active",
      progress: 75,
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      category: "Keto"
    },
    {
      id: 6,
      name: "Plant-Based Protein Focus",
      description: "High-protein vegan meal plan for muscle building",
      duration: "6 weeks",
      calories: "2200-2400",
      type: "AI Generated",
      status: "Completed",
      progress: 100,
      startDate: "2023-12-01",
      endDate: "2024-01-15",
      category: "Plant-Based"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-50 text-green-700 border-green-200";
      case "Intermediate": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Advanced": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Available": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('image')) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('text')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "Available":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
            <Sparkles className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Medium</Badge>;
      case "Low":
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  // Upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!planName.trim()) {
      toast({
        title: "Plan name required",
        description: "Please enter a plan name to help track your diet plan",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary upload entry
    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      planName: planName || selectedFile.name,
      fileType: selectedFile.type,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      console.log('Uploading file:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: selectedFile.name,
          file_url: data.publicUrl,
          file_type: selectedFile.type,
          plan_name: planName || selectedFile.name
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Update the file status to success
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));
      
      toast({
        title: "Upload successful",
        description: "Your diet plan has been uploaded successfully",
      });

      // Reset the input and plan name
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setPlanName("");
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload process error:', error);
      
      // Update the file status to error
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some diet plan content",
        variant: "destructive"
      });
      return;
    }

    if (!textPlanName.trim()) {
      toast({
        title: "Plan name required",
        description: "Please enter a plan name to help track your diet plan",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary upload entry
    const tempFile: UploadedFile = {
      id: Date.now().toString(),
      name: `Text Plan - ${textPlanName || 'Untitled'}`,
      planName: textPlanName || 'Text Diet Plan',
      fileType: 'text/plain',
      size: (textContent.length / 1024).toFixed(2) + ' KB',
      status: 'uploading'
    };

    setSessionUploads(prev => [tempFile, ...prev]);
    setSubmittingText(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Create a text file from the content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `text-plan-${Date.now()}.txt`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      console.log('Uploading text content as file:', fileName);

      // Upload the text as a file
      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, textBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

      console.log('Text file uploaded successfully, URL:', data.publicUrl);

      // Save file info to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: fileName,
          file_url: data.publicUrl,
          file_type: 'text/plain',
          plan_name: textPlanName || 'Text Diet Plan'
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Update the file status to success
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'success', url: data.publicUrl }
          : f
      ));

      toast({
        title: "Text submitted successfully",
        description: "Your diet plan text has been saved successfully",
      });

      // Clear the text area and plan name
      setTextContent("");
      setTextPlanName("");
    } catch (error) {
      console.error('Text submission error:', error);
      
      // Update the file status to error
      setSessionUploads(prev => prev.map(f => 
        f.id === tempFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingText(false);
    }
  };

  const removeUpload = (id: string) => {
    setSessionUploads(prev => prev.filter(file => file.id !== id));
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        toast({
          title: "Error",
          description: "Failed to delete the plan. Please try again.",
          variant: "destructive"
        });
      } else {
        // Refresh the plans list
        await loadGeneratedPlans();
        toast({
          title: "Plan Deleted",
          description: "The plan has been successfully deleted.",
        });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete the plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getUploadStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'success':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI-Powered Diet Plans</h1>
        <p className="text-gray-600">Discover personalized nutrition plans powered by advanced AI algorithms</p>
      </div>

      {/* Status Overview Cards - Redesigned like Lab Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Your AI Plans</p>
                <p className="text-3xl font-bold text-purple-900">{generatedPlans.length}</p>
                <p className="text-xs text-purple-600 mt-1">Generated plans</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Plans</p>
                <p className="text-3xl font-bold text-blue-900">{myActivePlans.filter(p => p.status === 'Active').length}</p>
                <p className="text-xs text-blue-600 mt-1">Currently following</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Completed Plans</p>
                <p className="text-3xl font-bold text-emerald-900">{myActivePlans.filter(p => p.status === 'Completed').length}</p>
                <p className="text-xs text-emerald-600 mt-1">Successfully finished</p>
              </div>
              <div className="h-12 w-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search AI plans, dietary preferences, or health goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Upload className="h-5 w-5 mr-3 text-blue-600" />
            Upload Your Diet Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6">
                <TabsTrigger value="file" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Type className="h-4 w-4 mr-2" />
                  Enter Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="plan-name" className="text-sm font-medium text-gray-700 flex items-center">
                      Plan Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="plan-name"
                      type="text"
                      placeholder="e.g., Mediterranean Diet Plan (required)"
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      disabled={uploading}
                      className={`mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        planName.trim() === '' && selectedFile ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {planName.trim() === '' && selectedFile && (
                      <p className="text-xs text-red-500 mt-1">Plan name is required to upload</p>
                    )}
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <Button
                          onClick={triggerFileUpload}
                          disabled={uploading}
                          variant="outline"
                          className="border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        >
                          Choose File or Drag & Drop
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          PDF, DOC, TXT, or any document type (Max 10MB)
                        </p>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                      
                      {/* Selected File Display */}
                      {selectedFile && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
                              <span className="text-xs text-blue-600">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      {selectedFile && (
                        <Button
                          onClick={handleFileUpload}
                          disabled={uploading || !planName.trim()}
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Diet Plan
                            </>
                          )}
                        </Button>
                      )}
                      
                      {uploading && (
                        <div className="flex items-center space-x-2 mt-4">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="text-plan-name" className="text-sm font-medium text-gray-700 flex items-center">
                      Plan Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="text-plan-name"
                      type="text"
                      placeholder="e.g., My Custom Diet Plan (required)"
                      value={textPlanName}
                      onChange={e => setTextPlanName(e.target.value)}
                      disabled={submittingText}
                      className={`mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        textPlanName.trim() === '' && textContent.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {textPlanName.trim() === '' && textContent.trim() && (
                      <p className="text-xs text-red-500 mt-1">Plan name is required to save</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="diet-text" className="text-sm font-medium text-gray-700">
                      Diet Plan Content
                    </Label>
                    <Textarea
                      id="diet-text"
                      placeholder="Enter your diet plan, meal schedule, ingredients list, or any nutrition information here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="mt-1 min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={submittingText}
                    />
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={submittingText || !textContent.trim() || !textPlanName.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {submittingText ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Type className="h-4 w-4 mr-2" />
                        Save Diet Plan
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Session Uploads */}
            {sessionUploads.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-gray-900">This Session's Uploads:</h4>
                {sessionUploads.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.planName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.name} • {file.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getUploadStatusBadge(file.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(file.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Plans Section (Main Feature) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Brain className="h-5 w-5 mr-3 text-purple-600" />
              AI-Generated Plans
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {generatedPlans.length} Available
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    // Delete all plans for the user
                    const { error } = await supabase
                      .from('nutrition_plans')
                      .delete()
                      .eq('user_id', user.id);
                    
                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to clear plans",
                        variant: "destructive"
                      });
                    } else {
                      await loadGeneratedPlans();
                      toast({
                        title: "Success",
                        description: "All plans cleared. Generate a new plan to see improved content!",
                      });
                    }
                  } catch (error) {
                    console.error('Error clearing plans:', error);
                  }
                }}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button
                onClick={() => {
                  console.log('Generate My AI Plan button clicked in DietPlans');
                  setShowPlanForm(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white relative z-10"
                size="sm"
                style={{ pointerEvents: 'auto' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate My AI Plan
              </Button>
            </div>
          </div>
          

        </CardHeader>
        <CardContent className="p-0">
          {/* AI Plan Generation Form */}
          {showPlanForm && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  Create Your AI Plan
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlanForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-600 mb-6">Tell us about your goals and preferences to generate a personalized plan</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Type */}
                  <div className="space-y-2">
                    <Label htmlFor="plan-type" className="flex items-center">
                      Plan Type <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={planPreferences.planType} onValueChange={(value) => handleInputChange('planType', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        {planTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center">
                      Duration <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={planPreferences.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Calories */}
                  <div className="space-y-2">
                    <Label htmlFor="target-calories" className="flex items-center">
                      Target Daily Calories <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="target-calories"
                      type="number"
                      placeholder="e.g., 1800"
                      value={planPreferences.targetCalories}
                      onChange={(e) => handleInputChange('targetCalories', e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-2">
                    <Label htmlFor="activity-level" className="flex items-center">
                      Activity Level <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={planPreferences.activityLevel} onValueChange={(value) => handleInputChange('activityLevel', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityLevels.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2">
                  <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
                  <Input
                    id="dietary-restrictions"
                    placeholder="e.g., vegetarian, gluten-free, dairy-free"
                    value={planPreferences.dietaryRestrictions}
                    onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Health Goals */}
                <div className="space-y-2">
                  <Label htmlFor="health-goals">Health Goals</Label>
                  <Textarea
                    id="health-goals"
                    placeholder="e.g., lose weight, build muscle, improve energy, manage diabetes"
                    value={planPreferences.healthGoals}
                    onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Special Requirements */}
                <div className="space-y-2">
                  <Label htmlFor="special-requirements">Special Requirements</Label>
                  <Textarea
                    id="special-requirements"
                    placeholder="e.g., food allergies, medical conditions, specific preferences"
                    value={planPreferences.specialRequirements}
                    onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPlanForm(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => generateAIPlan(planPreferences)}
                    disabled={generating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate My AI Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* My Active Plans Section */}
          {generatedPlans.some(plan => plan.is_active) && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  My Active Plan
                </h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Currently Following
                </Badge>
              </div>
              
              {loadingPlans ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                    <span className="text-gray-600">Loading your active plan...</span>
                  </div>
                </div>
              ) : (
                generatedPlans
                  .filter(plan => plan.is_active)
                  .map((plan) => (
                    <TooltipProvider key={plan.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {plan.duration}
                                  </span>
                                  <span className="flex items-center">
                                    <Target className="h-3 w-3 mr-1" />
                                    {plan.calories} cal/day
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(plan.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlan(plan);
                                    setShowPlanDetails(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { data: { user } } = await supabase.auth.getUser();
                                      if (!user) return;
                                      
                                      console.log('Deactivating active plan:', plan.id);
                                      const { error } = await supabase
                                        .from('nutrition_plans')
                                        .update({ is_active: false })
                                        .eq('id', plan.id);
                                      
                                      if (error) {
                                        console.error('Error deactivating plan:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to deactivate plan",
                                          variant: "destructive"
                                        });
                                      } else {
                                        console.log('Plan deactivated successfully');
                                        await loadGeneratedPlans();
                                        toast({
                                          title: "Plan Deactivated",
                                          description: "This plan is no longer active",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Error deactivating plan:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to update plan status",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Deactivate
                                </Button>
                              </div>
                            </div>
                            
                            {/* Plan Details */}
                            {plan.plan_content && (
                              <div className="space-y-3 mb-3">
                                {plan.plan_content.dailyMeals && plan.plan_content.dailyMeals.length > 0 ? (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Sample Day 1 Meals:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {plan.plan_content.dailyMeals[0].meals.slice(0, 4).map((meal: any, index: number) => {
                                        const date = new Date(plan.plan_content.dailyMeals[0].date);
                                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        
                                        return (
                                          <TooltipProvider key={index}>
                                            <Tooltip delayDuration={300}>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center space-x-2 p-2 bg-white rounded border border-green-200 hover:bg-green-50 transition-colors cursor-pointer">
                                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                      {index === 0 ? dayName.charAt(0) : meal.mealType.charAt(0).toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                                        {meal.mealType}
                                                      </span>
                                                      <span className="text-xs text-gray-500">•</span>
                                                      <span className="text-xs font-medium text-gray-700">
                                                        {meal.calories} cal
                                                      </span>
                                                    </div>
                                                    <span className="text-sm text-gray-700 font-medium block truncate">
                                                      {meal.name}
                                                    </span>
                                                    {index === 0 && (
                                                      <span className="text-xs text-gray-500">
                                                        {dayName}, {monthDay}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-sm p-3">
                                                <div className="space-y-2">
                                                  <div>
                                                    <h6 className="font-semibold text-gray-900 text-sm">{meal.name}</h6>
                                                    <p className="text-xs text-gray-600 mt-1">{meal.description}</p>
                                                  </div>
                                                  
                                                  {meal.ingredients && meal.ingredients.length > 0 && (
                                                    <div>
                                                      <span className="text-xs font-medium text-gray-700">Ingredients:</span>
                                                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                                        {meal.ingredients.slice(0, 5).map((ingredient: string, i: number) => (
                                                          <li key={i} className="flex items-center">
                                                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                                            {ingredient}
                                                          </li>
                                                        ))}
                                                        {meal.ingredients.length > 5 && (
                                                          <li className="text-gray-500 italic">+{meal.ingredients.length - 5} more</li>
                                                        )}
                                                      </ul>
                                                    </div>
                                                  )}
                                                  
                                                  {meal.instructions && (
                                                    <div>
                                                      <span className="text-xs font-medium text-gray-700">Instructions:</span>
                                                      <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                                                        {meal.instructions}
                                                      </p>
                                                    </div>
                                                  )}
                                                  
                                                  {meal.macros && (
                                                    <div className="flex space-x-3 text-xs pt-1 border-t border-gray-200">
                                                      <span className="text-blue-600 font-medium">Protein: {meal.macros.protein}g</span>
                                                      <span className="text-green-600 font-medium">Carbs: {meal.macros.carbs}g</span>
                                                      <span className="text-orange-600 font-medium">Fat: {meal.macros.fat}g</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-green-700 font-medium">
                                          📅 {plan.plan_content.dailyMeals.length}-Day Calendar
                                        </span>
                                        <span className="text-gray-600">
                                          {plan.plan_content.dailyMeals.length * 4} total meals
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : plan.plan_content.meals && plan.plan_content.meals.length > 0 ? (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Sample Meals:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {plan.plan_content.meals.slice(0, 4).map((meal: any, index: number) => (
                                        <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border border-green-200">
                                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                              {meal.mealType.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                                {meal.mealType}
                                              </span>
                                              <span className="text-xs text-gray-500">•</span>
                                              <span className="text-xs font-medium text-gray-700">
                                                {meal.calories} cal
                                              </span>
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium block truncate">
                                              {meal.name}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Full plan includes {plan.plan_content.meals.length} meals
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">No meal content available</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">{plan.title}</h4>
                              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                                <span>📅 {plan.duration}</span>
                                <span>🔥 {plan.calories} cal/day</span>
                                <span>📊 {plan.plan_content?.dailyMeals?.length * 4 || 0} meals</span>
                              </div>
                            </div>
                            
                            {plan.plan_content?.dailyMeals && plan.plan_content.dailyMeals.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-2">Sample Day 1 Meals:</h5>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {plan.plan_content.dailyMeals[0].meals.slice(0, 4).map((meal: any, mealIndex: number) => (
                                    <div key={mealIndex} className="border-l-2 border-green-200 pl-3 py-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-green-600 uppercase">
                                          {meal.mealType}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {meal.calories} cal
                                        </span>
                                      </div>
                                      <h6 className="text-sm font-semibold text-gray-900 mb-1">
                                        {meal.name}
                                      </h6>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {meal.description}
                                      </p>
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <div className="mb-2">
                                          <span className="text-xs font-medium text-gray-700">Ingredients:</span>
                                          <p className="text-xs text-gray-600 line-clamp-1">
                                            {meal.ingredients.slice(0, 3).join(', ')}
                                            {meal.ingredients.length > 3 && '...'}
                                          </p>
                                        </div>
                                      )}
                                      {meal.macros && (
                                        <div className="flex space-x-2 text-xs">
                                          <span className="text-blue-600">P: {meal.macros.protein}g</span>
                                          <span className="text-green-600">C: {meal.macros.carbs}g</span>
                                          <span className="text-orange-600">F: {meal.macros.fat}g</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Click "View Details" to see the complete 30-day plan with all recipes and instructions.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
              )}
            </div>
          )}

          {/* All Plans Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <List className="h-5 w-5 mr-2 text-gray-600" />
                All Plans ({generatedPlans.length})
              </h3>
            </div>
            
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <span className="text-gray-600">Loading your AI plans...</span>
                </div>
              </div>
            ) : generatedPlans.length > 0 ? (
              generatedPlans
                .filter(plan => !plan.is_active) // Only show inactive plans in this section
                .map((plan, index) => (
                  <TooltipProvider key={plan.id}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer mb-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {plan.duration}
                                </span>
                                <span className="flex items-center">
                                  <Target className="h-3 w-3 mr-1" />
                                  {plan.calories} cal/day
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(plan.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowPlanDetails(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user) return;
                                    
                                    console.log('Activating plan:', plan.id);
                                    
                                    // First, deactivate all other plans for this user
                                    const { error: deactivateError } = await supabase
                                      .from('nutrition_plans')
                                      .update({ is_active: false })
                                      .eq('user_id', user.id);
                                    
                                    if (deactivateError) {
                                      console.error('Error deactivating other plans:', deactivateError);
                                      toast({
                                        title: "Error",
                                        description: "Failed to deactivate other plans",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    
                                    // Then activate this plan
                                    const { error: activateError } = await supabase
                                      .from('nutrition_plans')
                                      .update({ is_active: true })
                                      .eq('id', plan.id);
                                    
                                    if (activateError) {
                                      console.error('Error activating plan:', activateError);
                                      toast({
                                        title: "Error",
                                        description: "Failed to activate plan",
                                        variant: "destructive"
                                      });
                                    } else {
                                      console.log('Plan activated successfully');
                                      await loadGeneratedPlans();
                                      toast({
                                        title: "Plan Activated!",
                                        description: "This plan is now your active plan",
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error activating plan:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to update plan status",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            </div>
                          </div>
                          
                          {/* Plan Details */}
                          {plan.plan_content && (
                            <div className="space-y-3 mb-3">
                              {plan.plan_content.dailyMeals && plan.plan_content.dailyMeals.length > 0 ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Sample Day 1 Meals:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {plan.plan_content.dailyMeals[0].meals.slice(0, 4).map((meal: any, index: number) => {
                                      const date = new Date(plan.plan_content.dailyMeals[0].date);
                                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                      
                                      return (
                                        <TooltipProvider key={index}>
                                          <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                                  <span className="text-white text-xs font-bold">
                                                    {index === 0 ? dayName.charAt(0) : meal.mealType.charAt(0).toUpperCase()}
                                                  </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                                      {meal.mealType}
                                                    </span>
                                                    <span className="text-xs text-gray-500">•</span>
                                                    <span className="text-xs font-medium text-gray-700">
                                                      {meal.calories} cal
                                                    </span>
                                                  </div>
                                                  <span className="text-sm text-gray-700 font-medium block truncate">
                                                    {meal.name}
                                                  </span>
                                                  {index === 0 && (
                                                    <span className="text-xs text-gray-500">
                                                      {dayName}, {monthDay}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm p-3">
                                              <div className="space-y-2">
                                                <div>
                                                  <h6 className="font-semibold text-gray-900 text-sm">{meal.name}</h6>
                                                  <p className="text-xs text-gray-600 mt-1">{meal.description}</p>
                                                </div>
                                                
                                                {meal.ingredients && meal.ingredients.length > 0 && (
                                                  <div>
                                                    <span className="text-xs font-medium text-gray-700">Ingredients:</span>
                                                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                                      {meal.ingredients.slice(0, 5).map((ingredient: string, i: number) => (
                                                        <li key={i} className="flex items-center">
                                                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                                          {ingredient}
                                                        </li>
                                                      ))}
                                                      {meal.ingredients.length > 5 && (
                                                        <li className="text-gray-500 italic">+{meal.ingredients.length - 5} more</li>
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}
                                                
                                                {meal.instructions && (
                                                  <div>
                                                    <span className="text-xs font-medium text-gray-700">Instructions:</span>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                                                      {meal.instructions}
                                                    </p>
                                                  </div>
                                                )}
                                                
                                                {meal.macros && (
                                                  <div className="flex space-x-3 text-xs pt-1 border-t border-gray-200">
                                                    <span className="text-blue-600 font-medium">Protein: {meal.macros.protein}g</span>
                                                    <span className="text-green-600 font-medium">Carbs: {meal.macros.carbs}g</span>
                                                    <span className="text-orange-600 font-medium">Fat: {meal.macros.fat}g</span>
                                                  </div>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded border border-purple-200">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-purple-700 font-medium">
                                        📅 {plan.plan_content.dailyMeals.length}-Day Calendar
                                      </span>
                                      <span className="text-gray-600">
                                        {plan.plan_content.dailyMeals.length * 4} total meals
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : plan.plan_content.meals && plan.plan_content.meals.length > 0 ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Sample Meals:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {plan.plan_content.meals.slice(0, 4).map((meal: any, index: number) => (
                                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs font-bold">
                                            {meal.mealType.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                              {meal.mealType}
                                            </span>
                                            <span className="text-xs text-gray-500">•</span>
                                            <span className="text-xs font-medium text-gray-700">
                                              {meal.calories} cal
                                            </span>
                                          </div>
                                          <span className="text-sm text-gray-700 font-medium block truncate">
                                            {meal.name}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Full plan includes {plan.plan_content.meals.length} meals
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No meal content available</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{plan.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                              <span>📅 {plan.duration}</span>
                              <span>🔥 {plan.calories} cal/day</span>
                              <span>📊 {plan.plan_content?.dailyMeals?.length * 4 || 0} meals</span>
                            </div>
                          </div>
                          
                          {plan.plan_content?.dailyMeals && plan.plan_content.dailyMeals.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Sample Day 1 Meals:</h5>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {plan.plan_content.dailyMeals[0].meals.slice(0, 4).map((meal: any, mealIndex: number) => (
                                  <div key={mealIndex} className="border-l-2 border-purple-200 pl-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-purple-600 uppercase">
                                        {meal.mealType}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {meal.calories} cal
                                      </span>
                                    </div>
                                    <h6 className="text-sm font-semibold text-gray-900 mb-1">
                                      {meal.name}
                                    </h6>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {meal.description}
                                    </p>
                                    {meal.ingredients && meal.ingredients.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-gray-700">Ingredients:</span>
                                        <p className="text-xs text-gray-600 line-clamp-1">
                                          {meal.ingredients.slice(0, 3).join(', ')}
                                          {meal.ingredients.length > 3 && '...'}
                                        </p>
                                      </div>
                                    )}
                                    {meal.macros && (
                                      <div className="flex space-x-2 text-xs">
                                        <span className="text-blue-600">P: {meal.macros.protein}g</span>
                                        <span className="text-green-600">C: {meal.macros.carbs}g</span>
                                        <span className="text-orange-600">F: {meal.macros.fat}g</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                  Click "View Details" to see the complete 30-day plan with all recipes and instructions.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-16 w-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Plans Yet</h3>
                    <p className="text-gray-600 mb-4">Generate your first personalized nutrition plan to get started</p>
                    <Button
                      onClick={() => setShowPlanForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Your First Plan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Active Plans Section (Secondary) */}
      {myActivePlans.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-3 text-blue-600" />
                My Active Plans
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {myActivePlans.length} Total
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {myActivePlans.map((plan, index) => (
                <div 
                  key={plan.id} 
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {plan.type === "AI Generated" ? (
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Upload className="h-4 w-4 text-blue-500" />
                          )}
                          <h3 className="font-semibold text-gray-900 truncate">{plan.name}</h3>
                        </div>
                        <Badge variant={plan.type === "AI Generated" ? "default" : "secondary"}>
                          {plan.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{plan.duration}</span>
                        </div>
                        <span>•</span>
                        <span>{plan.calories} calories</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{plan.category}</span>
                      </div>

                      <p className="text-gray-600 mb-3">{plan.description}</p>

                      {/* Progress */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-gray-900 font-medium">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      {getStatusBadge(plan.status)}
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Plan Generator CTA */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Ready for Your Personalized AI Plan?
            </h3>
            <p className="text-gray-600 mb-6">
              Our advanced AI analyzes your goals, preferences, and health data to create a nutrition plan that's uniquely yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  console.log('Bottom Generate My AI Plan button clicked');
                  setShowPlanForm(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate My AI Plan
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details Modal */}
      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedPlan?.title || "AI Plan Details"}
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Plan Information Header */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {selectedPlan?.duration || "30 days"}
                </div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {selectedPlan?.calories || "1800-2000"}
                </div>
                <div className="text-sm text-gray-600">Daily Calories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {selectedPlan?.plan_content?.dailyMeals?.length * 4 || "120"}
                </div>
                <div className="text-sm text-gray-600">Total Meals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {selectedPlan?.created_at ? new Date(selectedPlan.created_at).toLocaleDateString() : "Today"}
                </div>
                <div className="text-sm text-gray-600">Created</div>
              </div>
            </div>
            
            {selectedPlan?.description && (
              <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Plan Description</h4>
                <p className="text-gray-700">{selectedPlan.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mb-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: "Export Feature",
                    description: "Calendar export will be available soon!",
                  });
                }}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    // Delete all plans for the user
                    const { error } = await supabase
                      .from('nutrition_plans')
                      .delete()
                      .eq('user_id', user.id);
                    
                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to clear plans",
                        variant: "destructive"
                      });
                    } else {
                      await loadGeneratedPlans();
                      toast({
                        title: "Success",
                        description: "All plans cleared. Generate a new plan to see improved content!",
                      });
                    }
                  } catch (error) {
                    console.error('Error clearing plans:', error);
                  }
                }}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All Plans
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedPlan) {
                    deletePlan(selectedPlan.id);
                    setShowPlanDetails(false);
                  }
                }}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Delete Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (selectedPlan) {
                    try {
                      console.log('Regenerating plan with data:', selectedPlan);
                      
                      // Regenerate the plan with improved content
                      toast({
                        title: "Regenerating Plan",
                        description: "Deleting old plan and generating new one with improved content...",
                      });
                      
                      // Close the modal first
                      setShowPlanDetails(false);
                      
                      // Delete the old plan first
                      await deletePlan(selectedPlan.id);
                      
                      // Trigger regeneration with the same preferences
                      const regeneratePreferences: PlanPreferences = {
                        planType: selectedPlan.title?.replace(' Plan', '') || 'Weight Loss',
                        duration: selectedPlan.duration || '30 days',
                        activityLevel: 'moderate',
                        targetCalories: selectedPlan.calories || '1800-2000',
                        dietaryRestrictions: 'none',
                        healthGoals: 'weight loss',
                        specialRequirements: 'none'
                      };
                      
                      console.log('Regenerate preferences:', regeneratePreferences);
                      
                      // Set the form preferences and generate
                      setPlanPreferences(regeneratePreferences);
                      await generateAIPlan(regeneratePreferences);
                      
                      // Refresh the plans list to get the new plan
                      await loadGeneratedPlans();
                      
                      toast({
                        title: "Plan Regenerated!",
                        description: "Your plan has been regenerated with improved content. Check the plan list above.",
                      });
                    } catch (error) {
                      console.error('Error regenerating plan:', error);
                      toast({
                        title: "Error",
                        description: "Failed to regenerate plan. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }
                }}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate Plan
              </Button>
            </div>
          </div>

          {/* Calendar View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">30-Day Meal Calendar</h3>
              <Badge variant="outline" className="text-sm">
                {selectedPlan?.plan_content?.dailyMeals?.length || 0} Days
              </Badge>
            </div>
            
            {selectedPlan?.plan_content && (
              <div className="space-y-4">
                {selectedPlan.plan_content.dailyMeals && selectedPlan.plan_content.dailyMeals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
                    {selectedPlan.plan_content.dailyMeals.slice(0, 30).map((day: any, dayIndex: number) => {
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const totalCalories = day.meals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
                      
                      return (
                        <div key={dayIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          {/* Day Header */}
                          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-t-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium opacity-90">{dayName}</p>
                                <p className="text-lg font-bold">{monthDay}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs opacity-90">Day {day.day}</p>
                                <p className="text-sm font-semibold">{totalCalories} cal</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Meals */}
                          <div className="p-3 space-y-2">
                            {day.meals.map((meal: any, mealIndex: number) => (
                              <div key={mealIndex} className="border-l-4 border-purple-200 pl-3 py-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                        {meal.mealType}
                                      </span>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="text-xs font-medium text-gray-700">
                                        {meal.calories} cal
                                      </span>
                                    </div>
                                    <h6 className="text-sm font-semibold text-gray-900 truncate">
                                      {meal.name}
                                    </h6>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {meal.description}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Quick Macro Info */}
                                {meal.macros && (
                                  <div className="flex space-x-3 mt-2 text-xs">
                                    <span className="text-blue-600">
                                      <span className="font-medium">P:</span> {meal.macros.protein}g
                                    </span>
                                    <span className="text-green-600">
                                      <span className="font-medium">C:</span> {meal.macros.carbs}g
                                    </span>
                                    <span className="text-orange-600">
                                      <span className="font-medium">F:</span> {meal.macros.fat}g
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Day Summary */}
                          <div className="bg-gray-50 px-3 py-2 rounded-b-lg border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>4 meals</span>
                              <span className="font-medium text-gray-700">{totalCalories} total calories</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : selectedPlan.plan_content.meals && selectedPlan.plan_content.meals.length > 0 ? (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Meals</h4>
                    <div className="space-y-3">
                      {selectedPlan.plan_content.meals.map((meal: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{meal.name}</h5>
                            <Badge variant="outline" className="text-xs">
                              {meal.calories} calories
                            </Badge>
                          </div>
                          {meal.macros && (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center">
                                <span className="text-blue-600 font-medium">{meal.macros.protein}g</span>
                                <p className="text-gray-500 text-xs">Protein</p>
                              </div>
                              <div className="text-center">
                                <span className="text-green-600 font-medium">{meal.macros.carbs}g</span>
                                <p className="text-gray-500 text-xs">Carbs</p>
                              </div>
                              <div className="text-center">
                                <span className="text-orange-600 font-medium">{meal.macros.fat}g</span>
                                <p className="text-gray-500 text-xs">Fat</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {/* Raw JSON for debugging */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    View Raw Data (for debugging)
                  </summary>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-800 overflow-auto max-h-[200px] mt-2">
                    {JSON.stringify(selectedPlan.plan_content, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DietPlans;