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
import { API_CONFIG } from "@/config/api";
import type { Database } from '@/integrations/supabase/types';
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

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];

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
  dietary_preferences: string[];
  allergens: string[];
  created_at?: string;
}

// Interface for kid preferences
interface KidPreferences {
  age_group: string;
  dietary_restrictions: string[];
  favorite_foods: string[];
  disliked_foods: string[];
  allergies: string[];
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time_available: 'quick' | 'moderate' | 'elaborate';
}

// Age group options
const ageGroups = [
  { value: "2-5", label: "2-5 years", icon: Baby },
  { value: "6-12", label: "6-12 years", icon: User }
];

// Helper function to determine age group from age
const getAgeGroupFromAge = (age: number): string => {
  if (age >= 2 && age <= 5) return "2-5";
  if (age >= 6 && age <= 12) return "6-12";
  return "2-5"; // default fallback
};

// Helper function to calculate age from birth date
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper function to extract preferences from kid profile
const extractPreferencesFromKid = (kid: KidsProfile): KidPreferences => {
  const age = calculateAge(kid.birth_date);
  const ageGroup = getAgeGroupFromAge(age);
  
  // Extract preferences from the preferences JSON column
  const storedPreferences = kid.preferences as any || {};
  
  return {
    age_group: ageGroup,
    dietary_restrictions: storedPreferences.dietary_preferences || [],
    favorite_foods: storedPreferences.favorite_foods || [],
    disliked_foods: storedPreferences.disliked_foods || [],
    allergies: storedPreferences.allergies || [],
    cooking_skill: storedPreferences.cooking_skill || 'beginner',
    meal_type: 'lunch', // default
    time_available: 'moderate' // default
  };
};

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
    },
    dietary_preferences: ['vegetarian'],
    allergens: ['dairy']
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
    },
    dietary_preferences: ['vegetarian'],
    allergens: ['dairy']
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
    },
    dietary_preferences: ['vegetarian'],
    allergens: ['dairy', 'gluten']
  }
];

interface KidsRecipesProps {
  selectedChild?: KidsProfile | null;
}

