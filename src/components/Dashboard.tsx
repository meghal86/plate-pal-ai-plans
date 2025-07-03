import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Apple, 
  Droplets, 
  Zap,
  Plus,
  Upload
} from "lucide-react";
import heroImage from "@/assets/hero-nutrition.jpg";

const Dashboard = () => {
  // Mock data for the dashboard
  const todayStats = {
    calories: { consumed: 1450, target: 2000 },
    protein: { consumed: 85, target: 120 },
    carbs: { consumed: 180, target: 250 },
    fat: { consumed: 55, target: 75 },
    water: { consumed: 6, target: 8 }
  };

  const recentMeals = [
    { name: "Greek Yogurt with Berries", calories: 180, time: "8:30 AM" },
    { name: "Quinoa Salad Bowl", calories: 420, time: "12:45 PM" },
    { name: "Grilled Salmon", calories: 380, time: "7:15 PM" }
  ];

  const weeklyProgress = [
    { day: "Mon", calories: 1980 },
    { day: "Tue", calories: 2100 },
    { day: "Wed", calories: 1890 },
    { day: "Thu", calories: 2050 },
    { day: "Fri", calories: 1950 },
    { day: "Sat", calories: 2200 },
    { day: "Sun", calories: 1450 }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-health border-0 text-primary-foreground">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <CardContent className="relative p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold mb-2">Good morning, Sarah!</h2>
              <p className="text-primary-foreground/80 text-lg">
                You're on track with your nutrition goals today
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Upload className="h-4 w-4 mr-2" />
                Upload Plan
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Plus className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Calories Today</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayStats.calories.consumed}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {todayStats.calories.target}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress 
              value={(todayStats.calories.consumed / todayStats.calories.target) * 100} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Protein</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayStats.protein.consumed}g
                </p>
                <p className="text-sm text-muted-foreground">
                  of {todayStats.protein.target}g
                </p>
              </div>
              <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center">
                <Apple className="h-6 w-6 text-success" />
              </div>
            </div>
            <Progress 
              value={(todayStats.protein.consumed / todayStats.protein.target) * 100} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Carbs</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayStats.carbs.consumed}g
                </p>
                <p className="text-sm text-muted-foreground">
                  of {todayStats.carbs.target}g
                </p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-accent" />
              </div>
            </div>
            <Progress 
              value={(todayStats.carbs.consumed / todayStats.carbs.target) * 100} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Water</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayStats.water.consumed}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {todayStats.water.target} glasses
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress 
              value={(todayStats.water.consumed / todayStats.water.target) * 100} 
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Meals & Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Recent Meals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMeals.map((meal, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div>
                  <p className="font-medium text-foreground">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">{meal.time}</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {meal.calories} cal
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add New Meal
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground min-w-[3rem]">
                    {day.day}
                  </span>
                  <div className="flex-1 mx-4">
                    <Progress 
                      value={(day.calories / 2200) * 100} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-[4rem] text-right">
                    {day.calories} cal
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;