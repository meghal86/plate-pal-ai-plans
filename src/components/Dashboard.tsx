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
  Upload,
  Utensils,
  Scale,
  Heart,
  Bell,
  Settings,
  User,
  LogOut,
  Activity,
  FileText,
  Gift,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingDown,
  ChefHat
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";


const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, loading } = useUser();
  const [greeting, setGreeting] = useState("Good morning");

  // Get user name from profile with better fallback logic
  const getUserName = () => {
    if (loading) return "User";
    
    // Debug logging
    console.log('🔍 Dashboard getUserName - profile:', profile);
    console.log('🔍 Dashboard getUserName - profile.full_name:', profile?.full_name);
    console.log('🔍 Dashboard getUserName - profile.email:', profile?.email);
    
    // Try profile first
    if (profile?.full_name && profile.full_name !== "User") {
      console.log('✅ Dashboard using profile.full_name:', profile.full_name);
      return profile.full_name;
    }
    
    // Fallback to extracting from email if available
    if (profile?.email) {
      const emailPrefix = profile.email.split('@')[0];
      const extractedName = emailPrefix
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      console.log('✅ Dashboard using extracted name from email:', extractedName);
      return extractedName;
    }
    
    console.log('⚠️ Dashboard falling back to "User"');
    return "User";
  };

  const userName = getUserName();

  // Debug logging
  console.log('🎯 Dashboard render - loading:', loading, 'profile:', profile, 'userName:', userName);
  console.log('🔍 Profile full_name specifically:', profile?.full_name);

  // Function to get dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Good night";
  };

  // Set up greeting on component mount
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Dashboard loading timeout - forcing stop');
        // Force stop loading after 5 seconds
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Mock data for the dashboard
  const todayStats = {
    calories: { consumed: 1450, target: 2300 },
    protein: { consumed: 85, target: 120 },
    water: { consumed: 6, target: 8 }
  };

  const recentMeals = [
    { name: "Oatmeal", calories: 350, time: "1 hour ago" },
    { name: "Grilled Chicken Salad", calories: 420, time: "4 hours ago" },
    { name: "Greek Yogurt", calories: 180, time: "6 hours ago" }
  ];

  const weeklyProgress = [
    { day: "Mon", calories: 2100 },
    { day: "Tue", calories: 1950 },
    { day: "Wed", calories: 2200 },
    { day: "Thu", calories: 1800 },
    { day: "Fri", calories: 1950 },
    { day: "Sat", calories: 2200 },
    { day: "Sun", calories: 1450 }
  ];

  const recentActivity = [
    { action: "Logged Breakfast: Oatmeal (350 kcal)", time: "1 hour ago", icon: Utensils },
    { action: "Completed 5000 steps towards daily goal", time: "2 hours ago", icon: Activity },
    { action: "Uploaded new diet plan \"Keto Challenge\"", time: "Yesterday", icon: FileText },
    { action: "Earned \"Hydration Hero\" badge!", time: "3 days ago", icon: CheckCircle },
    { action: "Updated weight: 70.5 kg", time: "4 days ago", icon: Scale },
    { action: "Logged 4 glasses of water", time: "5 hours ago", icon: Droplets }
  ];

  // Show loading state while profile is being loaded
  if (loading) {
    console.log('🔄 Dashboard showing loading state - loading:', loading, 'profile:', profile);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-r from-orange-400 to-red-400 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{greeting}, Loading...</h2>
                    <p className="text-white/90 text-lg">
                      Loading your nutrition dashboard...
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      disabled
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Plan
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Meal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="h-full bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Dashboard rendering main content - userName:', userName);
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-r from-orange-400 to-red-400 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{greeting}, {userName}!</h2>
                  <p className="text-white/90 text-lg">
                    You're on track with your nutrition goals today
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => navigate("/upload")}
                  >
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
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calories</span>
                    <span>{todayStats.calories.consumed}/{todayStats.calories.target}</span>
                  </div>
                  <Progress value={(todayStats.calories.consumed / todayStats.calories.target) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Protein</span>
                    <span>{todayStats.protein.consumed}g/{todayStats.protein.target}g</span>
                  </div>
                  <Progress value={(todayStats.protein.consumed / todayStats.protein.target) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Water</span>
                    <span>{todayStats.water.consumed}L/{todayStats.water.target}L</span>
                  </div>
                  <Progress value={(todayStats.water.consumed / todayStats.water.target) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today's Meals</p>
                <p className="text-2xl font-bold text-foreground">3/5</p>
                <p className="text-sm text-muted-foreground">meals logged</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Utensils className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <a href="#" className="text-sm text-green-600 hover:text-green-700 flex items-center">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weekly Weight Change</p>
                <p className="text-2xl font-bold text-foreground">-0.8 kg</p>
                <p className="text-sm text-muted-foreground">this week</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Calories Consumed</p>
                <p className="text-2xl font-bold text-foreground">1450</p>
                <p className="text-sm text-muted-foreground">kcal today</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <a href="#" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Water Intake</p>
                <p className="text-2xl font-bold text-foreground">6/8</p>
                <p className="text-sm text-muted-foreground">glasses</p>
              </div>
              <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <Droplets className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <div className="mt-4">
              <a href="#" className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Reward Unlock */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Next Reward Unlock</h3>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-green-600">75 points</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Target: 100 points</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Just 25 points to go for a 'Healthy Eater' badge!
              </p>
            </div>
            <div className="ml-6">
              <a href="#" className="text-sm text-green-600 hover:text-green-700 flex items-center">
                Learn More <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Weight Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {weeklyProgress.map((day, index) => (
              <div key={day.day} className="flex flex-col items-center space-y-2">
                <div
                  className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                  style={{ height: `${(day.calories / 2500) * 200}px` }}
                ></div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Weight trend: Stable with slight decrease</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
                <Utensils className="h-6 w-6" />
                <span className="text-xs sm:text-sm">Log Meal</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
                <FileText className="h-6 w-6" />
                <span className="text-xs sm:text-sm">Upload Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xs sm:text-sm">View Progress</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 touch-target tap-highlight">
                <Gift className="h-6 w-6" />
                <span className="text-xs sm:text-sm">Redeem Rewards</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default Dashboard;
