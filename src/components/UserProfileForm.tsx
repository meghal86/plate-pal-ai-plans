
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Target, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  age: string;
  weight: string;
  height: string;
  dietaryRestrictions: string;
  healthGoals: string;
  activityLevel: string;
}

const UserProfileForm = () => {
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
    weight: "",
    height: "",
    dietaryRestrictions: "",
    healthGoals: "",
    activityLevel: "moderate"
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: 'temp-user-id', // This will be replaced with actual user ID after auth
          full_name: `User Profile`,
          email: 'temp@example.com', // This will be replaced with actual email
          ...profile
        });

      if (error) throw error;

      toast({
        title: "Profile saved successfully",
        description: "Your profile information has been updated",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save profile. Please try again.",
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
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={profile.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="bg-background"
              />
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
            <Label htmlFor="activityLevel">Activity Level</Label>
            <select
              id="activityLevel"
              value={profile.activityLevel}
              onChange={(e) => handleChange('activityLevel', e.target.value)}
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
            <Label htmlFor="healthGoals">Health Goals</Label>
            <Textarea
              id="healthGoals"
              placeholder="e.g., Weight loss, muscle gain, better energy..."
              value={profile.healthGoals}
              onChange={(e) => handleChange('healthGoals', e.target.value)}
              className="bg-background min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Dietary Restrictions & Preferences</Label>
            <Textarea
              id="dietaryRestrictions"
              placeholder="e.g., Vegetarian, gluten-free, allergies, food preferences..."
              value={profile.dietaryRestrictions}
              onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
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
