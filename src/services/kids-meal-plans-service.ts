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
    try {
      // First, test if the table exists with a simple count query
      const { count, error: countError } = await supabase
        .from('kids_meal_plans')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Table access error:', countError);
        // If table doesn't exist or has permission issues, return empty array
        if (countError.code === '42P01' || countError.code === 'PGRST116') {
          console.warn('kids_meal_plans table not accessible, returning empty array');
          return [];
        }
        throw new Error(`Table access error: ${countError.message}`);
      }

      // If table is accessible, proceed with the actual query
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
    } catch (error) {
      console.error('Error in getMealPlansForKid:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Get the active meal plan for a kid
  static async getActiveMealPlan(kidId: string): Promise<KidsMealPlan | null> {
    try {
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
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn('kids_meal_plans table not accessible');
          return null;
        }
        console.error('Error fetching active meal plan:', error);
        throw new Error(`Failed to fetch active meal plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getActiveMealPlan:', error);
      return null;
    }
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
    console.log('Service: Getting meal plan by ID:', planId);
    
    const { data, error } = await supabase
      .from('kids_meal_plans')
      .select('*')
      .eq('id', planId)
      .single();

    console.log('Service: Query result:', { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Service: No meal plan found with ID:', planId);
        return null;
      }
      console.error('Error fetching meal plan:', error);
      throw new Error(`Failed to fetch meal plan: ${error.message}`);
    }

    console.log('Service: Returning meal plan data:', data);
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

  // Get active meal plan formatted for calendar display
  static async getActiveMealPlanForCalendar(kidId: string): Promise<any[]> {
    try {
      const activePlan = await this.getActiveMealPlan(kidId);
      if (!activePlan) return [];

      const planData = this.parsePlanData(activePlan.plan_data);
      const calendarEvents: any[] = [];

      // Convert daily plans to calendar events
      planData.daily_plans.forEach((day, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];

        // Add breakfast
        calendarEvents.push({
          id: `${activePlan.id}-${index}-breakfast`,
          recipe_id: `breakfast-${index}`,
          user_id: activePlan.created_by,
          kid_id: kidId,
          scheduled_date: dateStr,
          meal_type: 'breakfast',
          recipe_name: day.breakfast.name,
          recipe_description: day.breakfast.description,
          prep_time: day.breakfast.prep_time,
          calories: day.breakfast.calories,
          emoji: day.breakfast.emoji,
          ingredients: day.breakfast.ingredients,
          instructions: day.breakfast.instructions,
          nutrition: day.breakfast.nutrition,
          source: 'ai_generated',
          plan_id: activePlan.id,
          plan_title: activePlan.title
        });

        // Add lunch
        calendarEvents.push({
          id: `${activePlan.id}-${index}-lunch`,
          recipe_id: `lunch-${index}`,
          user_id: activePlan.created_by,
          kid_id: kidId,
          scheduled_date: dateStr,
          meal_type: 'lunch',
          recipe_name: day.lunch.name,
          recipe_description: day.lunch.description,
          prep_time: day.lunch.prep_time,
          calories: day.lunch.calories,
          emoji: day.lunch.emoji,
          ingredients: day.lunch.ingredients,
          instructions: day.lunch.instructions,
          nutrition: day.lunch.nutrition,
          source: 'ai_generated',
          plan_id: activePlan.id,
          plan_title: activePlan.title
        });

        // Add snack
        calendarEvents.push({
          id: `${activePlan.id}-${index}-snack`,
          recipe_id: `snack-${index}`,
          user_id: activePlan.created_by,
          kid_id: kidId,
          scheduled_date: dateStr,
          meal_type: 'snack',
          recipe_name: day.snack.name,
          recipe_description: day.snack.description,
          prep_time: day.snack.prep_time,
          calories: day.snack.calories,
          emoji: day.snack.emoji,
          ingredients: day.snack.ingredients,
          instructions: day.snack.instructions,
          nutrition: day.snack.nutrition,
          source: 'ai_generated',
          plan_id: activePlan.id,
          plan_title: activePlan.title
        });
      });

      return calendarEvents;
    } catch (error) {
      console.error('Error getting active meal plan for calendar:', error);
      return [];
    }
  }
}