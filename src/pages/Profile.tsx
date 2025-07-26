import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string;
  health_goals: string;
  dietary_restrictions: string;
  weight_unit: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/signin");
        return;
      }

      console.log('Fetching profile for user:', user.id);
      
      // Fetch user profile from database
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile fetch result:', { profileData, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', error);
        setError(isHindi ? "प्रोफ़ाइल लोड करने में त्रुटि" : "Error loading profile");
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        // Create default profile if none exists
        const defaultProfile: UserProfile = {
          id: "", // Let database generate the UUID
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
          age: null,
          weight: null,
          height: null,
          activity_level: "moderate",
          health_goals: "",
          dietary_restrictions: "",
          weight_unit: "kg",
          created_at: new Date().toISOString()
        };
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(isHindi ? "प्रोफ़ाइल लोड करने में त्रुटि" : "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/signin");
        return;
      }

      // Update or insert profile
      const upsertData: any = {
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        activity_level: profile.activity_level,
        health_goals: profile.health_goals,
        dietary_restrictions: profile.dietary_restrictions,
        weight_unit: profile.weight_unit
      };

      // Only include id if it exists (for existing profiles)
      if (profile.id) {
        upsertData.id = profile.id;
      }

      console.log('Upserting profile data:', upsertData);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(upsertData)
        .select()
        .single();

      console.log('Upsert result:', { data, error });

      if (error) {
        console.error('Profile update error:', error);
        setError(error.message);
      } else {
        // Update the profile state with the returned data (including the generated id)
        if (data) {
          setProfile(data);
        }
        setSuccess(isHindi ? "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया" : "Profile updated successfully");
        setIsEditing(false);
      }
    } catch (err) {
      setError(isHindi ? "प्रोफ़ाइल अपडेट करने में त्रुटि" : "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/signin");
    } catch (err) {
      setError(isHindi ? "लॉगआउट में त्रुटि" : "Error during logout");
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number | null) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isHindi ? "लोड हो रहा है..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {isHindi ? "प्रोफ़ाइल नहीं मिला" : "Profile not found"}
          </p>
          <Button onClick={() => navigate("/signin")}>
            {isHindi ? "लॉगिन करें" : "Go to Login"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto px-4 py-8">

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  {isHindi ? "व्यक्तिगत जानकारी" : "Personal Information"}
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    {isHindi ? "संपादित करें" : "Edit"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {saving ? (isHindi ? "सहेज रहा है..." : "Saving...") : (isHindi ? "सहेजें" : "Save")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2"
                    >
                      <X size={16} />
                      {isHindi ? "रद्द करें" : "Cancel"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "पूरा नाम" : "Full Name"}
                    </label>
                    {isEditing ? (
                      <Input
                        value={profile.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder={placeholders.name}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.full_name || (isHindi ? "नहीं सेट किया गया" : "Not set")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "ईमेल" : "Email"}
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "उम्र" : "Age"}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={profile.age || ""}
                        onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder={placeholders.age}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.age || (isHindi ? "नहीं सेट किया गया" : "Not set")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "वजन" : "Weight"}
                    </label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={profile.weight || ""}
                          onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder={placeholders.weight}
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                        <select
                          value={profile.weight_unit}
                          onChange={(e) => handleInputChange('weight_unit', e.target.value)}
                          className="border border-gray-300 rounded-md px-3 bg-white focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {profile.weight ? `${profile.weight} ${profile.weight_unit}` : (isHindi ? "नहीं सेट किया गया" : "Not set")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "ऊंचाई" : "Height"}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={profile.height || ""}
                        onChange={(e) => handleInputChange('height', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder={placeholders.height}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.height ? `${profile.height} cm` : (isHindi ? "नहीं सेट किया गया" : "Not set")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHindi ? "गतिविधि स्तर" : "Activity Level"}
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.activity_level}
                        onChange={(e) => handleInputChange('activity_level', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:border-orange-500 focus:ring-orange-500"
                      >
                        {activityLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Activity size={16} className="text-gray-400" />
                        {activityLevels.find(level => level.value === profile.activity_level)?.label}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isHindi ? "स्वास्थ्य लक्ष्य" : "Health Goals"}
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={profile.health_goals}
                      onChange={(e) => handleInputChange('health_goals', e.target.value)}
                      placeholder={placeholders.goals}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-start gap-2">
                      <Target size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                      {profile.health_goals || (isHindi ? "कोई लक्ष्य निर्धारित नहीं किया गया" : "No goals set")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isHindi ? "आहार प्रतिबंध" : "Dietary Restrictions"}
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={profile.dietary_restrictions}
                      onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                      placeholder={placeholders.restrictions}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-start gap-2">
                      <Utensils size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                      {profile.dietary_restrictions || (isHindi ? "कोई प्रतिबंध नहीं" : "No restrictions")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diet Plan Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  {isHindi ? "आहार योजना सारांश" : "Diet Plan Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-2">0</div>
                  <div className="text-sm text-gray-600">
                    {isHindi ? "सक्रिय योजनाएं" : "Active Plans"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      {isHindi ? "कुल योजनाएं" : "Total Plans"}
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      {isHindi ? "पूर्ण योजनाएं" : "Completed Plans"}
                    </span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      {isHindi ? "सफलता दर" : "Success Rate"}
                    </span>
                    <span className="font-semibold text-green-600">0%</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => navigate("/upload")}
                >
                  {isHindi ? "नई योजना बनाएं" : "Create New Plan"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;