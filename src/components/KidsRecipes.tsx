import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChefHat, 
  Calendar, 
  Star, 
  Clock, 
  Users, 
  Zap, 
  Heart, 
  Apple,
  Baby,
  User,
  Plus,
  Save,
  Share2,
  Bookmark,
  Play,
  Loader2,
  Sparkles,
  Eye
} from "lucide-react";

// Interface for recipe data
interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  age_group: string;
  calories: number;
  prep_time: string;
  difficulty: string;
  image_url?: string;
  ingredients: string[];
  instructions: string[];
  nutrition_info: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  created_at?: string;
}

// Age group options
const ageGroups = [
  { value: "2-5", label: "2-5 years", icon: Baby },
  { value: "6-12", label: "6-12 years", icon: User }
];

// Mock data for initial recipes
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Dino Veggie Bites",
    subtitle: "Low Sugar, 300 Cal",
    age_group: "2-5",
    calories: 300,
    prep_time: "15 min",
    difficulty: "Easy",
    image_url: "/placeholder-dino.jpg",
    ingredients: ["Broccoli", "Carrots", "Cheese", "Whole grain bread"],
    instructions: [
      "Chop vegetables into fun dinosaur shapes",
      "Mix with cheese and breadcrumbs",
      "Bake at 350°F for 12 minutes"
    ],
    nutrition_info: {
      protein: 12,
      carbs: 25,
      fat: 8,
      fiber: 6,
      sugar: 3
    }
  },
  {
    id: "2",
    name: "Rainbow Fruit Smoothie",
    subtitle: "High Vitamins, 250 Cal",
    age_group: "6-12",
    calories: 250,
    prep_time: "8 min",
    difficulty: "Easy",
    image_url: "/placeholder-smoothie.jpg",
    ingredients: ["Strawberries", "Banana", "Spinach", "Greek yogurt"],
    instructions: [
      "Blend fruits with yogurt",
      "Add spinach for extra nutrition",
      "Serve immediately"
    ],
    nutrition_info: {
      protein: 15,
      carbs: 35,
      fat: 2,
      fiber: 8,
      sugar: 22
    }
  },
  {
    id: "3",
    name: "Mini Pizza Faces",
    subtitle: "Fun & Nutritious, 400 Cal",
    age_group: "6-12",
    calories: 400,
    prep_time: "20 min",
    difficulty: "Medium",
    image_url: "/placeholder-pizza.jpg",
    ingredients: ["Whole grain tortilla", "Tomato sauce", "Cheese", "Vegetables"],
    instructions: [
      "Spread sauce on tortilla",
      "Add cheese and vegetable toppings",
      "Bake until cheese melts"
    ],
    nutrition_info: {
      protein: 18,
      carbs: 45,
      fat: 12,
      fiber: 5,
      sugar: 4
    }
  }
];

