import { useState, useEffect, useCallback } from 'react';
import { getNutritionFacts, NutritionFact } from '@/api/generate-nutrition-facts';

export function useNutritionFacts(kidAge: number) {
  const [facts, setFacts] = useState<NutritionFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadFacts = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const nutritionFacts = await getNutritionFacts(kidAge, forceRefresh);
      setFacts(nutritionFacts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading nutrition facts:', err);
      setError('Failed to load nutrition facts');
    } finally {
      setLoading(false);
    }
  }, [kidAge]);

  const refreshFacts = useCallback(() => {
    loadFacts(true);
  }, [loadFacts]);

  // Load facts on mount
  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  // Set up auto-refresh every hour
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing nutrition facts...');
      loadFacts(true);
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [loadFacts]);

  // Check for updates when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && lastUpdated) {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        const oneHour = 60 * 60 * 1000;

        // If it's been more than an hour since last update, refresh
        if (timeDiff > oneHour) {
          console.log('Page became visible and facts are stale, refreshing...');
          loadFacts(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdated, loadFacts]);

  return {
    facts,
    loading,
    error,
    lastUpdated,
    refreshFacts
  };
}