import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Camera,
  Utensils, 
  Target,
  Activity,
  Heart,
  Calendar,
  Settings,
  Shield,
  Bell,
  Award,
  Users,
  Baby,
  CheckCircle
} from "lucide-react";
import Layout from "@/components/Layout";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import FamilyInvite from "@/components/FamilyInvite";
import UserProfileForm from "@/components/UserProfileForm";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, loading } = useUser();

  // Get user's language preference
  const isHindi = navigator.language?.startsWith('hi') || false;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error if no profile
  if (!profile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Profile not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-24 w-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-white shadow-md">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.full_name || "User Profile"}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email}</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {profile?.activity_level ? profile.activity_level.replace('-', ' ').toUpperCase() : 'MODERATE'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Information & Family */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Form */}
            <UserProfileForm />

            {/* Family & Kids Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {isHindi ? "परिवार और बच्चे" : "Family & Kids"}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {isHindi ? "अपने परिवार के सदस्यों को आमंत्रित करें और बच्चों के प्रोफाइल प्रबंधित करें" : "Invite family members and manage kids profiles"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FamilyInvite />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  <span>{isHindi ? "आपकी प्रगति" : "Your Progress"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Active Plans</p>
                      <p className="text-xl font-bold">3</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Goals Set</p>
                      <p className="text-xl font-bold">5</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Day Streak</p>
                      <p className="text-xl font-bold">12</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span>{isHindi ? "त्वरित कार्य" : "Quick Actions"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/kids')}>
                  <Baby className="h-4 w-4 mr-2" />
                  Kids Zone
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Settings
                </Button>
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span>{isHindi ? "स्वास्थ्य सारांश" : "Health Summary"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">BMI</span>
                  <Badge variant="secondary">22.5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Daily Calories</span>
                  <Badge variant="secondary">2,100</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Water Goal</span>
                  <Badge variant="secondary">8 glasses</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;