const KidsRecipes: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // State management
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("2-5");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Language detection for Hindi/English placeholders
  const isHindi = navigator.language?.startsWith('hi') || false;

  // Placeholders based on language
  const placeholders = {
    title: isHindi ? "बच्चों के लिए व्यंजन" : "Kids' Recipes",
    subtitle: isHindi ? "स्वस्थ और मज़ेदार भोजन" : "Healthy & Fun Meals",
    generateRecipe: isHindi ? "व्यंजन बनाएं" : "Generate Recipe",
    saveToCalendar: isHindi ? "कैलेंडर में सहेजें" : "Save to Calendar",
    ageGroup: isHindi ? "आयु समूह" : "Age Group",
    selectAge: isHindi ? "आयु चुनें" : "Select Age",
    loading: isHindi ? "लोड हो रहा है..." : "Loading...",
    generating: isHindi ? "व्यंजन बन रहा है..." : "Generating recipe...",
    saving: isHindi ? "सहेज रहा है..." : "Saving...",
    success: isHindi ? "सफल!" : "Success!",
    error: isHindi ? "त्रुटि" : "Error",
    recipeSaved: isHindi ? "व्यंजन सहेजा गया" : "Recipe saved to calendar",
    recipeGenerated: isHindi ? "नया व्यंजन बनाया गया" : "New recipe generated",
    noRecipes: isHindi ? "कोई व्यंजन नहीं मिला" : "No recipes found"
  };

  // Load recipes from database (commented for future Supabase integration)
  useEffect(() => {
    loadRecipes();
  }, [selectedAgeGroup]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      // TODO: Uncomment when Supabase integration is ready
      /*
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('age_group', selectedAgeGroup)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading recipes:', error);
        toast({
          title: placeholders.error,
          description: "Failed to load recipes",
          variant: "destructive"
        });
      } else {
        setRecipes(data || mockRecipes);
      }
      */
      
      // For now, filter mock recipes by age group
      const filteredRecipes = mockRecipes.filter(recipe => 
        recipe.age_group === selectedAgeGroup
      );
      setRecipes(filteredRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate recipe using Gemini API
  const generateRecipe = async () => {
    if (!user?.id) {
      toast({
        title: placeholders.error,
        description: "Please sign in to generate recipes",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Create a kid-friendly recipe for age group ${selectedAgeGroup} years old. 
      Requirements:
      - Total calories: 1200
      - Low sugar content
      - High in vitamins and nutrients
      - Fun and appealing presentation
      - Easy to prepare
      - Include ingredients list and step-by-step instructions
      - Add nutrition information (protein, carbs, fat, fiber, sugar)
      
      Format the response as JSON with the following structure:
      {
        "name": "Recipe Name",
        "subtitle": "Brief description",
        "calories": 1200,
        "prep_time": "15 min",
        "difficulty": "Easy",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "nutrition_info": {
          "protein": 25,
          "carbs": 150,
          "fat": 30,
          "fiber": 15,
          "sugar": 8
        }
      }`;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'}`
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      const generatedRecipe = JSON.parse(data.candidates[0].content.parts[0].text);
      
      // Create new recipe object
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        ...generatedRecipe,
        age_group: selectedAgeGroup,
        created_at: new Date().toISOString()
      };

      // TODO: Save to Supabase
      /*
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: newRecipe.name,
          subtitle: newRecipe.subtitle,
          age_group: newRecipe.age_group,
          calories: newRecipe.calories,
          prep_time: newRecipe.prep_time,
          difficulty: newRecipe.difficulty,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          nutrition_info: newRecipe.nutrition_info
        });
      
      if (error) {
        console.error('Error saving recipe:', error);
      }
      */

      // Add to local state
      setRecipes(prev => [newRecipe, ...prev]);
      
      toast({
        title: placeholders.success,
        description: placeholders.recipeGenerated,
      });

    } catch (error) {
      console.error('Error generating recipe:', error);
      toast({
        title: placeholders.error,
        description: "Failed to generate recipe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Save recipe to calendar
  const saveToCalendar = async (recipe: Recipe) => {
    setSaving(true);
    try {
      // TODO: Implement calendar integration
      // For now, just show success message
      toast({
        title: placeholders.success,
        description: placeholders.recipeSaved,
      });
    } catch (error) {
      console.error('Error saving to calendar:', error);
      toast({
        title: placeholders.error,
        description: "Failed to save to calendar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            {placeholders.title}
          </h1>
          <p className="text-gray-600 mt-1">{placeholders.subtitle}</p>
        </div>
        
        {/* Age Group Filter */}
        <div className="flex items-center gap-3">
          <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={placeholders.selectAge} />
            </SelectTrigger>
            <SelectContent>
              {ageGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <SelectItem key={group.value} value={group.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {group.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button
            onClick={generateRecipe}
            disabled={generating}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {generating ? placeholders.generating : placeholders.generateRecipe}
          </Button>
        </div>
      </div>

      {/* Recipe Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">{placeholders.loading}</span>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{placeholders.noRecipes}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Recipe Image */}
              <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-orange-400" />
              </div>
              
              <CardContent className="p-6">
                {/* Recipe Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {recipe.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {recipe.subtitle}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {recipe.prep_time}
                      <span className="mx-1">•</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}
                      >
                        {recipe.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span>{recipe.calories} cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>{recipe.nutrition_info.protein}g protein</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setShowRecipeDialog(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveToCalendar(recipe)}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-1" />
                    )}
                    {saving ? placeholders.saving : placeholders.saveToCalendar}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-500" />
              {selectedRecipe?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecipe && (
            <div className="space-y-6">
              {/* Recipe Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedRecipe.prep_time}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {selectedRecipe.calories} calories
                </div>
                <Badge variant="secondary" className={getDifficultyColor(selectedRecipe.difficulty)}>
                  {selectedRecipe.difficulty}
                </Badge>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-500" />
                  Ingredients
                </h4>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  Instructions
                </h4>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Nutrition Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Nutrition Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-600">{selectedRecipe.nutrition_info.protein}g</div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-600">{selectedRecipe.nutrition_info.carbs}g</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-yellow-600">{selectedRecipe.nutrition_info.fat}g</div>
                    <div className="text-xs text-gray-600">Fat</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-600">{selectedRecipe.nutrition_info.fiber}g</div>
                    <div className="text-xs text-gray-600">Fiber</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-semibold text-red-600">{selectedRecipe.nutrition_info.sugar}g</div>
                    <div className="text-xs text-gray-600">Sugar</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => saveToCalendar(selectedRecipe)}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {saving ? placeholders.saving : placeholders.saveToCalendar}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KidsRecipes; 