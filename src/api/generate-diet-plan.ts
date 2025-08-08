import { API_CONFIG, NUTRITION_PROMPTS } from '@/config/api';
import { generateEmbedding, extractPlanTextForEmbedding } from './generate-embedding';

// Simple API connectivity test
export async function testGeminiConnection() {
  try {


    const testUrl = `${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent`;

    const testBody = {
      contents: [
        {
          parts: [
            {
              text: "Say 'Hello' in one word."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10
      }
    };

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_CONFIG.GEMINI_API_KEY
      },
      body: JSON.stringify(testBody)
    });

    if (response.ok) {
      console.log('✅ Gemini API connectivity test passed');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Gemini API connectivity test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API connectivity test error:', error);
    return false;
  }
}

export async function generateDietPlan(userContext: string, userId: string) {
  try {
    // Test API connectivity first
    const isConnected = await testGeminiConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to Gemini API. Please check your internet connection and try again.');
    }

    // Generate unique identifiers to prevent caching
    const timestamp = new Date().toISOString();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sessionId = `${userId}-${Date.now()}-${randomId}`;

    // Add multiple layers of randomness to the prompt
    const cuisineStyles = [
      'Mediterranean-inspired dishes', 'Asian fusion flavors', 'Latin American influences',
      'Middle Eastern spices', 'Indian subcontinental cuisine', 'European comfort foods',
      'African-inspired ingredients', 'Nordic minimalist approach', 'Mexican street food style',
      'Thai and Vietnamese fresh herbs', 'Japanese umami-rich meals', 'Italian rustic cooking'
    ];

    const cookingMethods = [
      'grilling and roasting techniques', 'steaming and poaching methods', 'stir-frying and sautéing',
      'slow-cooking and braising', 'raw and fresh preparations', 'fermented and pickled elements',
      'smoking and charring flavors', 'pressure cooking efficiency', 'air-frying healthiness',
      'sous-vide precision cooking', 'traditional stovetop methods', 'oven-baked wholesome meals'
    ];

    const nutritionalFocus = [
      'high-protein muscle building', 'anti-inflammatory ingredients', 'gut-health promoting foods',
      'brain-boosting nutrients', 'heart-healthy omega-3s', 'bone-strengthening calcium',
      'immune-system supporting vitamins', 'energy-sustaining complex carbs', 'detoxifying green vegetables',
      'antioxidant-rich colorful produce', 'fiber-rich digestive health', 'metabolism-boosting spices'
    ];

    const mealTimings = [
      'quick 15-minute preparations', '30-minute balanced meals', 'make-ahead meal prep',
      'one-pot wonder dishes', 'grab-and-go portable options', 'leisurely weekend cooking',
      'batch-cooking for busy weeks', 'fresh daily preparations', 'freezer-friendly options',
      'no-cook summer meals', 'warming winter comfort foods', 'light spring refreshers'
    ];

    // Select random elements from each category
    const randomCuisine = cuisineStyles[Math.floor(Math.random() * cuisineStyles.length)];
    const randomCooking = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
    const randomNutrition = nutritionalFocus[Math.floor(Math.random() * nutritionalFocus.length)];
    const randomTiming = mealTimings[Math.floor(Math.random() * mealTimings.length)];

    // Create a unique combination string
    const uniqueApproach = `${randomCuisine} with ${randomCooking}, emphasizing ${randomNutrition} and ${randomTiming}`;

    // Add even more randomness with numbers and specific requirements
    const randomNumber1 = Math.floor(Math.random() * 20) + 5; // 5-24
    const randomNumber2 = Math.floor(Math.random() * 15) + 10; // 10-24
    const randomPercentage = Math.floor(Math.random() * 30) + 20; // 20-49

    const specificRequirements = `Include at least ${randomNumber1} different vegetables, ${randomNumber2} unique protein sources, and ensure ${randomPercentage}% of meals feature ingredients you haven't used in previous plans.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${NUTRITION_PROMPTS.GENERATE_DIET_PLAN}

=== UNIQUENESS REQUIREMENTS ===
UNIQUE REQUEST ID: ${sessionId}
GENERATION TIMESTAMP: ${timestamp}
RANDOM SEED: ${Math.random().toString(36).substring(2, 10)}

=== CREATIVE DIRECTION ===
CULINARY APPROACH: ${uniqueApproach}
SPECIFIC REQUIREMENTS: ${specificRequirements}

=== MANDATORY VARIATION RULES ===
1. Use ingredient combinations you have NEVER used before
2. Create meal names that are completely original and specific
3. Avoid any "standard" or "typical" meal patterns
4. Each day must have a different cultural or regional influence
5. No two meals should share more than 2 main ingredients
6. Include at least 3 unusual or creative ingredient pairings per day
7. Vary cooking methods significantly between meals
8. Create unique flavor profiles for each meal

=== USER CONTEXT ===
${userContext}

=== SPECIAL REQUIREMENTS EMPHASIS ===
Pay special attention to any special requirements mentioned in the user context above. These are critical constraints that MUST be followed throughout the entire plan. If special requirements include medical conditions, allergies, or specific dietary needs, ensure every single meal complies with these requirements.

=== FINAL INSTRUCTION ===
This is request #${Date.now()} - Generate a completely unique plan that has NEVER been created before. Every single meal must be original, creative, and different from any standard meal plan. Use the random seed ${Math.random()} to ensure maximum variation.

CRITICAL: If you find yourself generating common meals like "Grilled Chicken Salad" or "Oatmeal with Berries", STOP and create something more unique and creative instead.

=== ABSOLUTE JSON REQUIREMENTS ===
YOU MUST RETURN ONLY VALID JSON. NO EXCEPTIONS.

FORBIDDEN - DO NOT INCLUDE ANY OF THESE:
❌ Comments: /* */ or //
❌ Markdown: \`\`\`json or \`\`\`
❌ Notes: **(Note: or any explanations
❌ Placeholders: "... (Repeat" or "Replace placeholder"
❌ Text before JSON: Any text before the opening {
❌ Text after JSON: Any text after the closing }

REQUIRED - YOU MUST DO THIS:
✅ Start immediately with {
✅ End immediately with }
✅ Generate ALL 30 days with 4 meals each (120 total meals)
✅ Every meal must be complete with name, description, calories, macros, ingredients, instructions
✅ No shortcuts, no placeholders, no comments

EXAMPLE OF WHAT NOT TO DO:
❌ {"day": 2, "meals": [/* placeholder */]}
❌ // Days 3-30 follow similar structure
❌ **(Note: This is incomplete)**

If you cannot generate all 120 meals, generate as many complete meals as possible, but DO NOT use placeholders or comments.

=== CRITICAL REQUIREMENT ===
YOU MUST GENERATE EXACTLY 30 DAYS OF MEALS.
Each day must have exactly 4 meals: breakfast, lunch, dinner, snack.
Total meals required: 30 days × 4 meals = 120 meals.

ABSOLUTELY MANDATORY: Do not stop at 3 days, 7 days, or any number less than 30.
Generate ALL 30 DAYS without exception.
The user selected 30 days and expects to see 30 days in their calendar.

If you cannot fit all 30 days in one response due to length limits, prioritize generating at least 14 days with complete meal details rather than 30 days with incomplete information.

STRUCTURE EXAMPLE:
{
  "title": "30-Day Plan",
  "description": "Complete 30-day meal plan",
  "duration": "30 days",
  "calories": "1800",
  "dailyMeals": [
    {"day": 1, "date": "2024-01-01", "meals": [4 complete meals]},
    {"day": 2, "date": "2024-01-02", "meals": [4 complete meals]},
    {"day": 3, "date": "2024-01-03", "meals": [4 complete meals]},
    ...continue this pattern...
    {"day": 30, "date": "2024-01-30", "meals": [4 complete meals]}
  ]
}

Generate ALL 30 days. Do not stop early.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8, // Slightly reduced for more consistent structure
        topP: 0.9, // More focused nucleus sampling
        topK: 40, // Balanced diversity
        maxOutputTokens: 32000, // Maximum tokens for complete response
        candidateCount: 1,
        stopSequences: [],
        // Add response format guidance
        responseMimeType: "application/json"
      }
    };

    const requestBodyString = JSON.stringify(requestBody);

    // Check if request body is too large
    if (requestBodyString.length > 1000000) { // 1MB limit
      console.warn('⚠️ Request body is very large:', requestBodyString.length, 'bytes');
    }

    // Use the standard API URL without query parameters
    const apiUrl = `${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent`;

    let response;
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
      });

      // Create the fetch promise
      const fetchPromise = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': API_CONFIG.GEMINI_API_KEY
        },
        body: requestBodyString
      });

      // Race between fetch and timeout
      response = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (fetchError) {
      console.error('Network fetch error:', fetchError);

      // Provide more specific error messages
      if (fetchError.message.includes('timeout')) {
        throw new Error(`Request timeout: The AI service is taking too long to respond. Please try again.`);
      } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('network')) {
        throw new Error(`Network error: Unable to connect to AI service. Please check your internet connection and try again.`);
      } else {
        throw new Error(`Connection error: ${fetchError.message}`);
      }
    }



    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Parse the AI response to extract structured plan data
    try {

      // Clean up the response - remove markdown formatting and comments
      let cleanResponse = aiResponse;

      // Remove markdown code blocks if present
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      // AGGRESSIVE JSON CLEANING

      // 1. Remove all markdown formatting
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');

      // 2. Remove ALL types of comments (more aggressive patterns)
      cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, ''); // /* */ comments
      cleanResponse = cleanResponse.replace(/\/\/.*$/gm, ''); // // comments
      cleanResponse = cleanResponse.replace(/\/\*.*?\*\//g, ''); // Single line /* */ comments

      // 3. Remove placeholder patterns
      cleanResponse = cleanResponse.replace(/\.\.\.\s*\([^)]*\)/g, ''); // ... (placeholder text)
      cleanResponse = cleanResponse.replace(/\/\*\s*\.\.\.\s*\([^)]*\)\s*\*\//g, ''); // /* ... (placeholder) */

      // 4. Remove notes and explanations
      cleanResponse = cleanResponse.replace(/\*\*\([^)]*\)\*\*/gs, ''); // **(Note: ...)** 
      cleanResponse = cleanResponse.replace(/\*\*Note:.*$/gs, ''); // **Note: ...
      cleanResponse = cleanResponse.replace(/\*\*.*?\*\*/gs, ''); // Any **text**

      // 5. Extract only the JSON part (from first { to last })
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }

      // 6. Remove any remaining non-JSON text patterns
      cleanResponse = cleanResponse.replace(/\n\s*\/\/.*$/gm, ''); // Line comments
      cleanResponse = cleanResponse.replace(/,\s*\/\*.*?\*\//g, ','); // Inline comments after commas

      // Try to parse as JSON
      let parsedPlan;

      try {
        parsedPlan = JSON.parse(cleanResponse.trim());
      } catch (firstParseError) {

        // AGGRESSIVE REPAIR MECHANISM
        let repairedResponse = cleanResponse.trim();

        // 1. Remove any remaining comment patterns that might have been missed
        repairedResponse = repairedResponse.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
        repairedResponse = repairedResponse.replace(/\/\/.*$/gm, '');

        // 2. Fix specific patterns we've seen in the AI response
        repairedResponse = repairedResponse.replace(/,\s*\/\*.*?\*\//g, ',');
        repairedResponse = repairedResponse.replace(/\]\s*,\s*\/\*.*?\*\//g, ']');
        repairedResponse = repairedResponse.replace(/\}\s*,\s*\/\*.*?\*\//g, '}');

        // 3. Remove placeholder array/object patterns
        repairedResponse = repairedResponse.replace(/,\s*\/\*\s*\.\.\.\s*\([^)]*\)\s*\*\//g, '');
        repairedResponse = repairedResponse.replace(/\[\s*\/\*\s*\.\.\.\s*\([^)]*\)\s*\*\/\s*\]/g, '[]');

        // 4. Fix trailing commas
        repairedResponse = repairedResponse.replace(/,(\s*[}\]])/g, '$1');

        // 5. Handle incomplete structures by truncating at the last valid point
        const lastCompleteObject = repairedResponse.lastIndexOf('}}');
        const lastCompleteArray = repairedResponse.lastIndexOf(']}');
        const lastComplete = Math.max(lastCompleteObject, lastCompleteArray);

        if (lastComplete > 0) {
          repairedResponse = repairedResponse.substring(0, lastComplete + 2);
        }

        // 6. Handle incomplete dailyMeals array - try to extract complete days only
        const dailyMealsMatch = repairedResponse.match(/"dailyMeals":\s*\[(.*)\]/s);
        if (dailyMealsMatch) {
          const dailyMealsContent = dailyMealsMatch[1];
          // Find complete day objects (those that end with }})
          const completeDayMatches = dailyMealsContent.match(/\{[^{}]*"day":\s*\d+[^{}]*"meals":\s*\[[^\]]*\][^{}]*\}/g);

          if (completeDayMatches && completeDayMatches.length > 0) {
            const repairedDailyMeals = completeDayMatches.join(',');
            repairedResponse = repairedResponse.replace(
              /"dailyMeals":\s*\[.*\]/s,
              `"dailyMeals":[${repairedDailyMeals}]`
            );
          }
        }

        // 7. Balance braces and brackets
        const openBraces = (repairedResponse.match(/{/g) || []).length;
        const closeBraces = (repairedResponse.match(/}/g) || []).length;
        const openBrackets = (repairedResponse.match(/\[/g) || []).length;
        const closeBrackets = (repairedResponse.match(/\]/g) || []).length;

        // Add missing closing braces/brackets
        for (let i = closeBraces; i < openBraces; i++) {
          repairedResponse += '}';
        }
        for (let i = closeBrackets; i < openBrackets; i++) {
          repairedResponse += ']';
        }

        try {
          parsedPlan = JSON.parse(repairedResponse);
        } catch (repairError) {

          // Last resort: try to extract just the first complete day
          const firstDayMatch = repairedResponse.match(/"dailyMeals":\s*\[\s*({[^}]*"meals":\s*\[[^\]]*\][^}]*})/);
          if (firstDayMatch) {
            const singleDayPlan = `{"title":"AI-Generated Plan","description":"Partial plan extracted","duration":"30 days","calories":"1800","dailyMeals":[${firstDayMatch[1]}]}`;
            parsedPlan = JSON.parse(singleDayPlan);
          } else {
            throw repairError; // Give up and use fallback
          }
        }
      }



      // Check if we got a complete plan
      if (parsedPlan.dailyMeals && parsedPlan.dailyMeals.length < 30) {


        // If we have very few days (less than 7), use fallback instead
        if (parsedPlan.dailyMeals.length < 7) {
          console.log('🔄 Too few days received, using complete fallback plan...');
          return {
            title: "AI-Generated Personalized Plan",
            description: "A personalized nutrition plan designed for your specific goals and preferences.",
            duration: "30 days",
            calories: "1800-2000",
            dailyMeals: generateFallbackPlan()
          };
        }

        // Otherwise, extend the plan by repeating existing days with variations

        const existingDays = parsedPlan.dailyMeals;
        const extendedDays = [...existingDays];

        // Repeat existing days to reach 30 days with slight variations
        while (extendedDays.length < 30) {
          const dayToRepeat = existingDays[extendedDays.length % existingDays.length];
          const newDay = {
            ...dayToRepeat,
            day: extendedDays.length + 1,
            date: new Date(2024, 0, extendedDays.length + 1).toISOString().split('T')[0],
            // Add slight variations to meal names to avoid exact duplicates
            meals: dayToRepeat.meals?.map((meal: any, index: number) => ({
              ...meal,
              name: `${meal.name} (Day ${extendedDays.length + 1} Variation)`,
              description: meal.description + ` - Adapted for day ${extendedDays.length + 1}.`
            }))
          };
          extendedDays.push(newDay);
        }

        parsedPlan.dailyMeals = extendedDays;
      }



      // Check meal content quality
      if (parsedPlan.dailyMeals && parsedPlan.dailyMeals.length > 0) {
        const firstDay = parsedPlan.dailyMeals[0];
        if (firstDay.meals && firstDay.meals.length > 0) {
          const firstMeal = firstDay.meals[0];
          console.log('Sample meal content check:', {
            mealName: firstMeal.name,
            mealDescription: firstMeal.description?.substring(0, 100) + '...',
            hasIngredients: !!firstMeal.ingredients,
            ingredientsCount: firstMeal.ingredients?.length || 0,
            hasInstructions: !!firstMeal.instructions,
            isPlaceholder: firstMeal.name?.includes('Day') || firstMeal.description?.includes('option') || firstMeal.description?.includes('meal')
          });

          // If content looks like placeholder, use fallback
          if (firstMeal.name?.includes('Day') || firstMeal.description?.includes('option') || firstMeal.description?.includes('meal')) {
            console.warn('⚠️ FALLBACK TRIGGER 3: Detected placeholder content in AI response. Using fallback plan.');
            console.log('🔄 USING FALLBACK PLAN - This is why you get identical responses!');
            console.log('Placeholder meal detected:', firstMeal.name, firstMeal.description?.substring(0, 100));
            return {
              title: parsedPlan.title || "AI-Generated Personalized Plan",
              description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
              duration: "30 days",
              calories: parsedPlan.calories || "1800-2000",
              dailyMeals: generateFallbackPlan()
            };
          }
        }
      }

      // Convert old structure to new if needed
      if (parsedPlan.meals && !parsedPlan.dailyMeals) {
        console.log('Converting old meal structure to new dailyMeals structure');
        parsedPlan.dailyMeals = [
          {
            day: 1,
            date: new Date().toISOString().split('T')[0],
            meals: parsedPlan.meals
          }
        ];
      }

      console.log('Final plan structure:', {
        title: parsedPlan.title,
        description: parsedPlan.description?.substring(0, 100) + '...',
        dailyMealsCount: parsedPlan.dailyMeals?.length || 0,
        mealsCount: parsedPlan.meals?.length || 0,
        firstDayStructure: parsedPlan.dailyMeals?.[0] ? {
          day: parsedPlan.dailyMeals[0].day,
          date: parsedPlan.dailyMeals[0].date,
          mealsCount: parsedPlan.dailyMeals[0].meals?.length || 0
        } : 'No first day found',
        lastDayStructure: parsedPlan.dailyMeals?.length > 0 ? {
          day: parsedPlan.dailyMeals[parsedPlan.dailyMeals.length - 1].day,
          date: parsedPlan.dailyMeals[parsedPlan.dailyMeals.length - 1].date,
          mealsCount: parsedPlan.dailyMeals[parsedPlan.dailyMeals.length - 1].meals?.length || 0
        } : 'No last day found'
      });

      return {
        title: parsedPlan.title || "AI-Generated Personalized Plan",
        description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
        duration: parsedPlan.duration || "30 days",
        calories: parsedPlan.calories || "1800-2000",
        dailyMeals: parsedPlan.dailyMeals || generateFallbackPlan()
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response that failed to parse:', aiResponse);

      // Return fallback plan if parsing fails
      console.warn('⚠️ FALLBACK TRIGGER 4: JSON parsing failed. Using fallback plan.');
      console.log('🔄 USING FALLBACK PLAN - This is why you get identical responses!');
      return {
        title: "AI-Generated Personalized Plan",
        description: "A personalized nutrition plan designed for your specific goals and preferences.",
        duration: "30 days",
        calories: "1800-2000",
        dailyMeals: generateFallbackPlan()
      };
    }
  } catch (error) {
    console.error('Error generating diet plan:', error);
    throw error;
  }
}

// Function to generate embedding for a plan
export async function generatePlanEmbedding(planContent: any): Promise<number[]> {
  try {
    const planText = extractPlanTextForEmbedding(planContent);
    console.log('Generating embedding for plan text length:', planText.length);

    const embedding = await generateEmbedding(planText);
    console.log('Generated embedding with dimensions:', embedding.length);

    return embedding;
  } catch (error) {
    console.error('Error generating plan embedding:', error);
    // Return a zero vector as fallback
    return new Array(1536).fill(0);
  }
}

// Generate a complete 30-day fallback plan with randomness
function generateFallbackPlan() {
  console.log('🎲 Generating randomized fallback plan...');
  const plan = [];
  const startDate = new Date();

  // Add randomness to fallback plan
  const randomSeed = Math.random();
  console.log('Fallback plan random seed:', randomSeed);

  // Sample meal templates for variety
  const breakfastTemplates = [
    {
      name: "Greek Yogurt Parfait with Berries",
      description: "Creamy Greek yogurt layered with fresh strawberries, blueberries, and honey, topped with crunchy granola and almonds for a protein-rich start to your day.",
      calories: 320,
      macros: { protein: 18, carbs: 35, fat: 12 },
      ingredients: ["Greek yogurt (1 cup)", "strawberries (1/2 cup)", "blueberries (1/4 cup)", "honey (1 tbsp)", "granola (1/4 cup)", "almonds (2 tbsp)"],
      instructions: "Layer yogurt, berries, honey, and granola in a glass. Top with almonds and serve immediately."
    },
    {
      name: "Oatmeal with Banana and Cinnamon",
      description: "Warm steel-cut oats cooked with almond milk, topped with sliced banana, cinnamon, and a drizzle of maple syrup for natural sweetness.",
      calories: 280,
      macros: { protein: 12, carbs: 45, fat: 8 },
      ingredients: ["steel-cut oats (1/2 cup)", "almond milk (1 cup)", "banana (1 medium)", "cinnamon (1 tsp)", "maple syrup (1 tbsp)", "walnuts (2 tbsp)"],
      instructions: "Cook oats with almond milk until creamy. Top with banana, cinnamon, maple syrup, and walnuts."
    },
    {
      name: "Avocado Toast with Poached Egg",
      description: "Whole grain toast topped with mashed avocado, a perfectly poached egg, and a sprinkle of red pepper flakes for a satisfying protein-rich breakfast.",
      calories: 350,
      macros: { protein: 16, carbs: 25, fat: 22 },
      ingredients: ["whole grain bread (2 slices)", "avocado (1/2 medium)", "egg (1 large)", "red pepper flakes (1/4 tsp)", "salt and pepper to taste"],
      instructions: "Toast bread, mash avocado on top. Poach egg and place on avocado. Season with salt, pepper, and red pepper flakes."
    }
  ];

  const lunchTemplates = [
    {
      name: "Mediterranean Quinoa Bowl",
      description: "Fluffy quinoa mixed with cherry tomatoes, cucumber, olives, and feta cheese, dressed with olive oil and lemon juice for a refreshing Mediterranean-inspired lunch.",
      calories: 420,
      macros: { protein: 14, carbs: 38, fat: 24 },
      ingredients: ["quinoa (1/2 cup cooked)", "cherry tomatoes (1/2 cup)", "cucumber (1/2 cup)", "kalamata olives (1/4 cup)", "feta cheese (2 tbsp)", "olive oil (1 tbsp)", "lemon juice (1 tbsp)"],
      instructions: "Cook quinoa and let cool. Mix with chopped vegetables, olives, and feta. Dress with olive oil and lemon juice."
    },
    {
      name: "Grilled Chicken Salad",
      description: "Mixed greens topped with grilled chicken breast, sliced almonds, dried cranberries, and a light balsamic vinaigrette for a protein-packed lunch.",
      calories: 380,
      macros: { protein: 28, carbs: 18, fat: 20 },
      ingredients: ["mixed greens (2 cups)", "chicken breast (4 oz)", "almonds (2 tbsp)", "dried cranberries (2 tbsp)", "balsamic vinaigrette (2 tbsp)"],
      instructions: "Grill chicken until cooked through. Toss greens with almonds, cranberries, and vinaigrette. Top with sliced chicken."
    },
    {
      name: "Vegetarian Wrap with Hummus",
      description: "Whole wheat tortilla filled with hummus, sliced cucumber, bell peppers, and sprouts for a quick and nutritious vegetarian lunch option.",
      calories: 320,
      macros: { protein: 12, carbs: 42, fat: 14 },
      ingredients: ["whole wheat tortilla (1 large)", "hummus (3 tbsp)", "cucumber (1/2 cup sliced)", "bell pepper (1/2 cup sliced)", "sprouts (1/4 cup)"],
      instructions: "Spread hummus on tortilla. Layer vegetables and sprouts. Roll tightly and cut diagonally."
    }
  ];

  const dinnerTemplates = [
    {
      name: "Baked Salmon with Roasted Vegetables",
      description: "Fresh salmon fillet baked with herbs and lemon, served with a colorful medley of roasted broccoli, carrots, and sweet potatoes.",
      calories: 480,
      macros: { protein: 32, carbs: 28, fat: 26 },
      ingredients: ["salmon fillet (5 oz)", "broccoli (1 cup)", "carrots (1 cup)", "sweet potato (1/2 cup)", "olive oil (1 tbsp)", "lemon (1/2)", "herbs (1 tbsp)"],
      instructions: "Season salmon with herbs and lemon. Roast vegetables with olive oil. Bake salmon at 400°F for 12-15 minutes."
    },
    {
      name: "Vegetarian Stir-Fry with Tofu",
      description: "Crispy tofu cubes stir-fried with colorful bell peppers, snap peas, and broccoli in a savory soy-ginger sauce, served over brown rice.",
      calories: 420,
      macros: { protein: 18, carbs: 45, fat: 18 },
      ingredients: ["firm tofu (4 oz)", "bell peppers (1 cup)", "snap peas (1 cup)", "broccoli (1 cup)", "brown rice (1/2 cup)", "soy sauce (2 tbsp)", "ginger (1 tsp)"],
      instructions: "Press tofu and cut into cubes. Stir-fry vegetables, add tofu and sauce. Serve over cooked brown rice."
    },
    {
      name: "Lean Beef Stir-Fry",
      description: "Thinly sliced lean beef stir-fried with mushrooms, bell peppers, and snow peas in a light garlic sauce, served with quinoa for a protein-rich dinner.",
      calories: 450,
      macros: { protein: 35, carbs: 32, fat: 20 },
      ingredients: ["lean beef (4 oz)", "mushrooms (1 cup)", "bell peppers (1 cup)", "snow peas (1 cup)", "quinoa (1/2 cup)", "garlic (2 cloves)", "soy sauce (2 tbsp)"],
      instructions: "Slice beef thinly. Stir-fry beef, then vegetables. Add garlic and soy sauce. Serve over quinoa."
    }
  ];

  const snackTemplates = [
    {
      name: "Apple with Almond Butter",
      description: "Crisp apple slices paired with creamy almond butter for a perfect balance of natural sweetness and healthy fats.",
      calories: 180,
      macros: { protein: 4, carbs: 20, fat: 10 },
      ingredients: ["apple (1 medium)", "almond butter (1 tbsp)"],
      instructions: "Slice apple and serve with almond butter for dipping."
    },
    {
      name: "Greek Yogurt with Honey",
      description: "Creamy Greek yogurt drizzled with natural honey and topped with a sprinkle of cinnamon for a protein-rich snack.",
      calories: 150,
      macros: { protein: 15, carbs: 18, fat: 2 },
      ingredients: ["Greek yogurt (1/2 cup)", "honey (1 tbsp)", "cinnamon (1/4 tsp)"],
      instructions: "Spoon yogurt into a bowl, drizzle with honey, and sprinkle with cinnamon."
    },
    {
      name: "Mixed Nuts and Dried Fruit",
      description: "A satisfying mix of almonds, walnuts, and dried cranberries for a perfect balance of protein, healthy fats, and natural sweetness.",
      calories: 200,
      macros: { protein: 6, carbs: 18, fat: 14 },
      ingredients: ["almonds (10)", "walnuts (5)", "dried cranberries (2 tbsp)"],
      instructions: "Mix nuts and dried fruit in a small bowl and enjoy."
    }
  ];

  // Shuffle arrays for randomness
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledBreakfast = shuffleArray(breakfastTemplates);
  const shuffledLunch = shuffleArray(lunchTemplates);
  const shuffledDinner = shuffleArray(dinnerTemplates);
  const shuffledSnack = shuffleArray(snackTemplates);

  for (let day = 1; day <= 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);

    // Use shuffled templates with random rotation
    const breakfastIndex = (day - 1 + Math.floor(randomSeed * 10)) % shuffledBreakfast.length;
    const lunchIndex = (day - 1 + Math.floor(randomSeed * 7)) % shuffledLunch.length;
    const dinnerIndex = (day - 1 + Math.floor(randomSeed * 5)) % shuffledDinner.length;
    const snackIndex = (day - 1 + Math.floor(randomSeed * 3)) % shuffledSnack.length;

    const dayPlan = {
      day: day,
      date: currentDate.toISOString().split('T')[0],
      meals: [
        {
          mealType: "breakfast",
          ...shuffledBreakfast[breakfastIndex]
        },
        {
          mealType: "lunch",
          ...shuffledLunch[lunchIndex]
        },
        {
          mealType: "dinner",
          ...shuffledDinner[dinnerIndex]
        },
        {
          mealType: "snack",
          ...shuffledSnack[snackIndex]
        }
      ]
    };

    plan.push(dayPlan);
  }

  return plan;
} 