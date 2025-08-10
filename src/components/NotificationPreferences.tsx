import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  adultDietNotificationService, 
  AdultDietNotificationPreferences 
} from "@/services/adult-diet-notification-service";
import { 
  Bell, 
  BellOff, 
  Clock, 
  Calendar, 
  Settings, 
  TestTube,
  Moon,
  Sun,
  ChefHat,
  Utensils,
  Coffee,
  Sandwich,
  UtensilsCrossed,
  Apple,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX
} from "lucide-react";

interface NotificationPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesUpdated?: (preferences: AdultDietNotificationPreferences) => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  open,
  onOpenChange,
  onPreferencesUpdated
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AdultDietNotificationPreferences>(
    adultDietNotificationService.getDefaultPreferences()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadPreferences();
    }
  }, [open, user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Loading preferences for user:', user.id);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No active session');
        toast({
          title: "Authentication Required",
          description: "Please sign in to access notification preferences.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('📋 Load error:', error);
        
        if (error.code === 'PGRST116') {
          // No preferences found - this is normal for new users
          console.log('ℹ️ No preferences found, using defaults');
        } else {
          console.error('❌ Error loading preferences:', error);
          toast({
            title: "Load Warning",
            description: "Could not load saved preferences. Using defaults.",
            variant: "destructive"
          });
        }
        return;
      }

      if (data?.preferences) {
        console.log('✅ Loaded preferences:', data.preferences);
        setPreferences({ ...adultDietNotificationService.getDefaultPreferences(), ...data.preferences });
      } else {
        console.log('ℹ️ No preferences data, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      toast({
        title: "Load Error",
        description: "Failed to load notification preferences.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 Attempting to save preferences for user:', user.id);
      console.log('📋 Preferences to save:', preferences);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No active session');
        toast({
          title: "Authentication Required",
          description: "Please sign in to save notification preferences.",
          variant: "destructive"
        });
        return;
      }

      // Try to update first, then insert if not exists
      let data, error;
      
      // First try to update existing preferences
      const { data: updateData, error: updateError } = await supabase
        .from('user_notification_preferences')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      if (updateError && updateError.code === 'PGRST116') {
        // No existing record, try to insert
        console.log('📝 No existing preferences, inserting new record');
        const { data: insertData, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            preferences: preferences,
            updated_at: new Date().toISOString()
          })
          .select();
        
        data = insertData;
        error = insertError;
      } else {
        // Update worked or failed for other reason
        data = updateData;
        error = updateError;
      }

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Preferences saved successfully:', data);

      toast({
        title: "Preferences Saved! ✅",
        description: "Your notification preferences have been updated successfully.",
      });

      onPreferencesUpdated?.(preferences);
      
      // Close the dialog after successful save
      setTimeout(() => {
        onOpenChange(false);
      }, 1000); // Small delay to let user see the success message
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      
      // More detailed error handling
      let errorMessage = "Failed to save notification preferences. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check your account settings.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else if (error.code === '23505') {
          errorMessage = "Duplicate key error. Please refresh the page and try again.";
        }
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    setTesting(true);
    try {
      // First check authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Current session:', session ? 'Active' : 'None');
      console.log('🔍 User from context:', user);
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to test notifications.",
          variant: "destructive"
        });
        return;
      }

      await adultDietNotificationService.testNotification();
      toast({
        title: "Test Notification Sent! 🔔",
        description: "Check your browser notifications to see if it worked.",
      });
    } catch (error) {
      console.error('Test notification failed:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(adultDietNotificationService.getDefaultPreferences());
    toast({
      title: "Reset to Defaults",
      description: "Notification preferences have been reset to default values.",
    });
  };

  const updatePreference = <K extends keyof AdultDietNotificationPreferences>(
    key: K,
    value: AdultDietNotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notification preferences...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Enable/Disable */}
          <Card className={`border-2 ${preferences.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preferences.enabled ? (
                    <Bell className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <CardTitle className="text-lg">Enable Notifications</CardTitle>
                </div>
                <Switch
                  checked={preferences.enabled}
                  onCheckedChange={(checked) => updatePreference('enabled', checked)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Master switch for all diet plan notifications. When disabled, no notifications will be sent.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={testNotification}
                  disabled={!preferences.enabled || testing}
                  variant="outline"
                  size="sm"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-3 w-3 mr-2" />
                      Test Notification
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Smartphone className="h-3 w-3" />
                  <Monitor className="h-3 w-3" />
                  Works on mobile & desktop
                </div>
              </div>
            </CardContent>
          </Card>

          {preferences.enabled && (
            <>
              {/* Daily Plan Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Daily Plan Summary</CardTitle>
                    </div>
                    <Switch
                      checked={preferences.daily_plan_enabled}
                      onCheckedChange={(checked) => updatePreference('daily_plan_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Get a daily summary of your meal plan sent once per day.
                  </p>
                  
                  {preferences.daily_plan_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="daily-time">Daily Summary Time</Label>
                        <Input
                          id="daily-time"
                          type="time"
                          value={preferences.daily_plan_time}
                          onChange={(e) => updatePreference('daily_plan_time', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-recipes-daily"
                          checked={preferences.include_recipes_in_daily}
                          onCheckedChange={(checked) => updatePreference('include_recipes_in_daily', checked)}
                        />
                        <Label htmlFor="include-recipes-daily">Include recipe preview</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Meal Reminder Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">Meal Reminders</CardTitle>
                    </div>
                    <Switch
                      checked={preferences.meal_reminders_enabled}
                      onCheckedChange={(checked) => updatePreference('meal_reminders_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Get reminders 2 hours before each meal with preparation details.
                  </p>

                  {preferences.meal_reminders_enabled && (
                    <>
                      {/* Meal Times and Reminders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-yellow-600" />
                            <Label>Breakfast</Label>
                            <Switch
                              checked={preferences.breakfast_reminder}
                              onCheckedChange={(checked) => updatePreference('breakfast_reminder', checked)}
                            />
                          </div>
                          <Input
                            type="time"
                            value={preferences.breakfast_time}
                            onChange={(e) => updatePreference('breakfast_time', e.target.value)}
                            disabled={!preferences.breakfast_reminder}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Sandwich className="h-4 w-4 text-green-600" />
                            <Label>Lunch</Label>
                            <Switch
                              checked={preferences.lunch_reminder}
                              onCheckedChange={(checked) => updatePreference('lunch_reminder', checked)}
                            />
                          </div>
                          <Input
                            type="time"
                            value={preferences.lunch_time}
                            onChange={(e) => updatePreference('lunch_time', e.target.value)}
                            disabled={!preferences.lunch_reminder}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4 text-blue-600" />
                            <Label>Dinner</Label>
                            <Switch
                              checked={preferences.dinner_reminder}
                              onCheckedChange={(checked) => updatePreference('dinner_reminder', checked)}
                            />
                          </div>
                          <Input
                            type="time"
                            value={preferences.dinner_time}
                            onChange={(e) => updatePreference('dinner_time', e.target.value)}
                            disabled={!preferences.dinner_reminder}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Apple className="h-4 w-4 text-red-600" />
                            <Label>Snack</Label>
                            <Switch
                              checked={preferences.snack_reminder}
                              onCheckedChange={(checked) => updatePreference('snack_reminder', checked)}
                            />
                          </div>
                          <Input
                            type="time"
                            value={preferences.snack_time}
                            onChange={(e) => updatePreference('snack_time', e.target.value)}
                            disabled={!preferences.snack_reminder}
                          />
                        </div>
                      </div>

                      {/* Notification Content Options */}
                      <div>
                        <Label className="text-base font-semibold">Notification Content</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="include-recipes"
                              checked={preferences.include_recipes}
                              onCheckedChange={(checked) => updatePreference('include_recipes', checked)}
                            />
                            <Label htmlFor="include-recipes">Recipes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="include-calories"
                              checked={preferences.include_calories}
                              onCheckedChange={(checked) => updatePreference('include_calories', checked)}
                            />
                            <Label htmlFor="include-calories">Calories</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="include-prep-time"
                              checked={preferences.include_prep_time}
                              onCheckedChange={(checked) => updatePreference('include_prep_time', checked)}
                            />
                            <Label htmlFor="include-prep-time">Prep Time</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="include-ingredients"
                              checked={preferences.include_ingredients}
                              onCheckedChange={(checked) => updatePreference('include_ingredients', checked)}
                            />
                            <Label htmlFor="include-ingredients">Ingredients</Label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="weekend-notifications"
                        checked={preferences.weekend_notifications}
                        onCheckedChange={(checked) => updatePreference('weekend_notifications', checked)}
                      />
                      <Label htmlFor="weekend-notifications">Weekend notifications</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Quiet Hours
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      No notifications will be sent during these hours.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quiet-start">Start Time</Label>
                        <Input
                          id="quiet-start"
                          type="time"
                          value={preferences.quiet_hours_start}
                          onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiet-end">End Time</Label>
                        <Input
                          id="quiet-end"
                          type="time"
                          value={preferences.quiet_hours_end}
                          onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={savePreferences}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPreferences;