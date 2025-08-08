import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, FileText, Sparkles, Search, Clock, Download, Target, TrendingUp, Heart, Plus, Calendar, Activity, Award, CheckCircle, Brain, Lightbulb, AlertCircle, FileImage, File, Loader2, Type, X, Eye, Play, RefreshCw, Trash2, List
} from "lucide-react";
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDietPlan, generatePlanEmbedding } from "@/api/generate-diet-plan";
import { searchPlansBySimilarity, SearchResult } from "@/api/search-plans";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/contexts/UserContext";

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility to get first name from full name
  const getFirstName = (fullName?: string) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  // Separate function to get user profile data without affecting main profile
  const getUserProfileForAI = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('full_name, age, weight, height, weight_unit, activity_level, health_goals, dietary_restrictions')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error getting user profile for AI:', error);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile for AI:', error);
      return null;
    }
  };

  // Load existing generated plans
  const loadGeneratedPlans = async () => {
    console.log('🔍 loadGeneratedPlans called for user:', user?.id);
    setLoadingPlans(true);
    try {
      if (!user) {
        console.log('❌ No user found in loadGeneratedPlans');
        setLoadingPlans(false);
        return;
      }

      const { data: plans, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📡 Database response - plans:', plans, 'error:', error);

      if (error) {
        console.error('Error loading plans:', error);
      } else {
        // Clean up plan descriptions to remove JSON formatting (robust version)
        const cleanedPlans = (plans || []).map(plan => {
          if (plan.description) {
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(plan.description);
              if (parsed && typeof parsed === 'object' && parsed.description) {
                plan.description = parsed.description;
              }
            } catch {
              // Not JSON, leave as-is
            }
          }
          return plan;
        });
        
        console.log('✅ Final cleaned plans:', cleanedPlans);
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
    console.log('🔄 DietPlans: Loading plans on mount, user:', user?.id);
    loadGeneratedPlans();
  }, [user]);

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
      if (!user) {
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
      const profile = await getUserProfileForAI(realUserId);

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
        dailyMealsLength: aiPlanData.dailyMeals?.length || 0
      });
      
      // Generate embedding for the plan content
      console.log('Generating embedding for plan...');
      let embedding = await generatePlanEmbedding(aiPlanData);
      console.log('Generated embedding with dimensions:', embedding.length);

      // Ensure embedding is the correct dimension (try 1536, pad/truncate as needed)
      const REQUIRED_DIM = 1536;
      if (!Array.isArray(embedding) || embedding.length !== REQUIRED_DIM) {
        // If embedding is missing, not an array, or wrong length, use a zero vector
        embedding = Array(REQUIRED_DIM).fill(0);
      }
      // Supabase vector columns require string representation in array format
      const embeddingForDb = `{${embedding.join(",")}}`;

      // Get current user for database operations
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Save the generated plan to the database with embedding
      const { data: savedPlan, error: saveError } = await supabase
        .from('nutrition_plans')
        .insert({
          user_id: currentUser.id, // Add the user_id for RLS
          title: `${preferences.planType} Plan`,
          description: aiPlanData.description || `Personalized ${preferences.planType.toLowerCase()} plan`.replace(/\s+/g, ' ').trim(),
          plan_content: aiPlanData,
          duration: preferences.duration,
          calories: preferences.targetCalories,
          is_active: true, // Set as active by default
          embedding: embeddingForDb as unknown as string // Store as Postgres vector string
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

      // Check if this is a specific API error
      const errorMessage = (error as Error).message;
      let title = "Generation Failed";
      let description = "Unable to generate your diet plan. Please try again.";
      let variant: "default" | "destructive" = "destructive";

      if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
        title = "Service Temporarily Unavailable";
        description = "The AI service is currently overloaded. Please try again in a few minutes.";
        variant = "default";
      } else if (errorMessage.includes('429')) {
        title = "Rate Limit Reached";
        description = "Too many requests. Please wait a moment and try again.";
        variant = "default";
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('504')) {
        title = "Server Error";
        description = "The AI service is experiencing issues. Please try again shortly.";
        variant = "default";
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        title = "Connection Error";
        description = "Unable to connect to the AI service. Please check your internet connection and try again.";
        variant = "default";
      }

      toast({
        title,
        description,
        variant,
      });

      // Don't close the form on error so user can try again
      // setShowPlanForm(false);
    } finally {
      setGenerating(false);
    }
  };



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
      const userId = user?.id;
      // Create a text file from the content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `text-plan-${Date.now()}.txt`;
      const filePath = `diet-plans/${userId || 'demo'}/${fileName}`;

      // Upload the text file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('nutrition-files')
        .upload(filePath, textBlob);
      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('nutrition-files')
        .getPublicUrl(filePath);

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
          description: "Failed to delete plan",
          variant: "destructive"
        });
      } else {
        await loadGeneratedPlans();
        toast({
          title: "Plan Deleted",
          description: "The plan has been removed from your account.",
        });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not signed in",
          description: "You must be signed in to search plans.",
          variant: "destructive"
        });
        return;
      }

      const results = await searchPlansBySimilarity(searchQuery, user.id);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No plans found matching your search query.",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${results.length} plan(s) matching your query.`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search plans. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Activate or deactivate a plan
  const setPlanActive = async (planId: string, isActive: boolean) => {
    try {
      if (!user) return;
      // If activating, deactivate all others first
      if (isActive) {
        await supabase
          .from('nutrition_plans')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .neq('id', planId);
      }
      // Set the selected plan's active status
      const { error } = await supabase
        .from('nutrition_plans')
        .update({ is_active: isActive })
        .eq('id', planId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to update plan status', variant: 'destructive' });
      } else {
        await loadGeneratedPlans();
        toast({ title: isActive ? 'Plan Activated' : 'Plan Deactivated', description: isActive ? 'This plan is now active.' : 'This plan is now inactive.' });
      }
    } catch (error) {
      console.error('Error updating plan active status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <h1>Diet Plans - Testing</h1>
      </div>
        <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6 lg:py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-2 sm:mb-4 shadow-lg">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
            AI-Powered Diet Plans
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed px-4">
            Discover personalized nutrition plans powered by advanced AI algorithms,
            tailored to your unique health goals and dietary preferences
          </p>
        </div>

        {/* Colorful Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-purple-100 uppercase tracking-wider">Your AI Plans</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{generatedPlans.length}</p>
                  <p className="text-xs sm:text-sm text-purple-100">Generated plans</p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Brain className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-purple-400/30">
                <div className="flex items-center text-xs sm:text-sm text-purple-100">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span>AI-generated nutrition plans</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-blue-100 uppercase tracking-wider">Active Plans</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{generatedPlans.filter(plan => plan.is_active).length}</p>
                  <p className="text-xs sm:text-sm text-blue-100">Currently following</p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-400/30">
                <div className="flex items-center text-xs sm:text-sm text-blue-100">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span>Active nutrition tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-emerald-100 uppercase tracking-wider">Uploads Today</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{sessionUploads.length}</p>
                  <p className="text-xs sm:text-sm text-emerald-100">Files processed</p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-emerald-400/30">
                <div className="flex items-center text-xs sm:text-sm text-emerald-100">
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span>Health goals achieved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colorful Search and Filters */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Search & Discover</h3>
                  <p className="text-sm sm:text-base text-gray-700">Find the perfect nutrition plan for your goals</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search AI plans, dietary preferences, or health goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colorful Upload Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
          <CardHeader className="pb-4 sm:pb-6 border-b border-emerald-100">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Upload Your Diet Plan
                </CardTitle>
                <p className="text-sm sm:text-base text-gray-700 mt-1">Share your existing nutrition plans or create new ones</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
          {/* Upload Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-emerald-600" />
              Upload Your Diet Plan
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              {/* File Upload */}
              <div className="flex-1">
                <Label htmlFor="plan-file">Upload File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="plan-file"
                  accept=".pdf,.txt,.doc,.docx,.jpg,.png"
                  className="block w-full mt-2 border border-gray-300 rounded-lg p-2"
                  onChange={handleFileSelect}
                />
                <Input
                  placeholder="Plan Name"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  className="mt-2"
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || !selectedFile}
                  className="mt-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload
                </Button>
              </div>
              {/* Text Upload */}
              <div className="flex-1">
                <Label htmlFor="plan-text">Paste Diet Plan Text</Label>
                <Textarea
                  id="plan-text"
                  placeholder="Paste your diet plan here..."
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
                <Input
                  placeholder="Plan Name"
                  value={textPlanName}
                  onChange={e => setTextPlanName(e.target.value)}
                  className="mt-2"
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={submittingText || !textContent}
                  className="mt-2"
                >
                  {submittingText ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Submit Text
                </Button>
              </div>
            </div>
            {/* Uploaded Files List */}
            {sessionUploads.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Recent Uploads</h4>
                <ul className="space-y-2">
                  {sessionUploads.map(file => (
                    <li key={file.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.fileType)}
                        <span className="font-medium">{file.planName}</span>
                        <span className="text-xs text-gray-500">({file.size})</span>
                        {getUploadStatusBadge(file.status)}
                      </div>
                      {file.url && (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">View</a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeUpload(file.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* All Plans Section with View Button */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              All Diet Plans
            </h3>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : (
              generatedPlans.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No plans found. Generate or upload a new plan!</div>
              ) : (
                generatedPlans.map((plan) => (
                  <div key={plan.id} className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{plan.title}</h4>
                        <p className="text-sm text-gray-700">{plan.description}</p>
                        {/* Professional Price Display */}
                        {plan.price && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-block bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold px-3 py-1 rounded-full shadow-sm text-base">
                              ${parseFloat(plan.price).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">per plan</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedPlan(plan); setShowPlanDetails(true); }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Calendar className="h-4 w-4 mr-1" /> View
                        </Button>
                        {getStatusBadge(plan.is_active ? 'Active' : 'Available')}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlan(plan.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {plan.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPlanActive(plan.id, false)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPlanActive(plan.id, true)}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional AI Plan Generator CTA */}
      <Card className="border border-gray-200 shadow-xl bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden">
        <CardContent className="p-12 text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20"></div>
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="h-20 w-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Lightbulb className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Ready for Your Personalized AI Plan?
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                Our advanced AI analyzes your goals, preferences, and health data to create a nutrition plan that's uniquely yours.
                Start your journey to better health today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => {
                    console.log('Bottom Generate My AI Plan button clicked');
                    setShowPlanForm(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 text-lg font-semibold"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate My AI Plan
                </Button>
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50 px-8 py-3 text-lg font-semibold">
                  Learn More
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>Personalized nutrition</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>AI-powered recommendations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>Health goal tracking</span>
                </div>
              </div>
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
                                      <span className="text-xs text-gray-600">
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