import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
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
  List,
  Utensils,
  Activity,
  Flame
} from "lucide-react";

interface DietPlanMeal {
  id: string;
  plan_id: string;
  user_id: string;
  scheduled_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_data: {
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
  is_completed?: boolean;
  rating?: number;
}

const AdultDietCalendar: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [dietPlanMeals, setDietPlanMeals] = useState<DietPlanMeal[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<DietPlanMeal | null>(null);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [mealFilter, setMealFilter] = useState<string>('all');
  const [activePlan, setActivePlan] = useState<any>(null);

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

  // Load active diet plan and meals
  useEffect(() => {
    if (user?.id) {
      loadActiveDietPlan();
      loadDietPlanMeals();
    }
  }, [user?.id, currentDate]);

  const loadActiveDietPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading active plan:', error);
        return;
      }

      setActivePlan(data);
    } catch (error) {
      console.error('Error loading active plan:', error);
    }
  };

  const loadDietPlanMeals = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // For now, we'll generate mock data since we don't have a meals table yet
      // In a real implementation, you would query the meals table
      const mockMeals = generateMockMeals();
      setDietPlanMeals(mockMeals);
      
    } catch (error) {
      console.error('Error loading diet plan meals:', error);
      toast({
        title: "Error",
        description: "Failed to load meal plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock meals for demonstration
  const generateMockMeals = (): DietPlanMeal[] => {
    const meals = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    const sampleMeals = {
      breakfast: [
        { name: 'Greek Yogurt Parfait', calories: 320, protein: 20, carbs: 35, fat: 8 },
        { name: 'Avocado Toast', calories: 280, protein: 12, carbs: 30, fat: 16 },
        { name: 'Protein Smoothie', calories: 250, protein: 25, carbs: 20, fat: 6 },
        { name: 'Oatmeal with Berries', calories: 300, protein: 10, carbs: 45, fat: 8 }
      ],
      lunch: [
        { name: 'Grilled Chicken Salad', calories: 420, protein: 35, carbs: 15, fat: 22 },
        { name: 'Quinoa Buddha Bowl', calories: 380, protein: 18, carbs: 45, fat: 14 },
        { name: 'Turkey Wrap', calories: 350, protein: 25, carbs: 30, fat: 15 },
        { name: 'Salmon with Vegetables', calories: 450, protein: 40, carbs: 20, fat: 25 }
      ],
      dinner: [
        { name: 'Lean Beef Stir Fry', calories: 480, protein: 35, carbs: 25, fat: 24 },
        { name: 'Baked Cod with Sweet Potato', calories: 400, protein: 30, carbs: 35, fat: 12 },
        { name: 'Chicken Curry', calories: 420, protein: 32, carbs: 28, fat: 18 },
        { name: 'Vegetarian Pasta', calories: 380, protein: 15, carbs: 55, fat: 12 }
      ],
      snack: [
        { name: 'Mixed Nuts', calories: 180, protein: 6, carbs: 8, fat: 16 },
        { name: 'Apple with Peanut Butter', calories: 200, protein: 8, carbs: 20, fat: 12 },
        { name: 'Protein Bar', calories: 220, protein: 20, carbs: 15, fat: 8 },
        { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 12, fat: 5 }
      ]
    };

    // Generate meals for the current month
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];

      mealTypes.forEach((mealType, index) => {
        const mealOptions = sampleMeals[mealType];
        const selectedMeal = mealOptions[day % mealOptions.length];
        
        meals.push({
          id: `${dateStr}-${mealType}`,
          plan_id: activePlan?.id || 'mock-plan',
          user_id: user?.id || '',
          scheduled_date: dateStr,
          meal_type: mealType,
          meal_data: {
            name: selectedMeal.name,
            calories: selectedMeal.calories,
            prep_time: '15-30 min',
            difficulty: 'Easy',
            ingredients: [
              'Fresh ingredients',
              'Seasonal produce',
              'Lean proteins',
              'Healthy fats'
            ],
            instructions: [
              'Prepare ingredients',
              'Follow cooking method',
              'Season to taste',
              'Serve and enjoy'
            ],
            nutrition_info: {
              protein: selectedMeal.protein,
              carbs: selectedMeal.carbs,
              fat: selectedMeal.fat,
              fiber: 5,
              sugar: 8
            }
          },
          created_at: new Date().toISOString(),
          is_completed: Math.random() > 0.7, // Random completion status
          rating: Math.floor(Math.random() * 5) + 1
        });
      });
    }

    return meals;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dietPlanMeals.filter(meal => meal.scheduled_date === dateStr);
  };

  const getMealTypeColor = (type: string) => {
    const colors = {
      breakfast: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      lunch: 'bg-green-100 text-green-800 border-green-200',
      dinner: 'bg-blue-100 text-blue-800 border-blue-200',
      snack: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMealTypeIcon = (type: string) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[type as keyof typeof icons] || '🍽️';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const filteredMeals = dietPlanMeals.filter(meal => {
    if (mealFilter === 'all') return true;
    return meal.meal_type === mealFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-6 w-6" />
                Diet Plan Calendar
              </CardTitle>
              <p className="text-blue-700 mt-1">
                Track your personalized meal plan and nutrition goals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white">
                <Target className="h-3 w-3 mr-1" />
                {activePlan ? 'Active Plan' : 'No Active Plan'}
              </Badge>
              {activePlan && (
                <Badge variant="outline" className="border-green-300 text-green-700">
                  <Activity className="h-3 w-3 mr-1" />
                  {activePlan.duration}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[200px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={mealFilter} onValueChange={setMealFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snacks</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayMeals = getMealsForDate(date);
                const isCurrentMonthDay = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                      isCurrentMonthDay 
                        ? 'bg-white hover:bg-gray-50' 
                        : 'bg-gray-50 text-gray-400'
                    } ${
                      isTodayDate 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isTodayDate ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayMeals.slice(0, 3).map((meal) => (
                        <div
                          key={meal.id}
                          onClick={() => {
                            setSelectedMeal(meal);
                            setShowMealDialog(true);
                          }}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getMealTypeColor(meal.meal_type)}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{getMealTypeIcon(meal.meal_type)}</span>
                            <span className="truncate">{meal.meal_data.name}</span>
                          </div>
                        </div>
                      ))}
                      {dayMeals.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayMeals.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredMeals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Meals Found</h3>
                <p className="text-gray-500">
                  {mealFilter === 'all' 
                    ? 'No meals scheduled for this month.' 
                    : `No ${mealFilter} meals found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMeals.map((meal) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getMealTypeColor(meal.meal_type)}`}>
                        <span className="text-lg">{getMealTypeIcon(meal.meal_type)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{meal.meal_data.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{new Date(meal.scheduled_date).toLocaleDateString()}</span>
                          <span className="capitalize">{meal.meal_type}</span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {meal.meal_data.calories} cal
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meal.meal_data.prep_time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meal.is_completed && (
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeal(meal);
                          setShowMealDialog(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* No Active Plan State */}
      {!activePlan && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">No Active Diet Plan</h3>
            <p className="text-blue-700 mb-4">
              You don't have an active diet plan yet. Generate one to start tracking your meals!
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Generate Diet Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Meal Details Dialog */}
      <Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedMeal && getMealTypeIcon(selectedMeal.meal_type)}</span>
              {selectedMeal?.meal_data.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeal && (
            <div className="space-y-6">
              {/* Meal Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{selectedMeal.meal_data.calories}</div>
                  <div className="text-xs text-gray-600">Calories</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{selectedMeal.meal_data.nutrition_info.protein}g</div>
                  <div className="text-xs text-gray-600">Protein</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Apple className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{selectedMeal.meal_data.nutrition_info.carbs}g</div>
                  <div className="text-xs text-gray-600">Carbs</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{selectedMeal.meal_data.nutrition_info.fat}g</div>
                  <div className="text-xs text-gray-600">Fat</div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold mb-2">Ingredients</h4>
                <ul className="space-y-1">
                  {selectedMeal.meal_data.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold mb-2">Instructions</h4>
                <ol className="space-y-2">
                  {selectedMeal.meal_data.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-600 flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1"
                  variant={selectedMeal.is_completed ? "outline" : "default"}
                >
                  {selectedMeal.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </Button>
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Rate
                </Button>
                <Button variant="outline">
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

export default AdultDietCalendar;