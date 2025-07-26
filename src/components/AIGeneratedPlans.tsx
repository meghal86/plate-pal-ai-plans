
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Loader2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Heart, 
  Zap, 
  Calendar,
  Activity,
  Award,
  CheckCircle,
  ArrowRight,
  Plus,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDietPlan } from "@/api/generate-diet-plan";

interface GeneratedPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  calories: string;
  meals: Array<{
    name: string;
    calories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
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

const AIGeneratedPlans = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planPreferences, setPlanPreferences] = useState<PlanPreferences>({
    planType: "",
    duration: "",
    targetCalories: "",
    dietaryRestrictions: "",
    healthGoals: "",
    activityLevel: "",
    specialRequirements: ""
  });
  const { toast } = useToast();

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

  const generateAIPlan = async () => {
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
        - Plan Type: ${planPreferences.planType}
        - Duration: ${planPreferences.duration}
        - Target Calories: ${planPreferences.targetCalories} per day
        - Dietary Restrictions: ${planPreferences.dietaryRestrictions || 'None'}
        - Health Goals: ${planPreferences.healthGoals || 'General health'}
        - Activity Level: ${planPreferences.activityLevel || 'Moderate'}
        - Special Requirements: ${planPreferences.specialRequirements || 'None'}
      `;

      // Call Gemini API for plan generation
      const aiPlanData = await generateDietPlan(userContext, realUserId);
      
      // Create plan object from AI response
      const aiPlan: GeneratedPlan = {
        id: `plan_${Date.now()}`,
        title: aiPlanData.title || `${planPreferences.planType} Plan`,
        description: aiPlanData.description || `Personalized ${planPreferences.planType.toLowerCase()} plan for ${planPreferences.duration}`,
        duration: aiPlanData.duration || planPreferences.duration,
        calories: aiPlanData.calories || planPreferences.targetCalories,
        meals: aiPlanData.meals || []
      };

      // Save to the nutrition_plans table
      const { error } = await supabase
        .from('nutrition_plans')
        .insert({
          title: aiPlan.title,
          description: aiPlan.description,
          user_id: realUserId,
          plan_content: aiPlan as any,
          duration: aiPlan.duration,
          calories: aiPlan.calories,
          is_active: true
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setGeneratedPlans(prev => [...prev, aiPlan]);
      setShowPlanForm(false);
      
      toast({
        title: "AI Plan Generated!",
        description: `Your personalized ${planPreferences.planType.toLowerCase()} plan has been created successfully`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      
      // Fallback to mock plan if AI generation fails
      const mockPlan: GeneratedPlan = {
        id: `plan_${Date.now()}`,
        title: `${planPreferences.planType} Plan`,
        description: `Personalized ${planPreferences.planType.toLowerCase()} plan for ${planPreferences.duration}`,
        duration: planPreferences.duration,
        calories: planPreferences.targetCalories,
        meals: [
          {
            name: "Greek Yogurt with Berries",
            calories: 250,
            macros: { protein: 20, carbs: 30, fat: 8 }
          },
          {
            name: "Grilled Chicken Salad",
            calories: 400,
            macros: { protein: 35, carbs: 25, fat: 18 }
          },
          {
            name: "Salmon with Quinoa",
            calories: 500,
            macros: { protein: 40, carbs: 45, fat: 22 }
          }
        ]
      };

      setGeneratedPlans(prev => [...prev, mockPlan]);
      setShowPlanForm(false);
      
      toast({
        title: "Plan Generated (Fallback)",
        description: `Generated a ${planPreferences.planType.toLowerCase()} plan. AI features will be available soon.`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Generation Form */}
      {showPlanForm && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Brain className="h-5 w-5 mr-3 text-purple-600" />
                Create Your AI Plan
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlanForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-600">Tell us about your goals and preferences to generate a personalized plan</p>
          </CardHeader>
          <CardContent className="space-y-6">
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
                <Label htmlFor="activity-level">Activity Level</Label>
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
                placeholder="e.g., No dairy, gluten-free, vegetarian"
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
                placeholder="e.g., Lose 10 pounds, build muscle, improve energy levels, manage diabetes"
                value={planPreferences.healthGoals}
                onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label htmlFor="special-requirements">Special Requirements</Label>
              <Textarea
                id="special-requirements"
                placeholder="e.g., Food allergies, medical conditions, time constraints, budget considerations"
                value={planPreferences.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPlanForm(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={generateAIPlan}
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
          </CardContent>
        </Card>
      )}

      {/* Main CTA Card */}
      {!showPlanForm && (
        <Card className="bg-gradient-health border-0 text-primary-foreground relative z-10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Diet Plans</h3>
                <p className="text-primary-foreground/80">
                  Generate personalized nutrition plans based on your profile and goals
                </p>
              </div>
              <Button
                onClick={() => {
                  console.log('Generate My AI Plan button clicked');
                  setShowPlanForm(true);
                }}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 relative z-20 pointer-events-auto"
                style={{ pointerEvents: 'auto' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate My AI Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Plans Display */}
      {generatedPlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Generated Plans</h3>
          {generatedPlans.map((plan) => (
            <Card key={plan.id} className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      {plan.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">{plan.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">{plan.calories} cal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600">{plan.meals.length} meals</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Sample Meals</h4>
                  {plan.meals.slice(0, 3).map((meal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Heart className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{meal.name}</p>
                          <p className="text-xs text-gray-500">{meal.calories} calories</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-2 text-xs">
                          <span className="text-blue-600">P: {meal.macros.protein}g</span>
                          <span className="text-green-600">C: {meal.macros.carbs}g</span>
                          <span className="text-orange-600">F: {meal.macros.fat}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    View Full Plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Features Highlight */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Powered by Advanced AI</h3>
            <p className="text-gray-600 mb-4">
              Our AI analyzes your profile, goals, and preferences to create personalized nutrition plans
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Personalized</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span>Expert Quality</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span>Instant Generation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIGeneratedPlans;
