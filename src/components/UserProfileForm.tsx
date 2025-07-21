
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  age: string;
  weight: string;
  weight_unit: 'kg' | 'lbs';
  height: string;
  dietary_restrictions: string;
  health_goals: string;
  activity_level: string;
  full_name: string;
  email: string;
}

const getDefaultWeightUnit = () => {
  const locale = navigator.language || navigator.languages[0] || '';
  if (locale.startsWith('en-US')) return 'lbs';
  if (locale.startsWith('en-IN') || locale.startsWith('hi-IN')) return 'kg';
  // Add more country checks as needed
  // Default: kg
  return 'kg';
};

const UserProfileForm = () => {
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
    weight: "",
    weight_unit: getDefaultWeightUnit(),
    height: "",
    dietary_restrictions: "",
    health_goals: "",
    activity_level: "moderate",
    full_name: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Debug log for weight_unit
      console.log("weight_unit being sent:", profile.weight_unit);
      // Create a temporary user ID for demonstration (replace with actual auth later)
      const tempUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          full_name: profile.full_name,
          email: profile.email,
          age: profile.age ? parseInt(profile.age) : null,
          weight: profile.weight ? parseFloat(profile.weight) : null,
          height: profile.height ? parseFloat(profile.height) : null,
          activity_level: profile.activity_level,
          health_goals: profile.health_goals,
          dietary_restrictions: profile.dietary_restrictions,
          weight_unit: profile.weight_unit // Use actual value from form
        });

      if (error) {
        console.error('Profile save error:', error);
        throw error;
      }

      toast({
        title: "Profile saved successfully",
        description: "Your profile information has been saved to the database",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2 text-primary" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={profile.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight ({profile.weight_unit})</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  placeholder={profile.weight_unit === 'kg' ? '70' : '154'}
                  value={profile.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="bg-background"
                />
                <select
                  id="weight_unit"
                  value={profile.weight_unit}
                  onChange={e => handleChange('weight_unit', e.target.value)}
                  className="border rounded-md px-2 bg-background"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={profile.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_level">Activity Level</Label>
            <select
              id="activity_level"
              value={profile.activity_level}
              onChange={(e) => handleChange('activity_level', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Light (1-3 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very-active">Very Active (2x/day, intense)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="health_goals">Health Goals</Label>
            <Textarea
              id="health_goals"
              placeholder="e.g., Weight loss, muscle gain, better energy..."
              value={profile.health_goals}
              onChange={(e) => handleChange('health_goals', e.target.value)}
              className="bg-background min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietary_restrictions">Dietary Restrictions & Preferences</Label>
            <Textarea
              id="dietary_restrictions"
              placeholder="e.g., Vegetarian, gluten-free, allergies, food preferences..."
              value={profile.dietary_restrictions}
              onChange={(e) => handleChange('dietary_restrictions', e.target.value)}
              className="bg-background min-h-[80px]"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserProfileForm;
