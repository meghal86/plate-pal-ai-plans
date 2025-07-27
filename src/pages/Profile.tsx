import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  LogOut, 
  Edit3, 
  Save, 
  X, 
  Utensils, 
  Target,
  Activity,
  Heart,
  Calendar,
  Settings,
  Shield,
  Bell,
  Camera,
  MapPin,
  Phone,
  Globe,
  Award,
  TrendingUp,
  Users,
  Baby,
  CheckCircle
} from "lucide-react";
import Layout from "@/components/Layout";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import FamilyInvite from "@/components/FamilyInvite";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useUser();

  // Get user's language preference
  const isHindi = navigator.language?.startsWith('hi') || false;

  const placeholders = {
    name: isHindi ? "पूरा नाम" : "Full Name",
    email: isHindi ? "ईमेल" : "Email",
    age: isHindi ? "उम्र" : "Age",
    weight: isHindi ? "वजन" : "Weight",
    height: isHindi ? "ऊंचाई (सेमी)" : "Height (cm)",
    goals: isHindi ? "स्वास्थ्य लक्ष्य (जैसे वजन कम करना, मांसपेशियां बनाना...)" : "Health Goals (e.g., Weight loss, muscle gain...)",
    restrictions: isHindi ? "आहार प्रतिबंध और प्राथमिकताएं (जैसे शाकाहारी, एलर्जी...)" : "Dietary Restrictions & Preferences (e.g., Vegetarian, allergies...)"
  };

  const activityLevels = [
    { value: "sedentary", label: isHindi ? "निष्क्रिय (कम या कोई व्यायाम नहीं)" : "Sedentary (little/no exercise)" },
    { value: "light", label: isHindi ? "हल्का (सप्ताह में 1-3 दिन)" : "Light (1-3 days/week)" },
    { value: "moderate", label: isHindi ? "मध्यम (सप्ताह में 3-5 दिन)" : "Moderate (3-5 days/week)" },
    { value: "active", label: isHindi ? "सक्रिय (सप्ताह में 6-7 दिन)" : "Active (6-7 days/week)" },
    { value: "very-active", label: isHindi ? "बहुत सक्रिय (दिन में 2 बार, तीव्र)" : "Very Active (2x/day, intense)" }
  ];

  // Initialize editing profile when profile loads
  if (profile && !editingProfile) {
    setEditingProfile(profile);
  }

  const handleSave = async () => {
    if (!editingProfile) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(editingProfile);
      setSuccess(isHindi ? "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया" : "Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError(isHindi ? "प्रोफ़ाइल अपडेट करने में त्रुटि" : "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      setError(isHindi ? "लॉगआउट में त्रुटि" : "Error during logout");
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    if (!editingProfile) return;
    setEditingProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleEdit = () => {
    setEditingProfile(profile);
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditingProfile(profile);
    setIsEditing(false);
    setError("");
    setSuccess("");
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
            <div className="flex items-center space-x-3">
              {/* Remove Logout button here */}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center space-x-3">
            <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
              <X className="h-3 w-3 text-white" />
            </div>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center space-x-3">
            <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {isHindi ? "व्यक्तिगत जानकारी" : "Personal Information"}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {isHindi ? "अपनी बुनियादी जानकारी अपडेट करें" : "Update your basic information"}
                      </p>
                    </div>
                  </div>
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" className="flex items-center space-x-2">
                      <Edit3 className="h-4 w-4" />
                      <span>{isHindi ? "संपादित करें" : "Edit"}</span>
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleCancel} variant="outline" className="flex items-center space-x-2">
                        <X className="h-4 w-4" />
                        <span>{isHindi ? "रद्द करें" : "Cancel"}</span>
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? (isHindi ? "सहेज रहे हैं..." : "Saving...") : (isHindi ? "सहेजें" : "Save")}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{placeholders.name}</span>
                    </label>
                    <Input
                      value={editingProfile?.full_name || ""}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder={placeholders.name}
                      disabled={!isEditing}
                      className="bg-white/50 border-gray-200 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{placeholders.email}</span>
                    </label>
                    <Input
                      value={editingProfile?.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={placeholders.email}
                      disabled={!isEditing}
                      className="bg-white/50 border-gray-200 focus:border-orange-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Physical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <span>{isHindi ? "शारीरिक माप" : "Physical Measurements"}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {placeholders.age}
                      </label>
                      <Input
                        type="number"
                        value={editingProfile?.age || ""}
                        onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder={placeholders.age}
                        disabled={!isEditing}
                        className="bg-white/50 border-gray-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {placeholders.weight} ({editingProfile?.weight_unit || 'kg'})
                      </label>
                      <Input
                        type="number"
                        value={editingProfile?.weight || ""}
                        onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder={placeholders.weight}
                        disabled={!isEditing}
                        className="bg-white/50 border-gray-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {placeholders.height}
                      </label>
                      <Input
                        type="number"
                        value={editingProfile?.height || ""}
                        onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder={placeholders.height}
                        disabled={!isEditing}
                        className="bg-white/50 border-gray-200 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span>{isHindi ? "गतिविधि स्तर" : "Activity Level"}</span>
                  </label>
                  <select
                    value={editingProfile?.activity_level || "moderate"}
                    onChange={(e) => handleInputChange('activity_level', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white/50 disabled:bg-gray-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Separator />

                {/* Health Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span>{isHindi ? "स्वास्थ्य लक्ष्य" : "Health Goals"}</span>
                  </label>
                  <Textarea
                    value={editingProfile?.health_goals || ""}
                    onChange={(e) => handleInputChange('health_goals', e.target.value)}
                    placeholder={placeholders.goals}
                    disabled={!isEditing}
                    className="bg-white/50 border-gray-200 focus:border-orange-500"
                    rows={3}
                  />
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Utensils className="h-4 w-4 text-gray-500" />
                    <span>{isHindi ? "आहार प्रतिबंध" : "Dietary Restrictions"}</span>
                  </label>
                  <Textarea
                    value={editingProfile?.dietary_restrictions || ""}
                    onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                    placeholder={placeholders.restrictions}
                    disabled={!isEditing}
                    className="bg-white/50 border-gray-200 focus:border-orange-500"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

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