const KidsRecipes: React.FC<KidsRecipesProps> = ({ selectedChild }) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // State management
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("2-5");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Kid preferences state
  const [kidPreferences, setKidPreferences] = useState<KidPreferences>({
    age_group: "2-5",
    dietary_restrictions: [],
    favorite_foods: [],
    disliked_foods: [],
    allergies: [],
    cooking_skill: 'beginner',
    meal_type: 'lunch',
    time_available: 'moderate'
  });

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

  // Auto-populate preferences when selectedChild changes
  useEffect(() => {
    if (selectedChild) {
      console.log('👶 Auto-populating preferences for child:', selectedChild.name);
      const preferences = extractPreferencesFromKid(selectedChild);
      setKidPreferences(preferences);
      setSelectedAgeGroup(preferences.age_group);
      
      console.log('✅ Preferences auto-populated:', preferences);
      
      // Removed toast notification to prevent annoying popups
    }
  }, [selectedChild, toast]);

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

    if (!selectedChild) {
      toast({
        title: placeholders.error,
        description: "Please select a child first",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    // Calculate calories based on meal type and age group
    const calorieRanges = {
      breakfast: { "2-5": [200, 350], "6-12": [300, 500] },
      lunch: { "2-5": [300, 450], "6-12": [400, 600] },
      dinner: { "2-5": [400, 550], "6-12": [500, 700] },
      snack: { "2-5": [100, 200], "6-12": [150, 300] }
    };
    
    const mealType = kidPreferences.meal_type;
    const ageGroup = kidPreferences.age_group;
    const [minCal, maxCal] = calorieRanges[mealType as keyof typeof calorieRanges]?.[ageGroup as keyof typeof calorieRanges["breakfast"]] || [400, 600];
    const calories = Math.floor(Math.random() * (maxCal - minCal + 1)) + minCal;
    
    try {
      // Create a more personalized recipe based on child's preferences
      const mealTypes = {
        breakfast: ['Oatmeal', 'Pancakes', 'Smoothie Bowl', 'Eggs', 'Toast', 'Yogurt Parfait'],
        lunch: ['Pizza', 'Pasta', 'Burger', 'Sandwich', 'Rice Bowl', 'Quesadilla'],
        dinner: ['Tacos', 'Stir Fry', 'Soup', 'Casserole', 'Grilled Chicken', 'Pasta'],
        snack: ['Smoothie', 'Trail Mix', 'Yogurt', 'Fruit', 'Crackers', 'Popcorn']
      };

      const availableMeals = mealTypes[mealType as keyof typeof mealTypes] || mealTypes.lunch;
      const randomMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      
      // Create age-appropriate recipe name
      const agePrefix = ageGroup === '2-5' ? 'Fun Dino' : 'Rainbow';
      const skillLevel = kidPreferences.cooking_skill;
      const timeLevel = kidPreferences.time_available;
      
      // Adjust prep time based on time available and age
      const prepTimes = {
        quick: ageGroup === '2-5' ? '8 min' : '10 min',
        moderate: ageGroup === '2-5' ? '15 min' : '20 min',
        elaborate: ageGroup === '2-5' ? '25 min' : '35 min'
      };
      
      // Adjust difficulty based on cooking skill and age
      const difficulties = {
        beginner: ageGroup === '2-5' ? 'Very Easy' : 'Easy',
        intermediate: 'Medium',
        advanced: 'Advanced'
      };
      
      // Create personalized ingredients based on child's preferences
      const baseIngredients = [
        "Whole grain bread",
        "Fresh vegetables",
        "Lean protein",
        "Healthy fats"
      ];
      
      // Add favorite foods if available (prioritize them)
      const favoriteIngredients = kidPreferences.favorite_foods.slice(0, 3);
      const allIngredients = [...favoriteIngredients, ...baseIngredients];
      
      // Filter out disliked foods and allergies
      const filteredIngredients = allIngredients.filter(ingredient => {
        const lowerIngredient = ingredient.toLowerCase();
        return !kidPreferences.disliked_foods.some(
          disliked => lowerIngredient.includes(disliked.toLowerCase())
        ) && !kidPreferences.allergies.some(
          allergy => lowerIngredient.includes(allergy.toLowerCase())
        );
      });
      
      // Add dietary restrictions consideration
      const dietaryInfo = kidPreferences.dietary_restrictions.length > 0 
        ? ` (${kidPreferences.dietary_restrictions.join(', ')})` 
        : '';
      
      const mockRecipe = {
        name: `${agePrefix} ${randomMeal}${dietaryInfo}`,
        subtitle: `${skillLevel} level, ${timeLevel} prep - ${calories} calories`,
        age_group: ageGroup,
        calories: calories,
        prep_time: prepTimes[timeLevel as keyof typeof prepTimes],
        difficulty: difficulties[skillLevel as keyof typeof difficulties],
        ingredients: filteredIngredients.slice(0, 6),
        instructions: [
          "Gather all fresh ingredients",
          "Prepare according to skill level",
          "Make it fun and colorful",
          "Serve with love and care"
        ],
        nutrition_info: {
          protein: Math.floor(calories * 0.15 / 4), // 15% of calories from protein
          carbs: Math.floor(calories * 0.55 / 4),   // 55% of calories from carbs
          fat: Math.floor(calories * 0.30 / 9),     // 30% of calories from fat
          fiber: Math.floor(calories * 0.03),       // 3% fiber
          sugar: Math.floor(calories * 0.10 / 4)    // 10% sugar
        },
        dietary_preferences: kidPreferences.dietary_restrictions,
        allergens: kidPreferences.allergies
      };

      const apiKey = API_CONFIG.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      // Create a comprehensive prompt based on preferences
      const prompt = `Create a personalized kid-friendly recipe with the following requirements:

Age Group: ${kidPreferences.age_group} years old
Meal Type: ${kidPreferences.meal_type}
Cooking Skill: ${kidPreferences.cooking_skill}
Time Available: ${kidPreferences.time_available}
Dietary Restrictions: ${kidPreferences.dietary_restrictions.join(', ') || 'None'}
Allergies to Avoid: ${kidPreferences.allergies.join(', ') || 'None'}
Favorite Foods: ${kidPreferences.favorite_foods.join(', ') || 'Any'}
Disliked Foods: ${kidPreferences.disliked_foods.join(', ') || 'None'}

Requirements:
- Total calories: ${calories}
- Age-appropriate and fun presentation
- Easy to follow instructions
- Nutritious and balanced
- Safe for the specified allergies
- Respect dietary restrictions
- Include favorite foods when possible
- Avoid disliked foods

Format the response as JSON with the following structure:
{
  "name": "Recipe Name",
  "subtitle": "Brief description",
  "calories": ${calories},
  "prep_time": "X min",
  "difficulty": "Easy/Medium/Advanced",
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "nutrition_info": {
    "protein": X,
    "carbs": X,
    "fat": X,
    "fiber": X,
    "sugar": X
  },
  "dietary_preferences": ["vegetarian", "vegan", etc],
  "allergens": ["dairy", "nuts", etc]
}`;

      console.log('🌐 Calling Gemini API with personalized preferences...');
      
      const response = await fetch(`${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log('📝 Raw API response text:', responseText);

      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in API response');
      }

      const generatedRecipe = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!generatedRecipe.name || !generatedRecipe.ingredients || !generatedRecipe.instructions) {
        throw new Error('Invalid recipe structure in API response');
      }
      
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
      
      // Fallback to mock data if API fails
      console.log('🔄 API failed, using fallback mock recipe...');
      const fallbackRecipe = {
        name: `${kidPreferences.age_group === '2-5' ? 'Fun Dino' : 'Rainbow'} ${kidPreferences.meal_type.charAt(0).toUpperCase() + kidPreferences.meal_type.slice(1)}`,
        subtitle: `${kidPreferences.cooking_skill} level, ${kidPreferences.time_available} prep - ${calories} calories`,
        calories: calories,
        prep_time: kidPreferences.time_available === 'quick' ? '10 min' : kidPreferences.time_available === 'moderate' ? '20 min' : '35 min',
        difficulty: kidPreferences.cooking_skill === 'beginner' ? 'Easy' : kidPreferences.cooking_skill === 'intermediate' ? 'Medium' : 'Advanced',
        ingredients: [
          "Whole grain bread",
          "Fresh vegetables",
          "Lean protein",
          "Healthy fats",
          ...kidPreferences.favorite_foods.slice(0, 2)
        ].filter(ingredient => 
          !kidPreferences.disliked_foods.some(disliked => 
            ingredient.toLowerCase().includes(disliked.toLowerCase())
          )
        ),
        instructions: [
          "Gather all fresh ingredients",
          "Prepare according to skill level",
          "Make it fun and colorful",
          "Serve with love and care"
        ],
        nutrition_info: {
          protein: Math.floor(calories * 0.15 / 4),
          carbs: Math.floor(calories * 0.55 / 4),
          fat: Math.floor(calories * 0.30 / 9),
          fiber: Math.floor(calories * 0.03),
          sugar: Math.floor(calories * 0.08)
        },
        dietary_preferences: kidPreferences.dietary_restrictions,
        allergens: kidPreferences.allergies
      };
      
      const generatedRecipe = fallbackRecipe;
      
      // Create new recipe object
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        ...generatedRecipe,
        age_group: selectedAgeGroup,
        created_at: new Date().toISOString()
      };

      // Add to local state
      setRecipes(prev => [newRecipe, ...prev]);
      
      toast({
        title: "Recipe Generated (Fallback)",
        description: "API unavailable, using personalized mock recipe",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Save recipe to calendar
  const saveToCalendar = async (recipe: Recipe) => {
    if (!user?.id || !selectedChild) {
      toast({
        title: placeholders.error,
        description: "Please select a child first",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Create enhanced recipe data for professional calendar
      const savedRecipe = {
        id: Date.now().toString(),
        recipe_id: recipe.id,
        user_id: user.id,
        kid_id: selectedChild.id,
        scheduled_date: new Date().toISOString().split('T')[0], // Today's date
        meal_type: kidPreferences.meal_type,
        is_premium: Math.random() > 0.5, // Random premium indicator for demo
        rating: (4.0 + Math.random() * 1.0).toFixed(1), // Random rating between 4.0-5.0
        views: Math.floor(Math.random() * 2000) + 100, // Random views
        recipe_data: {
          name: recipe.name,
          calories: recipe.calories,
          prep_time: recipe.prep_time,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrition_info: recipe.nutrition_info
        },
        created_at: new Date().toISOString()
      };

      // Get existing saved recipes from localStorage
      const existingRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
      const updatedRecipes = [...existingRecipes, savedRecipe];
      localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));

      toast({
        title: placeholders.success,
        description: `${recipe.name} saved to calendar for ${selectedChild.name}`,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            {placeholders.title}
          </h1>
          <p className="text-gray-600 mt-1">{placeholders.subtitle}</p>
          
          {/* Auto-populated preferences indicator */}
          {selectedChild && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                <span>Auto-populated for {selectedChild.name}</span>
              </div>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">
                Age: {calculateAge(selectedChild.birth_date)} years ({kidPreferences.age_group})
              </span>
            </div>
          )}
        </div>
        
        {/* Age Group Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
            <SelectTrigger className="w-full sm:w-48">
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
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Preferences Button */}
            <Button 
              variant="outline"
              onClick={() => setShowPreferencesForm(true)}
              className="border-orange-200 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
            >
              <User className="h-4 w-4 mr-2" />
              {selectedChild ? `${selectedChild.name}'s Prefs` : (isHindi ? "प्राथमिकताएं" : "Preferences")}
            </Button>
            
            <Button
              onClick={generateRecipe}
              disabled={generating || !selectedChild}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white w-full sm:w-auto"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Preferences Form Dialog */}
      <Dialog open={showPreferencesForm} onOpenChange={setShowPreferencesForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              {isHindi ? "बच्चे की प्राथमिकताएं" : "Kid's Preferences"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Age Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "आयु समूह" : "Age Group"}
              </label>
              <Select 
                value={kidPreferences.age_group} 
                onValueChange={(value) => setKidPreferences(prev => ({ ...prev, age_group: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-5">2-5 years</SelectItem>
                  <SelectItem value="6-12">6-12 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "भोजन का प्रकार" : "Meal Type"}
              </label>
              <Select 
                value={kidPreferences.meal_type} 
                onValueChange={(value) => setKidPreferences(prev => ({ ...prev, meal_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cooking Skill */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "खाना बनाने का स्तर" : "Cooking Skill Level"}
              </label>
              <Select 
                value={kidPreferences.cooking_skill} 
                onValueChange={(value) => setKidPreferences(prev => ({ ...prev, cooking_skill: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Available */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "उपलब्ध समय" : "Time Available"}
              </label>
              <Select 
                value={kidPreferences.time_available} 
                onValueChange={(value) => setKidPreferences(prev => ({ ...prev, time_available: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (10-15 min)</SelectItem>
                  <SelectItem value="moderate">Moderate (20-30 min)</SelectItem>
                  <SelectItem value="elaborate">Elaborate (30+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "आहार प्रतिबंध" : "Dietary Restrictions"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'egg-free'].map((restriction) => (
                  <label key={restriction} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={kidPreferences.dietary_restrictions.includes(restriction)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setKidPreferences(prev => ({
                            ...prev,
                            dietary_restrictions: [...prev.dietary_restrictions, restriction]
                          }));
                        } else {
                          setKidPreferences(prev => ({
                            ...prev,
                            dietary_restrictions: prev.dietary_restrictions.filter(r => r !== restriction)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{restriction.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "एलर्जी" : "Allergies"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['peanuts', 'tree nuts', 'milk', 'eggs', 'soy', 'wheat', 'fish', 'shellfish'].map((allergy) => (
                  <label key={allergy} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={kidPreferences.allergies.includes(allergy)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setKidPreferences(prev => ({
                            ...prev,
                            allergies: [...prev.allergies, allergy]
                          }));
                        } else {
                          setKidPreferences(prev => ({
                            ...prev,
                            allergies: prev.allergies.filter(a => a !== allergy)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Favorite Foods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "पसंदीदा खाद्य पदार्थ" : "Favorite Foods"}
              </label>
              <input
                type="text"
                placeholder={isHindi ? "उदाहरण: पिज़्ज़ा, पास्ता, फल" : "e.g., pizza, pasta, fruits"}
                value={kidPreferences.favorite_foods.join(', ')}
                onChange={(e) => {
                  const foods = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                  setKidPreferences(prev => ({ ...prev, favorite_foods: foods }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Disliked Foods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "नापसंद खाद्य पदार्थ" : "Disliked Foods"}
              </label>
              <input
                type="text"
                placeholder={isHindi ? "उदाहरण: ब्रोकोली, मछली" : "e.g., broccoli, fish"}
                value={kidPreferences.disliked_foods.join(', ')}
                onChange={(e) => {
                  const foods = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                  setKidPreferences(prev => ({ ...prev, disliked_foods: foods }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setShowPreferencesForm(false)}
                className="flex-1"
              >
                {isHindi ? "सहेजें" : "Save Preferences"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreferencesForm(false)}
                className="flex-1"
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KidsRecipes; 