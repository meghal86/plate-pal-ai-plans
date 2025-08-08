import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { KidsSchoolPlan, KidsPlanPreferences } from '@/api/generate-kids-meal-plan';

type KidsMealPlan = Database['public']['Tables']['kids_meal_plans']['Row'];
type KidsMealPlanInsert = Database['public']['Tables']['kids_meal_plans']['Insert'];
type KidsMealPlanUpdate = Database['public']['Tables']['kids_meal_plans']['Update'];

export class KidsMealPlansService {
  // Save a new meal plan
  static async saveMealPlan(
    kidId: string,
    plan: KidsSchoolPlan,
    preferences: KidsPlanPreferences,
    userId: string
  ): Promise<KidsMealPlan> {
    const planData: KidsMealPlanInsert = {
      kid_id: kidId,
      title: plan.title,
      description: plan.description,
      duration: plan.daily_plans.length,
      plan_data: plan as any,
      preferences: preferences as any,
      is_active: false, // New plans start as inactive
      created_by: userId
    };

    const { data, error } = await supabase
      .from('kids_meal_plans')
      .insert(planData)
      .select()
      .single();

    if (error) {
      console.error('Error saving meal plan:', error);
      throw new Error(`Failed to save meal plan: ${error.message}`);
    }

    return data;
  }

  // Get all meal plans for a kid
  static async getMealPlansForKid(kidId: string): Promise<KidsMealPlan[]> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal plans:', error);
      throw new Error(`Failed to fetch meal plans: ${error.message}`);
    }

    return data || [];
  }

  // Get the active meal plan for a kid
  static async getActiveMealPlan(kidId: string): Promise<KidsMealPlan | null> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .select('*')
      .eq('kid_id', kidId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active plan found
        return null;
      }
      console.error('Error fetching active meal plan:', error);
      throw new Error(`Failed to fetch active meal plan: ${error.message}`);
    }

    return data;
  }

  // Activate a meal plan (deactivates all others for the kid)
  static async activateMealPlan(planId: string): Promise<KidsMealPlan> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .update({ is_active: true })
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error activating meal plan:', error);
      throw new Error(`Failed to activate meal plan: ${error.message}`);
    }

    return data;
  }

  // Deactivate a meal plan
  static async deactivateMealPlan(planId: string): Promise<KidsMealPlan> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .update({ is_active: false })
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating meal plan:', error);
      throw new Error(`Failed to deactivate meal plan: ${error.message}`);
    }

    return data;
  }

  // Delete a meal plan
  static async deleteMealPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('kids_meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw new Error(`Failed to delete meal plan: ${error.message}`);
    }
  }

  // Update meal plan data (for when meals are replaced)
  static async updateMealPlan(
    planId: string,
    updates: Partial<KidsMealPlanUpdate>
  ): Promise<KidsMealPlan> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meal plan:', error);
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }

    return data;
  }

  // Get meal plan by ID
  static async getMealPlanById(planId: string): Promise<KidsMealPlan | null> {
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching meal plan:', error);
      throw new Error(`Failed to fetch meal plan: ${error.message}`);
    }

    return data;
  }

  // Parse plan data from database format back to KidsSchoolPlan
  static parsePlanData(planData: any): KidsSchoolPlan {
    return planData as KidsSchoolPlan;
  }

  // Parse preferences from database format
  static parsePreferences(preferences: any): KidsPlanPreferences {
    return preferences as KidsPlanPreferences;
  }
}