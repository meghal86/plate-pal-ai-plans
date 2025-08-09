import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import DietPlans from "@/components/DietPlans";
import Tracking from "@/components/Tracking";
import Community from "@/components/Community";
import HealthMetrics from "@/components/HealthMetrics";
import LabReports from "@/components/LabReports";
import Rewards from "@/components/Rewards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Lock, 
  Mail, 
  LogIn, 
  UserPlus, 
  ChefHat,
  Heart,
  TrendingUp,
  Users,
  FileText,
  Trophy,
  Activity
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Signin state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Debug logging
  console.log('🎯 Index render - loading:', loading, 'user:', user?.id);

  // Show loading while checking authentication
  if (loading) {
    console.log('🔄 Index showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show signin interface if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl flex items-center justify-center mr-4">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">NourishPlate</h1>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your personalized nutrition companion for healthy eating and wellness tracking
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Features Preview */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover Your Perfect Nutrition Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">AI Diet Plans</h3>
                          <p className="text-sm text-gray-600">Personalized nutrition recommendations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Heart className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Health Tracking</h3>
                          <p className="text-sm text-gray-600">Monitor your wellness journey</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Progress Analytics</h3>
                          <p className="text-sm text-gray-600">Track your nutrition goals</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Community</h3>
                          <p className="text-sm text-gray-600">Connect with health enthusiasts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Signin/Signup Form */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {showSignUp ? "Create Account" : "Welcome Back"}
                  </CardTitle>
                  <p className="text-gray-600">
                    {showSignUp ? "Join NourishPlate to start your nutrition journey" : "Sign in to access your dashboard"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  
                  <Button
                    onClick={async () => {
                      if (!email || !password) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all fields",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setIsSigningIn(true);
                      try {
                        if (showSignUp) {
                          const { error } = await supabase.auth.signUp({
                            email,
                            password,
                            options: {
                              data: {
                                full_name: fullName
                              }
                            }
                          });
                          
                          if (error) throw error;
                          
                          toast({
                            title: "Account Created!",
                            description: "Please check your email to verify your account",
                          });
                        } else {
                          const { error } = await supabase.auth.signInWithPassword({
                            email,
                            password
                          });
                          
                          if (error) throw error;
                          
                          toast({
                            title: "Welcome Back!",
                            description: "Successfully signed in",
                          });
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Something went wrong",
                          variant: "destructive"
                        });
                      } finally {
                        setIsSigningIn(false);
                      }
                    }}
                    disabled={isSigningIn}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3"
                  >
                    {isSigningIn ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {showSignUp ? "Creating Account..." : "Signing In..."}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {showSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                        {showSignUp ? "Create Account" : "Sign In"}
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setShowSignUp(!showSignUp)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      {showSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "plans":
        return <DietPlans />;
      case "tracking":
        return <Tracking />;
      case "health-metrics":
        return <HealthMetrics />;
      case "lab-reports":
        return <LabReports />;
      case "rewards":
        return <Rewards />;
      case "community":
        return <Community />;
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Settings panel coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
};

export default Index;