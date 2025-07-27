
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { 
  User, 
  Phone, 
  Mail, 
  Bell, 
  Settings, 
  Save, 
  Loader2,
  Shield,
  Smartphone,
  Monitor,
  Heart,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

const UserProfileForm: React.FC = () => {
  const { profile, updateProfile, loading } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    age: '',
    weight: '',
    height: '',
    activity_level: 'moderate',
    health_goals: 'General health',
    dietary_restrictions: 'None',
    weight_unit: 'kg',
    notification_preferences: {
      email: true,
      sms: false,
      push: true,
      meal_reminders: true,
      health_tips: true,
      family_updates: true
    }
  });

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        age: profile.age?.toString() || '',
        weight: profile.weight?.toString() || '',
        height: profile.height?.toString() || '',
        activity_level: profile.activity_level || 'moderate',
        health_goals: profile.health_goals || 'General health',
        dietary_restrictions: profile.dietary_restrictions || 'None',
        weight_unit: profile.weight_unit || 'kg',
        notification_preferences: profile.notification_preferences || {
          email: true,
          sms: false,
          push: true,
          meal_reminders: true,
          health_tips: true,
          family_updates: true
        }
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If phone number is being updated, manage SMS notification preference
      if (field === 'phone_number') {
        if (value && validatePhoneNumber(value)) {
          // If a valid phone number is added, enable SMS notifications
          newData.notification_preferences = {
            ...prev.notification_preferences,
            sms: true
          };
        } else if (!value) {
          // If phone number is removed, disable SMS notifications
          newData.notification_preferences = {
            ...prev.notification_preferences,
            sms: false
          };
        }
      }
      
      return newData;
    });
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic international phone number validation
    // Allows formats like: +1 555 123 4567, +91 98765 43210, +44 20 7946 0958
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate phone number if provided
      if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number with country code (e.g., +1 555 123 4567)",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const updates = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        activity_level: formData.activity_level,
        health_goals: formData.health_goals,
        dietary_restrictions: formData.dietary_restrictions,
        weight_unit: formData.weight_unit,
        notification_preferences: formData.notification_preferences
      };

      await updateProfile(updates);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number (with Country Code)</Label>
                <div className="relative">
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    pattern="[\+]?[1-9][\d]{0,15}"
                    title="Please enter a valid phone number with country code (e.g., +1 555 123 4567)"
                    className={formData.phone_number && validatePhoneNumber(formData.phone_number) ? 'border-green-500' : ''}
                  />
                  {formData.phone_number && validatePhoneNumber(formData.phone_number) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Include country code (e.g., +1 for US, +91 for India, +44 for UK)</p>
                  <p className="text-gray-400">
                    Common codes: US (+1), India (+91), UK (+44), Canada (+1), Australia (+61)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <Separator />

            {/* Health Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="Weight"
                      step="0.1"
                    />
                    <Select value={formData.weight_unit} onValueChange={(value) => handleInputChange('weight_unit', value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="Height in cm"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity_level">Activity Level</Label>
                  <Select value={formData.activity_level} onValueChange={(value) => handleInputChange('activity_level', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Preferences */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notification Methods */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Notification Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span>Email Notifications</span>
                        </div>
                        <Switch
                          checked={formData.notification_preferences.email}
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-500" />
                          <span>SMS Notifications</span>
                          {!formData.phone_number && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Phone Required
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={formData.notification_preferences.sms}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                          disabled={!formData.phone_number}
                        />
                      </div>
                      {!formData.phone_number && formData.notification_preferences.sms && (
                        <p className="text-xs text-orange-600 mt-1">
                          Add a phone number to enable SMS notifications
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-purple-500" />
                          <span>Push Notifications</span>
                        </div>
                        <Switch
                          checked={formData.notification_preferences.push}
                          onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Notification Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>Meal Reminders</span>
                        </div>
                        <Switch
                          checked={formData.notification_preferences.meal_reminders}
                          onCheckedChange={(checked) => handleNotificationChange('meal_reminders', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>Health Tips</span>
                        </div>
                        <Switch
                          checked={formData.notification_preferences.health_tips}
                          onCheckedChange={(checked) => handleNotificationChange('health_tips', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>Family Updates</span>
                        </div>
                        <Switch
                          checked={formData.notification_preferences.family_updates}
                          onCheckedChange={(checked) => handleNotificationChange('family_updates', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileForm;
