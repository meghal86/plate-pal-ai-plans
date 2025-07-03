import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap,
  Apple,
  Scale,
  Activity
} from "lucide-react";

const Tracking = () => {
  // Mock tracking data
  const todaysLog = [
    {
      meal: "Breakfast",
      items: [
        { name: "Oatmeal with Blueberries", calories: 280, protein: 8, carbs: 52, fat: 4 },
        { name: "Greek Yogurt", calories: 120, protein: 15, carbs: 8, fat: 0 }
      ]
    },
    {
      meal: "Lunch",
      items: [
        { name: "Grilled Chicken Salad", calories: 350, protein: 35, carbs: 12, fat: 18 },
        { name: "Quinoa", calories: 220, protein: 8, carbs: 39, fat: 4 }
      ]
    },
    {
      meal: "Snack",
      items: [
        { name: "Almonds (1 oz)", calories: 160, protein: 6, carbs: 6, fat: 14 }
      ]
    }
  ];

  const weeklyStats = [
    { day: "Mon", weight: 152.5, calories: 1980 },
    { day: "Tue", weight: 152.3, calories: 2100 },
    { day: "Wed", weight: 152.1, calories: 1890 },
    { day: "Thu", weight: 151.8, calories: 2050 },
    { day: "Fri", weight: 151.6, calories: 1950 },
    { day: "Sat", weight: 151.9, calories: 2200 },
    { day: "Sun", weight: 151.4, calories: 1450 }
  ];

  const macroTargets = {
    calories: { current: 1130, target: 1800 },
    protein: { current: 72, target: 120 },
    carbs: { current: 117, target: 180 },
    fat: { current: 40, target: 60 }
  };

  const totalCalories = todaysLog.reduce((total, meal) => 
    total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0), 0
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nutrition Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your daily intake and progress towards your goals
          </p>
        </div>
        <Button variant="health">
          <Plus className="h-4 w-4 mr-2" />
          Log Food
        </Button>
      </div>

      {/* Today's Macros Overview */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Today's Macros Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mb-2">
                <Zap className="h-8 w-8 mx-auto text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{macroTargets.calories.current}</p>
              <p className="text-sm text-muted-foreground">of {macroTargets.calories.target} cal</p>
              <Progress 
                value={(macroTargets.calories.current / macroTargets.calories.target) * 100} 
                className="mt-2"
              />
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Apple className="h-8 w-8 mx-auto text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{macroTargets.protein.current}g</p>
              <p className="text-sm text-muted-foreground">of {macroTargets.protein.target}g protein</p>
              <Progress 
                value={(macroTargets.protein.current / macroTargets.protein.target) * 100} 
                className="mt-2"
              />
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Target className="h-8 w-8 mx-auto text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{macroTargets.carbs.current}g</p>
              <p className="text-sm text-muted-foreground">of {macroTargets.carbs.target}g carbs</p>
              <Progress 
                value={(macroTargets.carbs.current / macroTargets.carbs.target) * 100} 
                className="mt-2"
              />
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Activity className="h-8 w-8 mx-auto text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">{macroTargets.fat.current}g</p>
              <p className="text-sm text-muted-foreground">of {macroTargets.fat.target}g fat</p>
              <Progress 
                value={(macroTargets.fat.current / macroTargets.fat.target) * 100} 
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Food Log */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Today's Food Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {todaysLog.map((meal, mealIndex) => (
                <div key={mealIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-foreground">{meal.meal}</h3>
                    <Badge variant="secondary">
                      {meal.items.reduce((total, item) => total + item.calories, 0)} cal
                    </Badge>
                  </div>
                  
                  {meal.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-secondary/50 rounded-lg p-4 hover:bg-secondary transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <span className="text-sm font-semibold text-primary">{item.calories} cal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <span>Protein: {item.protein}g</span>
                        <span>Carbs: {item.carbs}g</span>
                        <span>Fat: {item.fat}g</span>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to {meal.meal}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-6">
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyStats.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{day.day}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{day.weight} lbs</div>
                      <div className="text-xs text-muted-foreground">{day.calories} cal</div>
                    </div>
                  </div>
                  <Progress value={(day.calories / 2200) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-health border-0 text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                Weight Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold">151.4 lbs</p>
                <p className="text-primary-foreground/80">Current Weight</p>
                <div className="bg-white/10 rounded-lg p-3 mt-4">
                  <p className="text-sm">Goal: 145 lbs</p>
                  <p className="text-sm">Remaining: 6.4 lbs</p>
                  <Progress value={70} className="mt-2 bg-white/20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tracking;