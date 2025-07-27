import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Heart
} from "lucide-react";
import Layout from "@/components/Layout";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isHindi ? "प्रोफ़ाइल" : "Profile"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isHindi ? "अपनी व्यक्तिगत जानकारी प्रबंधित करें" : "Manage your personal information"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>{isHindi ? "लॉगआउट" : "Logout"}</span>
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Profile Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                {isHindi ? "व्यक्तिगत जानकारी" : "Personal Information"}
              </CardTitle>
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
                    className="flex items-center space-x-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {placeholders.name}
                </label>
                <Input
                  value={editingProfile?.full_name || ""}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder={placeholders.name}
                  disabled={!isEditing}
                  className="bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {placeholders.email}
                </label>
                <Input
                  value={editingProfile?.email || ""}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={placeholders.email}
                  disabled={!isEditing}
                  className="bg-white/50"
                />
              </div>
            </div>

            {/* Physical Information */}
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
                  className="bg-white/50"
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
                  className="bg-white/50"
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
                  className="bg-white/50"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "गतिविधि स्तर" : "Activity Level"}
              </label>
              <select
                value={editingProfile?.activity_level || "moderate"}
                onChange={(e) => handleInputChange('activity_level', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white/50 disabled:bg-gray-100"
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Health Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "स्वास्थ्य लक्ष्य" : "Health Goals"}
              </label>
              <Textarea
                value={editingProfile?.health_goals || ""}
                onChange={(e) => handleInputChange('health_goals', e.target.value)}
                placeholder={placeholders.goals}
                disabled={!isEditing}
                className="bg-white/50"
                rows={3}
              />
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isHindi ? "आहार प्रतिबंध" : "Dietary Restrictions"}
              </label>
              <Textarea
                value={editingProfile?.dietary_restrictions || ""}
                onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                placeholder={placeholders.restrictions}
                disabled={!isEditing}
                className="bg-white/50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-orange-400 to-red-400 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Diet Plans</p>
                  <p className="text-2xl font-bold">3 Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-400 to-blue-400 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Goals</p>
                  <p className="text-2xl font-bold">5 Set</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-pink-400 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Streak</p>
                  <p className="text-2xl font-bold">12 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;