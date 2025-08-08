import { API_CONFIG } from '@/config/api';

export interface NutritionFact {
  id: string;
  fact: string;
  category: 'fruits' | 'vegetables' | 'proteins' | 'grains' | 'dairy' | 'general';
  ageGroup: 'toddler' | 'preschool' | 'school' | 'all';
  emoji: string;
  timestamp: number;
}

export async function generateNutritionFacts(kidAge: number): Promise<NutritionFact[]> {
  try {
    // Determine age group for appropriate facts
    const ageGroup = kidAge <= 3 ? 'toddler' : kidAge <= 5 ? 'preschool' : 'school';
    
    const prompt = `Generate 6 fun, educational nutrition facts for children aged ${kidAge} years old. 
    Make them engaging, easy to understand, and age-appropriate. Each fact should be:
    - Fun and interesting for kids
    - Educational about healthy foods
    - Easy to understand for a ${ageGroup} age child
    - Include a relevant emoji
    - Cover different food categories (fruits, vegetables, proteins, grains, dairy)

    Return ONLY a valid JSON array with this exact structure:
    [
      {
        "fact": "Fun fact text here",
        "category": "fruits|vegetables|proteins|grains|dairy|general",
        "emoji": "relevant emoji"
      }
    ]

    Example format:
    [
      {
        "fact": "Carrots help you see better in the dark because they have vitamin A!",
        "category": "vegetables",
        "emoji": "🥕"
      }
    ]

    Generate exactly 6 different facts covering different food categories. Make them exciting and kid-friendly!`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2000,
        candidateCount: 1
      }
    };

    const apiUrl = `${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_CONFIG.GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Clean up the response
    let cleanResponse = aiResponse.trim();
    
    // Remove markdown formatting if present
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.replace(/```\n?/g, '');
    }

    // Parse the JSON response
    const factsArray = JSON.parse(cleanResponse);
    
    // Convert to our NutritionFact format with IDs and timestamps
    const nutritionFacts: NutritionFact[] = factsArray.map((fact: any, index: number) => ({
      id: `fact-${Date.now()}-${index}`,
      fact: fact.fact,
      category: fact.category || 'general',
      ageGroup: ageGroup as any,
      emoji: fact.emoji || '🍎',
      timestamp: Date.now()
    }));

    return nutritionFacts;

  } catch (error) {
    console.error('Error generating nutrition facts:', error);
    
    // Return fallback facts if API fails
    return getFallbackNutritionFacts(kidAge);
  }
}

function getFallbackNutritionFacts(kidAge: number): NutritionFact[] {
  const fallbackFacts = [
    {
      id: `fallback-${Date.now()}-1`,
      fact: "Carrots help you see better in the dark because they have vitamin A!",
      category: 'vegetables' as const,
      ageGroup: 'all' as const,
      emoji: '🥕',
      timestamp: Date.now()
    },
    {
      id: `fallback-${Date.now()}-2`,
      fact: "Milk helps build strong bones and teeth with calcium!",
      category: 'dairy' as const,
      ageGroup: 'all' as const,
      emoji: '🥛',
      timestamp: Date.now()
    },
    {
      id: `fallback-${Date.now()}-3`,
      fact: "Blueberries are brain food - they help you think better!",
      category: 'fruits' as const,
      ageGroup: 'all' as const,
      emoji: '🫐',
      timestamp: Date.now()
    },
    {
      id: `fallback-${Date.now()}-4`,
      fact: "Spinach makes you strong like Popeye because it's full of iron!",
      category: 'vegetables' as const,
      ageGroup: 'all' as const,
      emoji: '🥬',
      timestamp: Date.now()
    },
    {
      id: `fallback-${Date.now()}-5`,
      fact: "Oranges have vitamin C that helps fight off colds!",
      category: 'fruits' as const,
      ageGroup: 'all' as const,
      emoji: '🍊',
      timestamp: Date.now()
    },
    {
      id: `fallback-${Date.now()}-6`,
      fact: "Whole grain bread gives you energy to play all day!",
      category: 'grains' as const,
      ageGroup: 'all' as const,
      emoji: '🍞',
      timestamp: Date.now()
    }
  ];

  return fallbackFacts;
}

// Cache management
const CACHE_KEY = 'nutrition_facts_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function getCachedNutritionFacts(): NutritionFact[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { facts, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (less than 1 hour old)
    if (now - timestamp < CACHE_DURATION) {
      return facts;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading nutrition facts cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export function setCachedNutritionFacts(facts: NutritionFact[]): void {
  try {
    const cacheData = {
      facts,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching nutrition facts:', error);
  }
}

export async function getNutritionFacts(kidAge: number, forceRefresh: boolean = false): Promise<NutritionFact[]> {
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cached = getCachedNutritionFacts();
    if (cached) {
      return cached;
    }
  }

  // Generate new facts
  const facts = await generateNutritionFacts(kidAge);
  
  // Cache the new facts
  setCachedNutritionFacts(facts);
  
  return facts;
}