import { API_CONFIG } from '@/config/api';

export interface KidsMeal {
  id: string;
  name: string;
  description: string;
  type: 'breakfast' | 'lunch' | 'snack';
  calories: number;
  prep_time: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  instructions: string[];
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    calcium: number;
    iron: number;
  };
  allergens: string[];
  kid_friendly_score: number;
  portability_score: number;
  prep_tips: string[];
  storage_tips: string[];
  emoji: string;
  category: string;
}

export interface KidsSchoolPlan {
  id: string;
  kid_id: string;
  title: string;
  description: string;
  duration: string;
  created_at: string;
  daily_plans: KidsDailyPlan[];
  preferences: KidsPlanPreferences;
}

export interface KidsDailyPlan {
  day: number;
  date: string;
  breakfast: KidsMeal;
  lunch: KidsMeal;
  snack: KidsMeal;
  total_calories: number;
  nutrition_summary: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    calcium: number;
    iron: number;
  };
}

export interface KidsPlanPreferences {
  kid_age: number;
  allergies: string[];
  dislikes: string[];
  favorites: string[];
  dietary_restrictions: string[];
  school_lunch_policy: string;
  prep_time_limit: string;
  budget_range: string;
  special_requirements: string;
}

export async function generateKidsSchoolPlan(
  preferences: KidsPlanPreferences,
  kidName: string,
  duration: number = 7
): Promise<KidsSchoolPlan> {
  // Validate duration
  if (duration < 1 || duration > 90) {
    throw new Error('Duration must be between 1 and 90 days');
  }
  try {
    const prompt = `Generate a comprehensive ${duration}-day school meal plan for ${kidName}, a ${preferences.kid_age}-year-old child.

CHILD PROFILE:
- Name: ${kidName}
- Age: ${preferences.kid_age} years
- Allergies: ${preferences.allergies.join(', ') || 'None'}
- Dislikes: ${preferences.dislikes.join(', ') || 'None specified'}
- Favorites: ${preferences.favorites.join(', ') || 'None specified'}
- Dietary Restrictions: ${preferences.dietary_restrictions.join(', ') || 'None'}
- School Lunch Policy: ${preferences.school_lunch_policy || 'Packed lunch allowed'}
- Prep Time Limit: ${preferences.prep_time_limit || '15-20 minutes'}
- Budget Range: ${preferences.budget_range || 'Moderate'}
- Special Requirements: ${preferences.special_requirements || 'None'}

CRITICAL VARIETY REQUIREMENTS:
- EVERY SINGLE DAY MUST HAVE COMPLETELY DIFFERENT MEALS
- NO MEAL SHOULD BE REPEATED ACROSS THE ${duration} DAYS
- Each breakfast, lunch, and snack must be unique and different
- Use different cooking methods, ingredients, and cuisines for variety
- Ensure no two days have similar meal combinations

MEAL REQUIREMENTS:
1. BREAKFAST: Quick, nutritious, energy-boosting meals for school mornings
2. LUNCH: Portable, appealing, balanced meals that stay fresh until lunchtime
3. AFTERNOON SNACK: Healthy, satisfying snacks for after-school energy

GUIDELINES:
- Age-appropriate portions and nutrition for ${preferences.kid_age}-year-old
- School-friendly foods (no nuts if school policy, easy to eat, minimal mess)
- Balanced nutrition with adequate protein, healthy carbs, and essential vitamins
- Kid-appealing presentation and flavors
- Practical preparation and storage considerations
- Include prep tips and storage instructions for busy parents

CREATIVITY REQUIREMENTS:
- Make meals fun and visually appealing for kids
- Include variety in colors, textures, and flavors
- Consider seasonal ingredients and themes
- Add creative presentation ideas (fun shapes, colorful arrangements)
- Include interactive elements kids can help prepare
- Use different cultural cuisines (Italian, Mexican, Asian, American, etc.)
- Vary cooking methods (baked, grilled, raw, steamed, etc.)

NUTRITIONAL TARGETS (per day):
- Calories: ${preferences.kid_age <= 5 ? '1200-1400' : preferences.kid_age <= 8 ? '1400-1800' : '1800-2200'}
- Protein: ${preferences.kid_age <= 5 ? '16-20g' : preferences.kid_age <= 8 ? '20-28g' : '28-35g'}
- Calcium: ${preferences.kid_age <= 5 ? '700mg' : preferences.kid_age <= 8 ? '1000mg' : '1300mg'}
- Iron: ${preferences.kid_age <= 5 ? '7mg' : preferences.kid_age <= 8 ? '10mg' : '15mg'}

Return ONLY valid JSON with this exact structure:
{
  "title": "School Meal Plan for [KidName]",
  "description": "A [duration]-day school meal plan designed specifically for [KidName]",
  "duration": "${duration} days",
  "daily_plans": [
    {
      "day": 1,
      "date": "2024-01-01",
      "breakfast": {
        "name": "Meal name",
        "description": "Detailed description",
        "type": "breakfast",
        "calories": 300,
        "prep_time": "10 min",
        "difficulty": "easy",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "nutrition": {
          "protein": 12,
          "carbs": 35,
          "fat": 8,
          "fiber": 4,
          "calcium": 200,
          "iron": 2
        },
        "allergens": ["milk"],
        "kid_friendly_score": 9,
        "portability_score": 7,
        "prep_tips": ["tip1", "tip2"],
        "storage_tips": ["tip1", "tip2"],
        "emoji": "🥞",
        "category": "breakfast"
      },
      "lunch": { /* same structure */ },
      "snack": { /* same structure */ },
      "total_calories": 1200,
      "nutrition_summary": {
        "protein": 45,
        "carbs": 150,
        "fat": 40,
        "fiber": 20,
        "calcium": 800,
        "iron": 8
      }
    }
  ]
}

CRITICAL: Generate ALL ${duration} days with complete meal details. No placeholders or shortcuts.

VARIETY ENFORCEMENT:
- Day 1: Use completely different meals from any other day
- Day 2: Must have different breakfast, lunch, and snack from Day 1
- Day 3: Must have different meals from Days 1 and 2
- Continue this pattern for all ${duration} days
- NO MEAL REPETITION ALLOWED ACROSS ANY DAYS
- Each day should feel like a completely different meal experience

EXAMPLES OF VARIETY:
- Breakfast: Pancakes → Oatmeal → Eggs → Toast → Smoothie → Quesadilla → Parfait
- Lunch: Wrap → Sandwich → Pasta → Pizza → Salad → Bento → Soup
- Snack: Apple → Yogurt → Crackers → Trail mix → Veggies → Banana → Granola bar

${duration > 14 ? `
EXTENDED PLAN REQUIREMENTS (${duration} days):
- Week 1: Focus on familiar, kid-friendly meals
- Week 2: Introduce more adventurous flavors and textures
- Week 3+: Include seasonal ingredients and cultural variety
- Use different cooking methods throughout the plan
- Consider weekly themes (Italian week, Asian week, etc.)
- Ensure nutritional balance across the entire ${duration}-day period
` : ''}

Generate exactly ${duration} days with this level of variety.`;

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
        maxOutputTokens: 32000,
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

    // Clean up the response with more robust cleaning
    let cleanResponse = aiResponse.trim();
    
    // Remove markdown formatting if present
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.replace(/```\n?/g, '');
    }

    // Remove any leading/trailing non-JSON content
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
    }

    // Additional cleaning for common AI response issues
    cleanResponse = cleanResponse
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
      .trim();

    console.log('Cleaned response for parsing:', cleanResponse.substring(0, 200) + '...');

    // Parse the JSON response with better error handling
    let planData;
    try {
      planData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Problematic response:', cleanResponse);
      
      // Try to fix common JSON issues and parse again
      let fixedResponse = cleanResponse
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        .replace(/\\n/g, '\\\\n') // Escape newlines properly
        .replace(/\n/g, ' ') // Replace actual newlines with spaces
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\s+/g, ' '); // Normalize whitespace
      
      try {
        planData = JSON.parse(fixedResponse);
        console.log('Successfully parsed after fixing JSON');
      } catch (secondParseError) {
        console.error('Second JSON Parse Error:', secondParseError);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }
    }
    
    // Validate the parsed data structure
    if (!planData || typeof planData !== 'object') {
      throw new Error('Invalid plan data structure');
    }
    
    if (!planData.title || !planData.description || !planData.daily_plans || !Array.isArray(planData.daily_plans)) {
      throw new Error('Missing required plan data fields');
    }

    // Validate each daily plan
    for (let i = 0; i < planData.daily_plans.length; i++) {
      const day = planData.daily_plans[i];
      if (!day.breakfast || !day.lunch || !day.snack) {
        throw new Error(`Day ${i + 1} is missing required meals`);
      }
    }

    // Add IDs and metadata
    const schoolPlan: KidsSchoolPlan = {
      id: `kids-plan-${Date.now()}`,
      kid_id: '', // Will be set when saving
      title: planData.title,
      description: planData.description,
      duration: planData.duration || planData.daily_plans.length,
      created_at: new Date().toISOString(),
      daily_plans: planData.daily_plans.map((day: any, dayIndex: number) => ({
        ...day,
        breakfast: { ...day.breakfast, id: `breakfast-${dayIndex}-${Date.now()}` },
        lunch: { ...day.lunch, id: `lunch-${dayIndex}-${Date.now()}` },
        snack: { ...day.snack, id: `snack-${dayIndex}-${Date.now()}` }
      })),
      preferences
    };

    return schoolPlan;

  } catch (error) {
    console.error('Error generating kids school plan:', error);
    
    // Log additional context for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        preferences,
        kidName,
        duration
      });
    }
    
    // Return fallback plan if API fails
    console.log('Falling back to default meal plan');
    return generateFallbackKidsSchoolPlan(preferences, kidName, duration);
  }
}

function generateFallbackKidsSchoolPlan(
  preferences: KidsPlanPreferences,
  kidName: string,
  duration: number
): KidsSchoolPlan {
  const fallbackMeals = {
    breakfast: [
      {
        name: "Banana Pancake Bites",
        description: "Mini pancakes made with banana and whole wheat flour, perfect for little hands",
        type: "breakfast" as const,
        calories: 280,
        prep_time: "15 min",
        difficulty: "easy" as const,
        ingredients: ["Banana", "Whole wheat flour", "Egg", "Milk", "Honey"],
        instructions: ["Mash banana", "Mix with flour and egg", "Cook small pancakes", "Serve with honey"],
        nutrition: { protein: 12, carbs: 35, fat: 8, fiber: 4, calcium: 150, iron: 2 },
        allergens: ["eggs", "milk", "gluten"],
        kid_friendly_score: 9,
        portability_score: 8,
        prep_tips: ["Make ahead and freeze", "Use fun shapes"],
        storage_tips: ["Store in airtight container", "Reheat in toaster"],
        emoji: "🥞",
        category: "breakfast"
      },
      {
        name: "Overnight Oats with Berries",
        description: "Creamy oats with fresh berries, prepared the night before",
        type: "breakfast" as const,
        calories: 260,
        prep_time: "5 min",
        difficulty: "easy" as const,
        ingredients: ["Rolled oats", "Milk", "Greek yogurt", "Berries", "Honey"],
        instructions: ["Mix oats with milk and yogurt", "Add berries and honey", "Refrigerate overnight", "Serve cold"],
        nutrition: { protein: 14, carbs: 32, fat: 6, fiber: 5, calcium: 180, iron: 2 },
        allergens: ["milk"],
        kid_friendly_score: 8,
        portability_score: 9,
        prep_tips: ["Use mason jars for easy transport", "Add toppings in the morning"],
        storage_tips: ["Keep refrigerated", "Consume within 2 days"],
        emoji: "🥣",
        category: "breakfast"
      },
      {
        name: "Scrambled Egg Muffins",
        description: "Fluffy scrambled eggs baked in muffin cups with cheese and vegetables",
        type: "breakfast" as const,
        calories: 290,
        prep_time: "20 min",
        difficulty: "medium" as const,
        ingredients: ["Eggs", "Cheese", "Bell peppers", "Spinach", "Milk"],
        instructions: ["Beat eggs with milk", "Add vegetables and cheese", "Pour into muffin cups", "Bake until set"],
        nutrition: { protein: 16, carbs: 8, fat: 18, fiber: 2, calcium: 200, iron: 3 },
        allergens: ["eggs", "milk"],
        kid_friendly_score: 9,
        portability_score: 10,
        prep_tips: ["Make batch on Sunday", "Freeze for quick breakfasts"],
        storage_tips: ["Refrigerate up to 5 days", "Microwave to reheat"],
        emoji: "🧁",
        category: "breakfast"
      },
      {
        name: "Peanut Butter Toast Shapes",
        description: "Whole grain toast cut into fun shapes with peanut butter and banana",
        type: "breakfast" as const,
        calories: 270,
        prep_time: "8 min",
        difficulty: "easy" as const,
        ingredients: ["Whole grain bread", "Peanut butter", "Banana", "Cinnamon"],
        instructions: ["Toast bread", "Spread peanut butter", "Add banana slices", "Cut into fun shapes"],
        nutrition: { protein: 11, carbs: 28, fat: 14, fiber: 4, calcium: 80, iron: 2 },
        allergens: ["peanuts", "gluten"],
        kid_friendly_score: 10,
        portability_score: 7,
        prep_tips: ["Use cookie cutters for shapes", "Pack banana separately"],
        storage_tips: ["Eat fresh", "Wrap in parchment paper"],
        emoji: "🍞",
        category: "breakfast"
      },
      {
        name: "Smoothie Bowl",
        description: "Thick fruit smoothie topped with granola and fresh fruit",
        type: "breakfast" as const,
        calories: 300,
        prep_time: "10 min",
        difficulty: "easy" as const,
        ingredients: ["Frozen berries", "Banana", "Greek yogurt", "Granola", "Honey"],
        instructions: ["Blend frozen fruit with yogurt", "Pour into bowl", "Top with granola and fresh fruit", "Drizzle with honey"],
        nutrition: { protein: 15, carbs: 45, fat: 8, fiber: 6, calcium: 150, iron: 2 },
        allergens: ["milk"],
        kid_friendly_score: 9,
        portability_score: 6,
        prep_tips: ["Use frozen fruit for thickness", "Let kids choose toppings"],
        storage_tips: ["Eat immediately", "Pack toppings separately"],
        emoji: "🍓",
        category: "breakfast"
      },
      {
        name: "Mini Breakfast Quesadillas",
        description: "Small tortillas filled with scrambled eggs and cheese",
        type: "breakfast" as const,
        calories: 285,
        prep_time: "12 min",
        difficulty: "medium" as const,
        ingredients: ["Small tortillas", "Eggs", "Cheese", "Ham", "Salsa"],
        instructions: ["Scramble eggs", "Fill tortillas with eggs and cheese", "Cook until crispy", "Serve with salsa"],
        nutrition: { protein: 18, carbs: 22, fat: 15, fiber: 2, calcium: 220, iron: 2 },
        allergens: ["eggs", "milk", "gluten"],
        kid_friendly_score: 9,
        portability_score: 8,
        prep_tips: ["Make ahead and freeze", "Cut into triangles"],
        storage_tips: ["Wrap individually", "Reheat in toaster oven"],
        emoji: "🌮",
        category: "breakfast"
      },
      {
        name: "Yogurt Parfait Cups",
        description: "Layered Greek yogurt with granola and fresh fruit",
        type: "breakfast" as const,
        calories: 250,
        prep_time: "5 min",
        difficulty: "easy" as const,
        ingredients: ["Greek yogurt", "Granola", "Strawberries", "Blueberries", "Honey"],
        instructions: ["Layer yogurt in cup", "Add granola and fruit", "Repeat layers", "Top with honey"],
        nutrition: { protein: 16, carbs: 30, fat: 6, fiber: 4, calcium: 200, iron: 1 },
        allergens: ["milk"],
        kid_friendly_score: 8,
        portability_score: 9,
        prep_tips: ["Use clear cups to show layers", "Pack granola separately"],
        storage_tips: ["Keep cold", "Assemble just before eating"],
        emoji: "🥛",
        category: "breakfast"
      }
    ],
    lunch: [
      {
        name: "Rainbow Veggie Wrap",
        description: "Colorful wrap with hummus, vegetables, and cheese in a fun tortilla",
        type: "lunch" as const,
        calories: 350,
        prep_time: "10 min",
        difficulty: "easy" as const,
        ingredients: ["Whole wheat tortilla", "Hummus", "Carrots", "Cucumber", "Cheese", "Lettuce"],
        instructions: ["Spread hummus on tortilla", "Add vegetables", "Roll tightly", "Cut in half"],
        nutrition: { protein: 15, carbs: 40, fat: 12, fiber: 6, calcium: 200, iron: 3 },
        allergens: ["gluten", "sesame"],
        kid_friendly_score: 8,
        portability_score: 9,
        prep_tips: ["Use colorful vegetables", "Cut into pinwheels"],
        storage_tips: ["Wrap in foil", "Keep cool until lunch"],
        emoji: "🌯",
        category: "lunch"
      },
      {
        name: "Turkey and Cheese Roll-ups",
        description: "Sliced turkey and cheese rolled up with vegetables in a tortilla",
        type: "lunch" as const,
        calories: 320,
        prep_time: "8 min",
        difficulty: "easy" as const,
        ingredients: ["Turkey slices", "Cheese", "Tortilla", "Lettuce", "Tomato"],
        instructions: ["Layer turkey and cheese on tortilla", "Add vegetables", "Roll tightly", "Secure with toothpick"],
        nutrition: { protein: 22, carbs: 25, fat: 14, fiber: 3, calcium: 180, iron: 2 },
        allergens: ["gluten", "milk"],
        kid_friendly_score: 9,
        portability_score: 10,
        prep_tips: ["Use fun colored tortillas", "Cut into spirals"],
        storage_tips: ["Wrap in plastic wrap", "Keep refrigerated"],
        emoji: "🥪",
        category: "lunch"
      },
      {
        name: "Pasta Salad with Chicken",
        description: "Cold pasta salad with grilled chicken, vegetables, and Italian dressing",
        type: "lunch" as const,
        calories: 380,
        prep_time: "15 min",
        difficulty: "medium" as const,
        ingredients: ["Pasta", "Grilled chicken", "Cherry tomatoes", "Cucumber", "Italian dressing"],
        instructions: ["Cook pasta and cool", "Add chicken and vegetables", "Toss with dressing", "Chill before serving"],
        nutrition: { protein: 25, carbs: 35, fat: 15, fiber: 4, calcium: 80, iron: 3 },
        allergens: ["gluten"],
        kid_friendly_score: 8,
        portability_score: 9,
        prep_tips: ["Use fun pasta shapes", "Make ahead for better flavor"],
        storage_tips: ["Keep cold", "Pack dressing separately"],
        emoji: "🍝",
        category: "lunch"
      },
      {
        name: "Mini Bagel Pizzas",
        description: "Toasted mini bagels topped with pizza sauce, cheese, and vegetables",
        type: "lunch" as const,
        calories: 340,
        prep_time: "12 min",
        difficulty: "easy" as const,
        ingredients: ["Mini bagels", "Pizza sauce", "Mozzarella cheese", "Pepperoni", "Bell peppers"],
        instructions: ["Split and toast bagels", "Spread sauce", "Add cheese and toppings", "Bake until melted"],
        nutrition: { protein: 18, carbs: 32, fat: 16, fiber: 3, calcium: 250, iron: 2 },
        allergens: ["gluten", "milk"],
        kid_friendly_score: 10,
        portability_score: 7,
        prep_tips: ["Let kids choose toppings", "Make ahead and reheat"],
        storage_tips: ["Wrap in foil", "Eat warm or cold"],
        emoji: "🍕",
        category: "lunch"
      },
      {
        name: "Chicken Salad Sandwich",
        description: "Creamy chicken salad with grapes and celery on whole grain bread",
        type: "lunch" as const,
        calories: 360,
        prep_time: "10 min",
        difficulty: "easy" as const,
        ingredients: ["Cooked chicken", "Grapes", "Celery", "Mayo", "Whole grain bread"],
        instructions: ["Mix chicken with grapes and celery", "Add mayo", "Spread on bread", "Cut into triangles"],
        nutrition: { protein: 24, carbs: 28, fat: 16, fiber: 4, calcium: 100, iron: 2 },
        allergens: ["gluten", "eggs"],
        kid_friendly_score: 8,
        portability_score: 8,
        prep_tips: ["Use rotisserie chicken", "Add grapes for sweetness"],
        storage_tips: ["Keep cold", "Pack with ice pack"],
        emoji: "🥙",
        category: "lunch"
      },
      {
        name: "Bento Box Lunch",
        description: "Japanese-style lunch box with rice, protein, and vegetables",
        type: "lunch" as const,
        calories: 370,
        prep_time: "15 min",
        difficulty: "medium" as const,
        ingredients: ["Rice", "Teriyaki chicken", "Edamame", "Carrots", "Seaweed snacks"],
        instructions: ["Pack rice in compartment", "Add chicken and vegetables", "Include seaweed snacks", "Arrange colorfully"],
        nutrition: { protein: 20, carbs: 45, fat: 10, fiber: 5, calcium: 120, iron: 3 },
        allergens: ["soy"],
        kid_friendly_score: 7,
        portability_score: 10,
        prep_tips: ["Use bento box containers", "Make it colorful"],
        storage_tips: ["Keep components separate", "Include ice pack"],
        emoji: "🍱",
        category: "lunch"
      },
      {
        name: "Grilled Cheese and Soup",
        description: "Classic grilled cheese sandwich with tomato soup in a thermos",
        type: "lunch" as const,
        calories: 390,
        prep_time: "10 min",
        difficulty: "easy" as const,
        ingredients: ["Bread", "Cheese", "Butter", "Tomato soup"],
        instructions: ["Butter bread", "Add cheese", "Grill until golden", "Pack soup in thermos"],
        nutrition: { protein: 16, carbs: 38, fat: 20, fiber: 3, calcium: 300, iron: 2 },
        allergens: ["gluten", "milk"],
        kid_friendly_score: 10,
        portability_score: 8,
        prep_tips: ["Use different cheese types", "Cut into fun shapes"],
        storage_tips: ["Wrap sandwich in foil", "Keep soup hot in thermos"],
        emoji: "🧀",
        category: "lunch"
      }
    ],
    snack: [
      {
        name: "Apple Slices with Peanut Butter",
        description: "Fresh apple slices with creamy peanut butter for dipping",
        type: "snack" as const,
        calories: 180,
        prep_time: "5 min",
        difficulty: "easy" as const,
        ingredients: ["Apple", "Peanut butter"],
        instructions: ["Slice apple", "Serve with peanut butter for dipping"],
        nutrition: { protein: 8, carbs: 20, fat: 12, fiber: 4, calcium: 20, iron: 1 },
        allergens: ["peanuts"],
        kid_friendly_score: 9,
        portability_score: 7,
        prep_tips: ["Add lemon juice to prevent browning"],
        storage_tips: ["Pack separately to prevent soggy apples"],
        emoji: "🍎",
        category: "snack"
      },
      {
        name: "Yogurt with Granola",
        description: "Creamy yogurt topped with crunchy granola and berries",
        type: "snack" as const,
        calories: 160,
        prep_time: "3 min",
        difficulty: "easy" as const,
        ingredients: ["Greek yogurt", "Granola", "Berries"],
        instructions: ["Spoon yogurt into container", "Top with granola and berries"],
        nutrition: { protein: 12, carbs: 18, fat: 6, fiber: 3, calcium: 150, iron: 1 },
        allergens: ["milk"],
        kid_friendly_score: 8,
        portability_score: 9,
        prep_tips: ["Pack granola separately to keep crunchy"],
        storage_tips: ["Keep cold", "Assemble just before eating"],
        emoji: "🥛",
        category: "snack"
      },
      {
        name: "Cheese and Crackers",
        description: "Whole grain crackers with cheese cubes and grapes",
        type: "snack" as const,
        calories: 170,
        prep_time: "2 min",
        difficulty: "easy" as const,
        ingredients: ["Whole grain crackers", "Cheese cubes", "Grapes"],
        instructions: ["Arrange crackers and cheese", "Add grapes on the side"],
        nutrition: { protein: 8, carbs: 15, fat: 10, fiber: 2, calcium: 200, iron: 1 },
        allergens: ["milk", "gluten"],
        kid_friendly_score: 9,
        portability_score: 10,
        prep_tips: ["Use fun shaped crackers", "Cut cheese into cubes"],
        storage_tips: ["Keep cheese cold", "Pack in compartmented container"],
        emoji: "🧀",
        category: "snack"
      },
      {
        name: "Trail Mix",
        description: "Homemade mix of nuts, dried fruit, and chocolate chips",
        type: "snack" as const,
        calories: 190,
        prep_time: "5 min",
        difficulty: "easy" as const,
        ingredients: ["Almonds", "Dried cranberries", "Chocolate chips", "Pretzels"],
        instructions: ["Mix all ingredients", "Store in small containers"],
        nutrition: { protein: 6, carbs: 22, fat: 10, fiber: 3, calcium: 50, iron: 2 },
        allergens: ["nuts", "milk"],
        kid_friendly_score: 9,
        portability_score: 10,
        prep_tips: ["Let kids help mix", "Make in bulk"],
        storage_tips: ["Store in airtight containers", "Portion into small bags"],
        emoji: "🥜",
        category: "snack"
      },
      {
        name: "Veggie Sticks with Hummus",
        description: "Colorful vegetable sticks with creamy hummus dip",
        type: "snack" as const,
        calories: 140,
        prep_time: "8 min",
        difficulty: "easy" as const,
        ingredients: ["Carrots", "Celery", "Bell peppers", "Hummus"],
        instructions: ["Cut vegetables into sticks", "Serve with hummus for dipping"],
        nutrition: { protein: 6, carbs: 16, fat: 8, fiber: 5, calcium: 60, iron: 2 },
        allergens: ["sesame"],
        kid_friendly_score: 7,
        portability_score: 9,
        prep_tips: ["Cut vegetables the night before", "Use colorful vegetables"],
        storage_tips: ["Keep vegetables crisp in water", "Pack hummus separately"],
        emoji: "🥕",
        category: "snack"
      },
      {
        name: "Banana with Almond Butter",
        description: "Sliced banana with almond butter for dipping",
        type: "snack" as const,
        calories: 200,
        prep_time: "3 min",
        difficulty: "easy" as const,
        ingredients: ["Banana", "Almond butter"],
        instructions: ["Slice banana", "Serve with almond butter"],
        nutrition: { protein: 7, carbs: 24, fat: 12, fiber: 4, calcium: 80, iron: 1 },
        allergens: ["nuts"],
        kid_friendly_score: 8,
        portability_score: 7,
        prep_tips: ["Add lemon juice to prevent browning"],
        storage_tips: ["Pack banana and butter separately"],
        emoji: "🍌",
        category: "snack"
      },
      {
        name: "Homemade Granola Bars",
        description: "Chewy granola bars made with oats, honey, and dried fruit",
        type: "snack" as const,
        calories: 185,
        prep_time: "25 min",
        difficulty: "medium" as const,
        ingredients: ["Oats", "Honey", "Peanut butter", "Dried fruit", "Seeds"],
        instructions: ["Mix dry ingredients", "Heat honey and peanut butter", "Combine and press into pan", "Cool and cut"],
        nutrition: { protein: 6, carbs: 26, fat: 8, fiber: 4, calcium: 40, iron: 2 },
        allergens: ["peanuts"],
        kid_friendly_score: 9,
        portability_score: 10,
        prep_tips: ["Make batch on weekends", "Let kids help mix"],
        storage_tips: ["Wrap individually", "Store at room temperature"],
        emoji: "🍪",
        category: "snack"
      }
    ]
  };

  const dailyPlans: KidsDailyPlan[] = [];
  
  for (let day = 1; day <= duration; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day - 1);
    
    // Use different meals for each day by cycling through the arrays with some randomization
    const breakfastIndex = (day - 1) % fallbackMeals.breakfast.length;
    const lunchIndex = (day - 1) % fallbackMeals.lunch.length;
    const snackIndex = (day - 1) % fallbackMeals.snack.length;
    
    // Add slight variation for longer plans by offsetting indices
    const breakfastOffset = Math.floor((day - 1) / fallbackMeals.breakfast.length) % 3;
    const lunchOffset = Math.floor((day - 1) / fallbackMeals.lunch.length) % 3;
    const snackOffset = Math.floor((day - 1) / fallbackMeals.snack.length) % 3;
    
    const breakfast = { 
      ...fallbackMeals.breakfast[breakfastIndex], 
      id: `breakfast-${day}-${Date.now()}`,
      // Add slight variation for longer plans
      name: fallbackMeals.breakfast[breakfastIndex].name + (breakfastOffset > 0 ? ` (Variation ${breakfastOffset + 1})` : '')
    };
    const lunch = { 
      ...fallbackMeals.lunch[lunchIndex], 
      id: `lunch-${day}-${Date.now()}`,
      name: fallbackMeals.lunch[lunchIndex].name + (lunchOffset > 0 ? ` (Variation ${lunchOffset + 1})` : '')
    };
    const snack = { 
      ...fallbackMeals.snack[snackIndex], 
      id: `snack-${day}-${Date.now()}`,
      name: fallbackMeals.snack[snackIndex].name + (snackOffset > 0 ? ` (Variation ${snackOffset + 1})` : '')
    };
    
    dailyPlans.push({
      day,
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      snack,
      total_calories: breakfast.calories + lunch.calories + snack.calories,
      nutrition_summary: {
        protein: breakfast.nutrition.protein + lunch.nutrition.protein + snack.nutrition.protein,
        carbs: breakfast.nutrition.carbs + lunch.nutrition.carbs + snack.nutrition.carbs,
        fat: breakfast.nutrition.fat + lunch.nutrition.fat + snack.nutrition.fat,
        fiber: breakfast.nutrition.fiber + lunch.nutrition.fiber + snack.nutrition.fiber,
        calcium: breakfast.nutrition.calcium + lunch.nutrition.calcium + snack.nutrition.calcium,
        iron: breakfast.nutrition.iron + lunch.nutrition.iron + snack.nutrition.iron
      }
    });
  }

  return {
    id: `kids-fallback-plan-${Date.now()}`,
    kid_id: '',
    title: `School Meal Plan for ${kidName}`,
    description: `A ${duration}-day school meal plan designed specifically for ${kidName}`,
    duration: `${duration} days`,
    created_at: new Date().toISOString(),
    daily_plans: dailyPlans,
    preferences
  };
}

export async function generateAlternativeMeal(
  originalMeal: KidsMeal,
  preferences: KidsPlanPreferences,
  kidName: string
): Promise<KidsMeal> {
  try {
    const prompt = `Generate an alternative ${originalMeal.type} meal for ${kidName} (age ${preferences.kid_age}) to replace this meal:

ORIGINAL MEAL: ${originalMeal.name}
MEAL TYPE: ${originalMeal.type}
ORIGINAL CALORIES: ${originalMeal.calories}

REQUIREMENTS:
- Similar nutritional profile to the original meal
- Age-appropriate for ${preferences.kid_age}-year-old
- School-friendly and portable
- Avoid: ${preferences.allergies.join(', ') || 'None'}
- Consider dislikes: ${preferences.dislikes.join(', ') || 'None'}
- Include favorites if possible: ${preferences.favorites.join(', ') || 'None'}

Return ONLY valid JSON with this exact structure:
{
  "name": "Alternative meal name",
  "description": "Detailed description",
  "type": "${originalMeal.type}",
  "calories": 300,
  "prep_time": "10 min",
  "difficulty": "easy",
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "nutrition": {
    "protein": 12,
    "carbs": 35,
    "fat": 8,
    "fiber": 4,
    "calcium": 200,
    "iron": 2
  },
  "allergens": ["allergen1"],
  "kid_friendly_score": 9,
  "portability_score": 8,
  "prep_tips": ["tip1", "tip2"],
  "storage_tips": ["tip1", "tip2"],
  "emoji": "🍎",
  "category": "${originalMeal.type}"
}`;

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
        temperature: 0.9,
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
    
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.replace(/```\n?/g, '');
    }

    const mealData = JSON.parse(cleanResponse);
    
    return {
      ...mealData,
      id: `alt-${originalMeal.type}-${Date.now()}`
    };

  } catch (error) {
    console.error('Error generating alternative meal:', error);
    
    // Return a simple alternative based on meal type
    const alternatives = {
      breakfast: {
        name: "Overnight Oats with Berries",
        description: "Creamy oats with fresh berries, prepared the night before",
        emoji: "🥣"
      },
      lunch: {
        name: "Turkey and Cheese Roll-ups",
        description: "Sliced turkey and cheese rolled up with vegetables",
        emoji: "🥪"
      },
      snack: {
        name: "Yogurt with Granola",
        description: "Creamy yogurt topped with crunchy granola",
        emoji: "🥛"
      }
    };

    const alt = alternatives[originalMeal.type as keyof typeof alternatives];
    
    return {
      id: `alt-${originalMeal.type}-${Date.now()}`,
      name: alt.name,
      description: alt.description,
      type: originalMeal.type,
      calories: originalMeal.calories,
      prep_time: "10 min",
      difficulty: "easy" as const,
      ingredients: ["Ingredient 1", "Ingredient 2"],
      instructions: ["Step 1", "Step 2"],
      nutrition: originalMeal.nutrition,
      allergens: [],
      kid_friendly_score: 8,
      portability_score: 8,
      prep_tips: ["Easy to prepare"],
      storage_tips: ["Store properly"],
      emoji: alt.emoji,
      category: originalMeal.type
    };
  }
}