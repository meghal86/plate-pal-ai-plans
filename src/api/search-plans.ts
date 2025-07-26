import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding } from './generate-embedding';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  duration: string;
  calories: string;
  similarity: number;
  created_at: string;
}

export async function searchPlansBySimilarity(
  searchQuery: string,
  userId: string,
  similarityThreshold: number = 0.7,
  limitCount: number = 10
): Promise<SearchResult[]> {
  try {
    console.log('Searching plans with query:', searchQuery);
    
    // For now, use text-based search as fallback
    // Vector search will be implemented once the database functions are properly set up
    return await fallbackTextSearch(searchQuery, userId, limitCount);
  } catch (error) {
    console.error('Error in semantic search:', error);
    return [];
  }
}

export async function findSimilarPlans(
  planId: string,
  userId: string,
  similarityThreshold: number = 0.8,
  limitCount: number = 5
): Promise<SearchResult[]> {
  try {
    console.log('Finding similar plans for plan ID:', planId);
    
    // Get the reference plan
    const { data: referencePlan, error: refError } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (refError || !referencePlan) {
      console.error('Error finding reference plan:', refError);
      return [];
    }

    // Get all other plans for the user
    const { data: allPlans, error: plansError } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .neq('id', planId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (plansError) {
      console.error('Error finding similar plans:', plansError);
      return [];
    }

    // For now, return plans with a basic similarity score
    // This will be enhanced with proper vector similarity once embeddings are working
    return (allPlans || []).map(plan => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      calories: plan.calories,
      similarity: 0.6, // Placeholder similarity score
      created_at: plan.created_at
    }));
  } catch (error) {
    console.error('Error finding similar plans:', error);
    return [];
  }
}

async function fallbackTextSearch(
  searchQuery: string,
  userId: string,
  limitCount: number = 10
): Promise<SearchResult[]> {
  try {
    console.log('Using text search for query:', searchQuery);
    
    // Simple text-based search using ILIKE
    const { data: results, error } = await supabase
      .from('nutrition_plans')
      .select('id, title, description, duration, calories, created_at')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error in fallback search:', error);
      throw error;
    }

    // Add similarity score of 0.5 for text search results
    return (results || []).map(plan => ({
      ...plan,
      similarity: 0.5
    }));
  } catch (error) {
    console.error('Error in fallback text search:', error);
    return [];
  }
}

export async function getAllPlansWithEmbeddings(userId: string): Promise<any[]> {
  try {
    const { data: plans, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading plans with embeddings:', error);
      throw error;
    }

    return plans || [];
  } catch (error) {
    console.error('Error getting plans with embeddings:', error);
    return [];
  }
} 