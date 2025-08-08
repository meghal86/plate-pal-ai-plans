
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { 
  Calendar, 
  ChefHat, 
  Clock, 
  Zap, 
  Heart, 
  Apple,
  Play,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Star,
  Crown,
  ShoppingCart,
  Share2,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Bookmark,
  TrendingUp,
  Users,
  Target,
  Award,
  List
} from "lucide-react";

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];

interface SavedRecipe {
  id: string;
  recipe_id: string;
  user_id: string;
  kid_id?: string;
  scheduled_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_data: {
    name: string;
    calories: number;
    prep_time: string;
    difficulty: string;
    ingredients: string[];
    instructions: string[];
    nutrition_info: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
  };
  created_at: string;
  is_premium?: boolean;
  rating?: number;
  views?: number;
}

interface PlanCalendarProps {
  selectedChild?: KidsProfile | null;
}

const PlanCalendar: React.FC<PlanCalendarProps> = ({ selectedChild }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [mealFilter, setMealFilter] = useState<string>('all');
  const [isPremiumUser] = useState(true); // TODO: Implement premium check

  // Get current month's start and end dates
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Generate calendar days
  const calendarDays = [];
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    calendarDays.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }

  // Load saved recipes and AI-generated plans
  useEffect(() => {
    loadSavedRecipes();
    loadAIGeneratedPlans();
  }, [user?.id, selectedChild?.id]);

  const loadSavedRecipes = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load from localStorage for now
      const savedRecipesData = localStorage.getItem('savedRecipes');
      let recipes: SavedRecipe[] = [];
      
      if (savedRecipesData) {
        recipes = JSON.parse(savedRecipesData);
        // Filter recipes for the current user and selected child
        recipes = recipes.filter(recipe => 
          recipe.user_id === user.id && 
          (!selectedChild || recipe.kid_id === selectedChild.id)
        );
      }
      
      // Add premium recipes and enhanced data for professional demo
      if (recipes.length === 0) {
        recipes = generateProfessionalDemoData();
      }
      
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      toast({
        title: "Error",
        description: "Failed to load saved recipes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAIGeneratedPlans = async () => {
    if (!user?.id) return;
    
    try {
      // Load active AI-generated plans from database
      const { data: plans, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading AI plans:', error);
        return;
      }

      // Convert AI plans to calendar format
      if (plans && plans.length > 0) {
        const activePlan = plans[0];
        const aiRecipes = convertAIPlanToCalendarFormat(activePlan);
        setSavedRecipes(prev => [...prev, ...aiRecipes]);
      }
    } catch (error) {
      console.error('Error loading AI plans:', error);
    }
  };

  const convertAIPlanToCalendarFormat = (plan: any): SavedRecipe[] => {
    const recipes: SavedRecipe[] = [];
    
    if (plan.plan_content?.dailyMeals) {
      console.log('📅 Processing plan with', plan.plan_content.dailyMeals.length, 'days');
      plan.plan_content.dailyMeals.forEach((day: any, dayIndex: number) => {
        if (day.meals) {
          day.meals.forEach((meal: any, mealIndex: number) => {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
            
            recipes.push({
              id: `ai-${plan.id}-${dayIndex}-${mealIndex}`,
              recipe_id: `ai-recipe-${plan.id}-${dayIndex}-${mealIndex}`,
              user_id: user?.id || '',
              kid_id: selectedChild?.id,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
              meal_type: meal.mealType || 'lunch',
              is_premium: true,
              rating: 4.8,
              views: Math.floor(Math.random() * 1000) + 500,
              recipe_data: {
                name: meal.name || `AI Generated ${meal.mealType}`,
                calories: meal.calories || 400,
                prep_time: meal.prep_time || '15 min',
                difficulty: meal.difficulty || 'Easy',
                ingredients: meal.ingredients || ['AI generated ingredients'],
                instructions: meal.instructions || ['AI generated instructions'],
                nutrition_info: meal.macros || {
                  protein: 20,
                  carbs: 30,
                  fat: 15,
                  fiber: 8,
                  sugar: 10
                }
              },
              created_at: new Date().toISOString()
            });
          });
        }
      });
    }
    
    console.log('📅 Generated', recipes.length, 'recipes from plan data');
    return recipes;
  };

  const generateProfessionalDemoData = (): SavedRecipe[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        id: '1',
        recipe_id: 'recipe1',
        user_id: user?.id || '',
        kid_id: selectedChild?.id,
        scheduled_date: today.toISOString().split('T')[0],
        meal_type: 'lunch',
        is_premium: true,
        rating: 4.8,
        views: 1250,
        recipe_data: {
          name: 'Rainbow Power Bowl',
          calories: 420,
          prep_time: '15 min',
          difficulty: 'Easy',
          ingredients: ['Quinoa', 'Avocado', 'Cherry tomatoes', 'Cucumber', 'Red bell pepper', 'Chickpeas', 'Lemon juice', 'Olive oil'],
          instructions: [
            'Cook quinoa according to package instructions',
            'Chop all vegetables into bite-sized pieces',
            'Mix vegetables with cooked quinoa',
            'Add lemon juice and olive oil for dressing',
            'Serve with a smile!'
          ],
          nutrition_info: {
            protein: 18,
            carbs: 45,
            fat: 15,
            fiber: 12,
            sugar: 8
          }
        },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        recipe_id: 'recipe2',
        user_id: user?.id || '',
        kid_id: selectedChild?.id,
        scheduled_date: tomorrow.toISOString().split('T')[0],
        meal_type: 'breakfast',
        is_premium: false,
        rating: 4.5,
        views: 890,
        recipe_data: {
          name: 'Superhero Smoothie Bowl',
          calories: 380,
          prep_time: '8 min',
          difficulty: 'Very Easy',
          ingredients: ['Greek yogurt', 'Mixed berries', 'Banana', 'Honey', 'Granola', 'Chia seeds', 'Coconut flakes'],
          instructions: [
            'Blend yogurt, berries, and banana until smooth',
            'Pour into a bowl',
            'Top with granola, chia seeds, and coconut',
            'Drizzle with honey',
            'Create a superhero face with toppings!'
          ],
          nutrition_info: {
            protein: 22,
            carbs: 42,
            fat: 12,
            fiber: 8,
            sugar: 28
          }
        },
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        recipe_id: 'recipe3',
        user_id: user?.id || '',
        kid_id: selectedChild?.id,
        scheduled_date: nextWeek.toISOString().split('T')[0],
        meal_type: 'dinner',
        is_premium: true,
        rating: 4.9,
        views: 2100,
        recipe_data: {
          name: 'Dragon Breath Tacos',
          calories: 520,
          prep_time: '25 min',
          difficulty: 'Medium',
          ingredients: ['Whole grain tortillas', 'Ground turkey', 'Black beans', 'Corn', 'Bell peppers', 'Onion', 'Taco seasoning', 'Greek yogurt', 'Salsa'],
          instructions: [
            'Cook ground turkey with taco seasoning',
            'Add black beans and corn',
            'Warm tortillas',
            'Fill with turkey mixture',
            'Top with Greek yogurt and salsa',
            'Fold and enjoy the dragon breath!'
          ],
          nutrition_info: {
            protein: 32,
            carbs: 48,
            fat: 18,
            fiber: 10,
            sugar: 6
          }
        },
        created_at: new Date().toISOString()
      }
    ];
  };

  const getRecipesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    let recipes = savedRecipes.filter(recipe => recipe.scheduled_date === dateString);
    
    // Apply meal filter
    if (mealFilter !== 'all') {
      recipes = recipes.filter(recipe => recipe.meal_type === mealFilter);
    }
    
    return recipes;
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200';
      case 'lunch': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200';
      case 'dinner': return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200';
      case 'snack': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🍽️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍴';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      // Remove from localStorage
      const savedRecipesData = localStorage.getItem('savedRecipes');
      if (savedRecipesData) {
        const recipes = JSON.parse(savedRecipesData);
        const updatedRecipes = recipes.filter((recipe: SavedRecipe) => recipe.id !== recipeId);
        localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
      }
      
      // Update state
      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      
      toast({
        title: "Success",
        description: "Recipe removed from calendar",
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to remove recipe",
        variant: "destructive"
      });
    }
  };

  const getFilteredRecipes = () => {
    let recipes = [...savedRecipes];
    
    if (mealFilter !== 'all') {
      recipes = recipes.filter(recipe => recipe.meal_type === mealFilter);
    }
    
    return recipes.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  };

  const renderCalendarView = () => (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3 bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dayRecipes = getRecipesForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                  isCurrentMonthDay 
                    ? 'bg-white border-gray-200 hover:border-blue-300' 
                    : 'bg-gray-50 border-gray-100'
                } ${
                  isTodayDate ? 'ring-2 ring-blue-500 border-blue-300 shadow-lg' : ''
                }`}
              >
                {/* Date Number */}
                <div className={`text-sm font-bold mb-2 ${
                  isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                } ${isTodayDate ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>

                {/* Recipes for this day */}
                <div className="space-y-1">
                  {dayRecipes.slice(0, 3).map(recipe => (
                    <div
                      key={recipe.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setShowRecipeDialog(true);
                      }}
                    >
                      <div className={`text-xs p-1.5 rounded-lg border ${
                        getMealTypeColor(recipe.meal_type)
                      } group-hover:scale-105 transition-transform duration-200`}>
                        <div className="flex items-center gap-1">
                          <span>{getMealTypeIcon(recipe.meal_type)}</span>
                          <span className="truncate font-medium">{recipe.recipe_data.name}</span>
                          {recipe.is_premium && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayRecipes.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayRecipes.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {getFilteredRecipes().map(recipe => (
        <Card key={recipe.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 border-0 bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{recipe.recipe_data.name}</h3>
                  {recipe.is_premium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  <Badge className={getMealTypeColor(recipe.meal_type)}>
                    {recipe.meal_type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(new Date(recipe.scheduled_date))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipe.recipe_data.prep_time}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {recipe.recipe_data.calories} cal
                  </div>
                  {recipe.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      {recipe.rating}
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 text-sm mb-3">
                  {recipe.recipe_data.ingredients.slice(0, 3).join(', ')}...
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setShowRecipeDialog(true);
                  }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRecipe(recipe.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Premium Features */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Meal Calendar
            </h1>
            <p className="text-blue-100 mt-1">
              {selectedChild ? `Personalized meal plans for ${selectedChild.name}` : 'Your professional meal calendar'}
            </p>
            {isPremiumUser && (
              <div className="flex items-center gap-2 mt-2">
                <Crown className="h-4 w-4 text-yellow-300" />
                <span className="text-sm text-yellow-100">Premium Member</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigateMonth('prev')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateMonth('next')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={mealFilter} onValueChange={setMealFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter meals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Calendar/List View */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal calendar...</p>
        </Card>
      ) : viewMode === 'calendar' ? renderCalendarView() : renderListView()}

      {/* Recipe Detail Dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-500" />
              {selectedRecipe?.recipe_data.name}
              {selectedRecipe?.is_premium && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecipe && (
            <div className="space-y-6">
              {/* Recipe Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedRecipe.recipe_data.calories}</div>
                  <div className="text-xs text-gray-600">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedRecipe.recipe_data.prep_time}</div>
                  <div className="text-xs text-gray-600">Prep Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedRecipe.recipe_data.difficulty}</div>
                  <div className="text-xs text-gray-600">Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedRecipe.meal_type}</div>
                  <div className="text-xs text-gray-600">Meal Type</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{formatDate(new Date(selectedRecipe.scheduled_date))}</div>
                  <div className="text-xs text-gray-600">Scheduled</div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-500" />
                  Ingredients
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(() => {
                    const ingredients = selectedRecipe.recipe_data.ingredients;
                    // Handle both string and array formats
                    const ingredientArray = Array.isArray(ingredients) 
                      ? ingredients 
                      : typeof ingredients === 'string' 
                        ? ingredients.split(',').map(s => s.trim()).filter(s => s) 
                        : ['No ingredients available'];
                    
                    return ingredientArray.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        {ingredient}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  Instructions
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const instructions = selectedRecipe.recipe_data.instructions;
                    // Handle both string and array formats
                    const instructionArray = Array.isArray(instructions) 
                      ? instructions 
                      : typeof instructions === 'string' 
                        ? instructions.split(/\d+\.\s*/).filter(s => s.trim()) 
                        : ['No instructions available'];
                    
                    return instructionArray.map((instruction, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{instruction}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Nutrition Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Nutrition Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{selectedRecipe.recipe_data.nutrition_info.protein}g</div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{selectedRecipe.recipe_data.nutrition_info.carbs}g</div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{selectedRecipe.recipe_data.nutrition_info.fat}g</div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{selectedRecipe.recipe_data.nutrition_info.fiber}g</div>
                    <div className="text-sm text-gray-600">Fiber</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{selectedRecipe.recipe_data.nutrition_info.sugar}g</div>
                    <div className="text-sm text-gray-600">Sugar</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Shopping List
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Recipe
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={() => deleteRecipe(selectedRecipe.id)}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanCalendar;
