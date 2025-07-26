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
  TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Good morning");

  // Function to get dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Good night";
  };

  // Function to clean up duplicate profiles
  const cleanupDuplicateProfiles = async (userId: string) => {
    try {
      console.log('Dashboard: Cleaning up duplicate profiles for user:', userId);
      
      // Get all profiles for the user
      const { data: allProfiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Dashboard: Error fetching profiles for cleanup:', error);
        return;
      }
      
      if (allProfiles && allProfiles.length > 1) {
        console.log(`Dashboard: Found ${allProfiles.length} profiles, keeping the most recent one`);
        
        // Keep the most recent profile (first in the array since we ordered by created_at desc)
        const keepProfile = allProfiles[0];
        const deleteProfiles = allProfiles.slice(1);
        
        // Delete the older profiles
        for (const profile of deleteProfiles) {
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', profile.id);
          
          if (deleteError) {
            console.error('Dashboard: Error deleting duplicate profile:', deleteError);
          } else {
            console.log('Dashboard: Deleted duplicate profile:', profile.id);
          }
        }
      }
    } catch (error) {
      console.error('Dashboard: Error in cleanup:', error);
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Dashboard: Auth error:', authError);
        return;
      }
      
      if (session?.user) {
        const user = session.user;
        console.log('Dashboard: User authenticated via session:', user.id);
        console.log('Dashboard: Fetching profile for user:', user.id);
        
        // First, let's check if there are any profiles for this user
        const { data: allProfiles, error: listError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('Dashboard: All profiles for user:', allProfiles);
        
        if (listError) {
          console.error('Dashboard: Profile list error:', listError);
        }
        
        // If there are multiple profiles, clean them up
        if (allProfiles && allProfiles.length > 1) {
          console.log(`Dashboard: Found ${allProfiles.length} profiles, cleaning up duplicates`);
          await cleanupDuplicateProfiles(user.id);
        }
        
        // Then try to get the specific profile - use maybeSingle to handle multiple rows
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) // Get the most recent profile
          .limit(1)
          .maybeSingle();
        
        if (profileError) {
          console.error('Dashboard: Profile fetch error:', profileError);
        }
        
        console.log('Dashboard: Profile data:', profile);
        
        if (profile?.full_name) {
          console.log('Dashboard: Setting username to:', profile.full_name);
          setUserName(profile.full_name);
        } else {
          // Fallback to user's email if no name is set
          const fallbackName = user.email?.split('@')[0] || "User";
          console.log('Dashboard: Using fallback name:', fallbackName);
          setUserName(fallbackName);
        }
      } else {
        console.log('Dashboard: No active session found');
      }
    } catch (error) {
      console.error('Dashboard: Error fetching user profile:', error);
    }
  };

  // Set up greeting and fetch user profile on component mount
  useEffect(() => {
    setGreeting(getGreeting());
    fetchUserProfile();
  }, []);

  // Refetch profile when user returns to the dashboard (window focus)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Dashboard: Window focused, refetching profile');
      fetchUserProfile();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Also refetch when component becomes visible (for mobile/tablet)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard: Page became visible, refetching profile');
        fetchUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Utensils className="h-6 w-6" />
                <span className="text-sm">Log Meal</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Upload Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">View Progress</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Gift className="h-6 w-6" />
                <span className="text-sm">Redeem Rewards</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
