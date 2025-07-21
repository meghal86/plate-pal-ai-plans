
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Download, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const AIGeneratedPlans = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[]>([]);
  const { toast } = useToast();

  const generateAIPlan = async () => {
    setGenerating(true);
    
    try {
      // Create a temporary user ID for demonstration (replace with actual auth later)
      const tempUserId = crypto.randomUUID();
      
      // Mock AI-generated plan for now (will be replaced with actual OpenAI integration)
      const mockPlan: GeneratedPlan = {
        id: `plan_${Date.now()}`,
        title: "Balanced Nutrition Plan",
        description: "AI-generated plan based on your profile and goals",
        duration: "4 weeks",
        calories: "1800-2000",
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

      // Save to the nutrition_plans table with proper type casting
      const { error } = await supabase
        .from('nutrition_plans')
        .insert({
          title: mockPlan.title,
          description: mockPlan.description,
          user_id: tempUserId,
          plan_content: mockPlan as Record<string, unknown>, // Use proper type instead of any
          duration: mockPlan.duration,
          calories: mockPlan.calories,
          is_active: true
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setGeneratedPlans(prev => [...prev, mockPlan]);
      
      toast({
        title: "AI Plan Generated!",
        description: "Your personalized diet plan has been created successfully",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate AI plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-health border-0 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Diet Plans</h3>
              <p className="text-primary-foreground/80">
                Generate personalized nutrition plans based on your profile and goals
              </p>
            </div>
            <Button
              onClick={generateAIPlan}
              disabled={generating}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedPlans.map((plan) => (
        <Card key={plan.id} className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-accent" />
                  {plan.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <Badge variant="default" className="bg-accent/10 text-accent">
                AI Generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 text-foreground">{plan.duration}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Daily Calories:</span>
                <span className="ml-2 text-foreground">{plan.calories}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Sample Meals:</h4>
              {plan.meals.map((meal, index) => (
                <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-foreground">{meal.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        P: {meal.macros.protein}g | C: {meal.macros.carbs}g | F: {meal.macros.fat}g
                      </p>
                    </div>
                    <Badge variant="secondary">{meal.calories} cal</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button variant="default" className="flex-1">
                <Star className="h-4 w-4 mr-2" />
                Activate Plan
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AIGeneratedPlans;
