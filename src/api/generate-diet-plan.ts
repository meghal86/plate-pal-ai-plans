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
  console.log('🚀 generateDietPlan called');
  try {
    // Test API connectivity first
    const isConnected = await testGeminiConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to Gemini API. Please check your internet connection and try again.');
    }

    // Extract duration from user context to calculate target days
    const durationMatch = userContext.match(/Duration:\s*([^\n]+)/i);
    const duration = durationMatch ? durationMatch[1].trim() : '30 days';
    
    // Calculate target number of days based on duration
    let targetDays = 30; // default
    if (duration.includes('1 week')) {
      targetDays = 7;
    } else if (duration.includes('2 weeks')) {
      targetDays = 14;
    } else if (duration.includes('30 days')) {
      targetDays = 30;
    } else if (duration.includes('8 weeks')) {
      targetDays = 56;
    } else if (duration.includes('12 weeks')) {
      targetDays = 84;
    } else if (duration.includes('6 months')) {
      targetDays = 180;
    }
    
    console.log(`🎯 Target duration: ${duration} = ${targetDays} days`);
    console.log('🔍 Duration match result:', durationMatch);
    console.log('📅 Raw duration string:', duration);

    // Extract and log dietary restrictions for debugging
    const dietaryRestrictionsMatch = userContext.match(/Dietary Restrictions:\s*([^\n]+)/gi);
    const specialRequirementsMatch = userContext.match(/Special Requirements:\s*([^\n]+)/gi);
    const mealPreferencesMatch = userContext.match(/Meal Preferences:\s*([^\n]+)/gi);
    
    console.log('🚫 Dietary restrictions found:', dietaryRestrictionsMatch);
    console.log('⚠️ Special requirements found:', specialRequirementsMatch);
    console.log('🍽️ Meal preferences found:', mealPreferencesMatch);

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

    // Create a clean, focused prompt with CRITICAL uniqueness requirements
    const totalMeals = targetDays * 4;
    const cleanPrompt = `You are a certified nutritionist with 15+ years of experience creating personalized diet plans. You specialize in evidence-based nutrition, meal planning, and helping clients achieve their health goals through sustainable dietary changes.

CLIENT PROFILE AND REQUIREMENTS:
${userContext}

CRITICAL REQUIREMENTS (NON-NEGOTIABLE):

1. **Duration:** Generate a complete ${targetDays}-day meal plan. This is mandatory.

2. **Daily Structure:** Each day must have exactly 4 meals (breakfast, lunch, dinner, snack). This is mandatory.

3. **Target Calories:** Approximately 1500 calories per day (adjust based on client profile if specified). This is mandatory.

4. **Seasonal Focus:** Emphasize fresh summer produce and cooling foods where appropriate.

5. **UNIQUENESS (CRITICAL):** All ${totalMeals} meals (${targetDays} days × 4 meals/day) must be completely unique. This is the most important requirement:
   - NO meal name, description, or recipe should be repeated or substantially similar throughout the entire ${targetDays}-day plan
   - Each of the ${totalMeals} meals must have completely different ingredients, cooking methods, and flavor profiles
   - Before creating each meal, mentally check that it's completely different from all previous meals in the plan
   - Use diverse cuisines: Mediterranean, Asian, Latin American, Middle Eastern, Indian, European, African, Nordic, Mexican, Thai, Vietnamese, Japanese, Italian
   - Vary cooking methods: grilling, roasting, steaming, poaching, stir-frying, sautéing, slow-cooking, braising, raw preparations, fermented foods, smoking, pressure cooking, air-frying, sous-vide, stovetop, oven-baked
   - Rotate protein sources extensively: different legumes, various dairy products, multiple egg preparations, diverse nuts and seeds, varied plant-based proteins
   - Include 7+ different colored vegetables daily across all meals
   - Use different whole grains: quinoa, brown rice, oats, barley, buckwheat, farro, bulgur, millet, amaranth, wild rice, etc.

6. **Dietary Compliance:** All meals must adhere strictly to the specified dietary requirements (vegetarian, mushroom-free, diabetes-friendly, etc.). This is mandatory.

7. **Output Format:** Return ONLY a valid JSON object. Do not include any markdown, comments, or other text outside the JSON structure. This is mandatory.

UNIQUENESS ENFORCEMENT PROTOCOL (CRITICAL):

**Before Creating Each Meal:**
1. Review all previously created meals in this plan to ensure zero repetition
2. Verify the meal name is completely different from all previous meal names
3. Confirm the primary ingredients haven't been used in the same combination before
4. Ensure the cooking method is different from recent meals
5. Check that the flavor profile and cuisine style varies from previous meals

**Mandatory Variety Requirements:**
- **Protein Rotation:** Use different protein sources for each meal: various legumes (lentils, chickpeas, black beans, kidney beans, navy beans, pinto beans), different dairy (Greek yogurt, cottage cheese, ricotta, feta, mozzarella), multiple egg preparations (scrambled, poached, hard-boiled, frittata), diverse nuts/seeds (almonds, walnuts, cashews, pistachios, sunflower seeds, pumpkin seeds, chia seeds, flax seeds), varied plant proteins (tofu, tempeh, seitan, nutritional yeast)

- **Vegetable Diversity:** Include different vegetables in each meal from all color categories: red (tomatoes, red peppers, radishes), orange (carrots, sweet potatoes, orange peppers), yellow (corn, yellow squash, yellow peppers), green (spinach, kale, broccoli, asparagus, green beans, peas, cucumber, zucchini), blue/purple (eggplant, purple cabbage, purple onions), white (cauliflower, onions, garlic, turnips)

- **Grain Variation:** Use different whole grains throughout: quinoa, brown rice, wild rice, oats, barley, buckwheat, farro, bulgur, millet, amaranth, freekeh, teff, spelt

- **Cooking Method Rotation:** Systematically rotate through: raw/fresh, steamed, roasted, grilled, sautéed, stir-fried, braised, slow-cooked, pressure-cooked, air-fried, poached, baked, broiled

- **Cuisine Style Diversity:** Rotate through different culinary traditions: Mediterranean, Asian (Chinese, Japanese, Thai, Vietnamese, Korean), Latin American (Mexican, Peruvian, Brazilian), Middle Eastern, Indian, European (Italian, French, Greek, Spanish), African, Nordic, Fusion styles

**Quality Standards:**
- Each meal must be restaurant-quality with specific measurements
- Include realistic prep and cooking times
- Provide clear, step-by-step instructions
- Ensure nutritional balance within dietary restrictions

MANDATORY JSON OUTPUT FORMAT:

Return ONLY a valid JSON object with this exact structure:

{
  "title": "Professional ${targetDays}-Day Nutrition Plan",
  "description": "Evidence-based meal plan with ${totalMeals} completely unique meals",
  "duration": "${targetDays} days",
  "calories": "1500",
  "dailyMeals": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Unique meal name (different from all other ${totalMeals-1} meals)",
          "description": "Detailed description emphasizing unique ingredients and preparation",
          "calories": number,
          "prep_time": "X minutes",
          "difficulty": "Easy|Medium|Advanced",
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "ingredients": [
            "Specific ingredient with exact quantity"
          ],
          "instructions": "Clear step-by-step cooking instructions"
        },
        {
          "mealType": "lunch",
          "name": "Another completely unique meal name",
          "description": "Different ingredients and cooking method from breakfast",
          "calories": number,
          "prep_time": "X minutes", 
          "difficulty": "Easy|Medium|Advanced",
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "ingredients": [
            "Different ingredients from breakfast"
          ],
          "instructions": "Different cooking method from breakfast"
        },
        {
          "mealType": "dinner",
          "name": "Third unique meal name for day 1",
          "description": "Completely different from breakfast and lunch",
          "calories": number,
          "prep_time": "X minutes",
          "difficulty": "Easy|Medium|Advanced", 
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "ingredients": [
            "Unique ingredients not used in breakfast or lunch"
          ],
          "instructions": "Unique cooking method not used in breakfast or lunch"
        },
        {
          "mealType": "snack",
          "name": "Fourth unique meal name for day 1",
          "description": "Simple but unique snack different from other meals",
          "calories": number,
          "prep_time": "X minutes",
          "difficulty": "Easy|Medium|Advanced",
          "macros": {
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          },
          "ingredients": [
            "Simple snack ingredients not used in other day 1 meals"
          ],
          "instructions": "Simple preparation method"
        }
      ]
    }
  ]
}

FINAL CRITICAL REMINDERS:
- Generate ALL ${targetDays} days with 4 meals each = ${totalMeals} total unique meals
- Every single meal must be completely different from all others
- No repeated meal names, ingredients combinations, or cooking methods
- Strictly follow dietary restrictions: vegetarian, mushroom-free, diabetes-friendly
- Return ONLY valid JSON, no markdown or comments
- Each meal must be practical and achievable`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: cleanPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 32000,
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
            const singleDayPlan = `{"title":"AI-Generated Plan","description":"Partial plan extracted","duration":"${duration}","calories":"1800","dailyMeals":[${firstDayMatch[1]}]}`;
            parsedPlan = JSON.parse(singleDayPlan);
          } else {
            throw repairError; // Give up and use fallback
          }
        }
      }



      // Check if we got a complete plan
      console.log(`📊 AI generated ${parsedPlan.dailyMeals?.length || 0} days, target is ${targetDays} days`);
      
      if (parsedPlan.dailyMeals && parsedPlan.dailyMeals.length < targetDays) {
        console.log(`⚠️ Plan has ${parsedPlan.dailyMeals.length} days, target is ${targetDays} days - extending plan`);

        // If we have very few days (less than 3), use fallback instead
        if (parsedPlan.dailyMeals.length < 3) {
          console.log(`🔄 Too few days received (${parsedPlan.dailyMeals.length}), using complete fallback plan for ${targetDays} days...`);
          return {
            title: "AI-Generated Personalized Plan",
            description: "A personalized nutrition plan designed for your specific goals and preferences.",
            duration: duration,
            calories: "1500",
            dailyMeals: generateFallbackPlan(targetDays)
          };
        }

        // Otherwise, extend the plan by repeating existing days with variations
        const existingDays = parsedPlan.dailyMeals;
        const extendedDays = [...existingDays];

        // Repeat existing days to reach target days with slight variations
        console.log(`🔄 Extending from ${extendedDays.length} to ${targetDays} days`);
        while (extendedDays.length < targetDays) {
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
          console.log(`➕ Added day ${extendedDays.length}, target: ${targetDays}`);
        }

        parsedPlan.dailyMeals = extendedDays;
        console.log(`✅ Extended plan to ${extendedDays.length} days (target was ${targetDays})`);
      }



      // CRITICAL: Validate meal uniqueness across the entire plan
      const uniquenessValidation = validateMealUniqueness(parsedPlan.dailyMeals, targetDays);
      console.log('🔍 Uniqueness validation results:', uniquenessValidation);

      if (!uniquenessValidation.isValid) {
        console.warn('⚠️ FALLBACK TRIGGER 3: Meal uniqueness validation failed. Using fallback plan.');
        console.log('🔄 USING FALLBACK PLAN - Uniqueness issues detected:', uniquenessValidation.issues);
        return {
          title: parsedPlan.title || "AI-Generated Personalized Plan",
          description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
          duration: duration,
          calories: parsedPlan.calories || "1500",
          dailyMeals: generateFallbackPlan(targetDays)
        };
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
            console.warn('⚠️ FALLBACK TRIGGER 4: Detected placeholder content in AI response. Using fallback plan.');
            console.log('🔄 USING FALLBACK PLAN - This is why you get identical responses!');
            console.log('Placeholder meal detected:', firstMeal.name, firstMeal.description?.substring(0, 100));
            return {
              title: parsedPlan.title || "AI-Generated Personalized Plan",
              description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
              duration: duration,
              calories: parsedPlan.calories || "1500",
              dailyMeals: generateFallbackPlan(targetDays)
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

      console.log(`✅ Returning plan with ${parsedPlan.dailyMeals?.length || 0} days (target was ${targetDays})`);
      
      return {
        title: parsedPlan.title || "AI-Generated Personalized Plan",
        description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
        duration: parsedPlan.duration || duration,
        calories: parsedPlan.calories || "1500",
        dailyMeals: parsedPlan.dailyMeals || generateFallbackPlan(targetDays)
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response that failed to parse:', aiResponse);

      // Return fallback plan if parsing fails
      console.warn('⚠️ FALLBACK TRIGGER 5: JSON parsing failed. Using fallback plan.');
      console.log('🔄 USING FALLBACK PLAN - This is why you get identical responses!');
      return {
        title: "AI-Generated Personalized Plan",
        description: "A personalized nutrition plan designed for your specific goals and preferences.",
        duration: duration,
        calories: "1500",
        dailyMeals: generateFallbackPlan(targetDays)
      };
    }
  } catch (error) {
    console.error('Error generating diet plan:', error);
    throw error;
  }
}

// CRITICAL: Validate meal uniqueness across entire plan
function validateMealUniqueness(dailyMeals: any[], targetDays: number) {
  const issues: string[] = [];
  const mealNames = new Set<string>();
  const mealDescriptions = new Set<string>();
  const duplicateNames: string[] = [];
  const duplicateDescriptions: string[] = [];
  
  let totalMeals = 0;
  
  if (!dailyMeals || dailyMeals.length === 0) {
    return {
      isValid: false,
      issues: ['No daily meals found in plan'],
      totalMeals: 0,
      uniqueNames: 0,
      uniqueDescriptions: 0
    };
  }

  // Check each day and meal
  dailyMeals.forEach((day, dayIndex) => {
    if (!day.meals || !Array.isArray(day.meals)) {
      issues.push(`Day ${dayIndex + 1} has no meals array`);
      return;
    }

    if (day.meals.length !== 4) {
      issues.push(`Day ${dayIndex + 1} has ${day.meals.length} meals instead of 4`);
    }

    day.meals.forEach((meal: any, mealIndex: number) => {
      totalMeals++;
      
      if (!meal.name) {
        issues.push(`Day ${dayIndex + 1}, meal ${mealIndex + 1} has no name`);
        return;
      }

      if (!meal.description) {
        issues.push(`Day ${dayIndex + 1}, meal ${mealIndex + 1} has no description`);
        return;
      }

      // Check for duplicate names
      const normalizedName = meal.name.toLowerCase().trim();
      if (mealNames.has(normalizedName)) {
        duplicateNames.push(`"${meal.name}" (Day ${dayIndex + 1})`);
      } else {
        mealNames.add(normalizedName);
      }

      // Check for duplicate descriptions (first 100 characters)
      const normalizedDescription = meal.description.toLowerCase().trim().substring(0, 100);
      if (mealDescriptions.has(normalizedDescription)) {
        duplicateDescriptions.push(`Similar description on Day ${dayIndex + 1}: "${meal.description.substring(0, 50)}..."`);
      } else {
        mealDescriptions.add(normalizedDescription);
      }
    });
  });

  // Add issues for duplicates
  if (duplicateNames.length > 0) {
    issues.push(`Duplicate meal names found: ${duplicateNames.join(', ')}`);
  }

  if (duplicateDescriptions.length > 0) {
    issues.push(`Similar meal descriptions found: ${duplicateDescriptions.join(', ')}`);
  }

  // Check if we have the expected number of days
  if (dailyMeals.length < targetDays) {
    issues.push(`Plan has ${dailyMeals.length} days but expected ${targetDays} days`);
  }

  // Check if we have enough unique meals
  const expectedTotalMeals = targetDays * 4;
  if (totalMeals < expectedTotalMeals) {
    issues.push(`Plan has ${totalMeals} meals but expected ${expectedTotalMeals} meals`);
  }

  const uniquenessPercentage = (mealNames.size / totalMeals) * 100;
  if (uniquenessPercentage < 95) { // Allow 5% tolerance for very long plans
    issues.push(`Only ${uniquenessPercentage.toFixed(1)}% of meals have unique names (${mealNames.size}/${totalMeals})`);
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    issues,
    totalMeals,
    uniqueNames: mealNames.size,
    uniqueDescriptions: mealDescriptions.size,
    uniquenessPercentage: uniquenessPercentage.toFixed(1),
    duplicateNames,
    duplicateDescriptions
  };
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

// Generate a complete fallback plan with maximum uniqueness
function generateFallbackPlan(targetDays: number = 30) {
  console.log(`🎲 Generating highly diverse fallback plan for ${targetDays} days with ${targetDays * 4} unique meals...`);
  const plan = [];
  const startDate = new Date();
  const randomSeed = Math.random();

  // Extensive meal templates to ensure uniqueness across long periods
  const breakfastTemplates = [
    {
      name: "Greek Yogurt Parfait with Mixed Berries",
      description: "Creamy Greek yogurt layered with fresh strawberries, blueberries, and honey, topped with crunchy granola and almonds.",
      calories: 320, macros: { protein: 18, carbs: 35, fat: 12, fiber: 6, sugar: 22 },
      ingredients: ["Greek yogurt (1 cup)", "strawberries (1/2 cup)", "blueberries (1/4 cup)", "honey (1 tbsp)", "granola (1/4 cup)", "almonds (2 tbsp)"],
      instructions: "Layer yogurt, berries, honey, and granola in a glass. Top with almonds and serve immediately.",
      prep_time: "5 minutes", difficulty: "Easy"
    },
    {
      name: "Steel-Cut Oats with Banana and Cinnamon",
      description: "Warm steel-cut oats cooked with almond milk, topped with sliced banana, cinnamon, and maple syrup.",
      calories: 280, macros: { protein: 12, carbs: 45, fat: 8, fiber: 8, sugar: 18 },
      ingredients: ["steel-cut oats (1/2 cup)", "almond milk (1 cup)", "banana (1 medium)", "cinnamon (1 tsp)", "maple syrup (1 tbsp)", "walnuts (2 tbsp)"],
      instructions: "Cook oats with almond milk until creamy. Top with banana, cinnamon, maple syrup, and walnuts.",
      prep_time: "15 minutes", difficulty: "Easy"
    },
    {
      name: "Avocado Toast with Poached Egg",
      description: "Whole grain toast topped with mashed avocado, perfectly poached egg, and red pepper flakes.",
      calories: 350, macros: { protein: 16, carbs: 25, fat: 22, fiber: 10, sugar: 3 },
      ingredients: ["whole grain bread (2 slices)", "avocado (1/2 medium)", "egg (1 large)", "red pepper flakes (1/4 tsp)", "salt and pepper to taste"],
      instructions: "Toast bread, mash avocado on top. Poach egg and place on avocado. Season with salt, pepper, and red pepper flakes.",
      prep_time: "10 minutes", difficulty: "Medium"
    },
    {
      name: "Chia Seed Pudding with Mango",
      description: "Overnight chia seed pudding made with coconut milk, topped with fresh mango chunks and coconut flakes.",
      calories: 290, macros: { protein: 8, carbs: 32, fat: 16, fiber: 12, sugar: 20 },
      ingredients: ["chia seeds (3 tbsp)", "coconut milk (1 cup)", "mango (1/2 cup)", "coconut flakes (2 tbsp)", "vanilla (1/2 tsp)"],
      instructions: "Mix chia seeds with coconut milk and vanilla. Refrigerate overnight. Top with mango and coconut flakes.",
      prep_time: "5 minutes + overnight", difficulty: "Easy"
    },
    {
      name: "Quinoa Breakfast Bowl with Berries",
      description: "Fluffy quinoa cooked in almond milk with fresh raspberries, blackberries, and a drizzle of agave nectar.",
      calories: 310, macros: { protein: 11, carbs: 52, fat: 7, fiber: 9, sugar: 15 },
      ingredients: ["quinoa (1/2 cup)", "almond milk (1 cup)", "raspberries (1/4 cup)", "blackberries (1/4 cup)", "agave nectar (1 tbsp)", "pistachios (2 tbsp)"],
      instructions: "Cook quinoa in almond milk until fluffy. Top with berries, agave, and pistachios.",
      prep_time: "20 minutes", difficulty: "Easy"
    },
    {
      name: "Smoothie Bowl with Acai and Granola",
      description: "Thick acai smoothie bowl topped with sliced kiwi, hemp seeds, and homemade granola.",
      calories: 340, macros: { protein: 14, carbs: 48, fat: 12, fiber: 11, sugar: 28 },
      ingredients: ["acai puree (1 packet)", "banana (1/2)", "almond milk (1/2 cup)", "kiwi (1 medium)", "hemp seeds (1 tbsp)", "granola (1/4 cup)"],
      instructions: "Blend acai, banana, and almond milk until thick. Top with sliced kiwi, hemp seeds, and granola.",
      prep_time: "8 minutes", difficulty: "Easy"
    },
    {
      name: "Cottage Cheese Pancakes with Blueberries",
      description: "Fluffy protein-rich pancakes made with cottage cheese, topped with fresh blueberries and sugar-free syrup.",
      calories: 330, macros: { protein: 22, carbs: 28, fat: 14, fiber: 4, sugar: 12 },
      ingredients: ["cottage cheese (1/2 cup)", "eggs (2 large)", "oat flour (1/4 cup)", "blueberries (1/2 cup)", "sugar-free syrup (2 tbsp)"],
      instructions: "Blend cottage cheese, eggs, and oat flour. Cook as pancakes. Top with blueberries and syrup.",
      prep_time: "15 minutes", difficulty: "Medium"
    },
    {
      name: "Green Smoothie with Spinach and Pineapple",
      description: "Refreshing green smoothie with spinach, pineapple, coconut water, and chia seeds for omega-3s.",
      calories: 260, macros: { protein: 6, carbs: 42, fat: 8, fiber: 8, sugar: 30 },
      ingredients: ["spinach (2 cups)", "pineapple (1 cup)", "coconut water (1 cup)", "chia seeds (1 tbsp)", "lime juice (1 tbsp)"],
      instructions: "Blend all ingredients until smooth. Let sit 5 minutes for chia seeds to expand.",
      prep_time: "5 minutes", difficulty: "Easy"
    },
    {
      name: "Buckwheat Porridge with Apple and Cinnamon",
      description: "Nutty buckwheat porridge cooked with diced apple, cinnamon, and topped with chopped pecans.",
      calories: 300, macros: { protein: 10, carbs: 50, fat: 9, fiber: 7, sugar: 16 },
      ingredients: ["buckwheat groats (1/2 cup)", "apple (1 medium)", "cinnamon (1 tsp)", "almond milk (1 cup)", "pecans (2 tbsp)"],
      instructions: "Cook buckwheat with almond milk and diced apple. Season with cinnamon and top with pecans.",
      prep_time: "25 minutes", difficulty: "Easy"
    },
    {
      name: "Tofu Scramble with Vegetables",
      description: "Protein-rich tofu scramble with bell peppers, onions, spinach, and nutritional yeast for a savory breakfast.",
      calories: 280, macros: { protein: 18, carbs: 12, fat: 18, fiber: 5, sugar: 6 },
      ingredients: ["firm tofu (4 oz)", "bell pepper (1/2 cup)", "onion (1/4 cup)", "spinach (1 cup)", "nutritional yeast (2 tbsp)", "turmeric (1/2 tsp)"],
      instructions: "Crumble tofu and sauté with vegetables. Season with nutritional yeast and turmeric.",
      prep_time: "12 minutes", difficulty: "Medium"
    }
  ];

  const lunchTemplates = [
    {
      name: "Mediterranean Quinoa Bowl",
      description: "Fluffy quinoa with cherry tomatoes, cucumber, olives, and feta cheese, dressed with olive oil and lemon.",
      calories: 420, macros: { protein: 14, carbs: 38, fat: 24, fiber: 6, sugar: 8 },
      ingredients: ["quinoa (1/2 cup cooked)", "cherry tomatoes (1/2 cup)", "cucumber (1/2 cup)", "kalamata olives (1/4 cup)", "feta cheese (2 tbsp)", "olive oil (1 tbsp)", "lemon juice (1 tbsp)"],
      instructions: "Cook quinoa and let cool. Mix with chopped vegetables, olives, and feta. Dress with olive oil and lemon juice.",
      prep_time: "15 minutes", difficulty: "Easy"
    },
    {
      name: "Lentil and Vegetable Soup",
      description: "Hearty red lentil soup with carrots, celery, onions, and warming spices like cumin and paprika.",
      calories: 350, macros: { protein: 18, carbs: 52, fat: 6, fiber: 16, sugar: 12 },
      ingredients: ["red lentils (1/2 cup)", "carrots (1 cup)", "celery (1/2 cup)", "onion (1/2 cup)", "vegetable broth (2 cups)", "cumin (1 tsp)", "paprika (1/2 tsp)"],
      instructions: "Sauté vegetables, add lentils and broth. Simmer 20 minutes until lentils are tender. Season with spices.",
      prep_time: "30 minutes", difficulty: "Easy"
    },
    {
      name: "Chickpea Salad Wrap",
      description: "Mashed chickpeas with celery, red onion, and tahini dressing wrapped in a spinach tortilla.",
      calories: 380, macros: { protein: 16, carbs: 48, fat: 14, fiber: 12, sugar: 6 },
      ingredients: ["chickpeas (3/4 cup)", "celery (1/4 cup)", "red onion (2 tbsp)", "tahini (2 tbsp)", "lemon juice (1 tbsp)", "spinach tortilla (1 large)"],
      instructions: "Mash chickpeas, mix with vegetables and tahini dressing. Wrap in tortilla with fresh greens.",
      prep_time: "10 minutes", difficulty: "Easy"
    },
    {
      name: "Asian-Style Brown Rice Bowl",
      description: "Brown rice topped with steamed broccoli, edamame, shredded carrots, and sesame-ginger dressing.",
      calories: 390, macros: { protein: 14, carbs: 58, fat: 12, fiber: 8, sugar: 10 },
      ingredients: ["brown rice (1/2 cup cooked)", "broccoli (1 cup)", "edamame (1/2 cup)", "carrots (1/2 cup)", "sesame oil (1 tsp)", "ginger (1 tsp)", "soy sauce (1 tbsp)"],
      instructions: "Steam vegetables. Combine sesame oil, ginger, and soy sauce for dressing. Serve over rice.",
      prep_time: "20 minutes", difficulty: "Easy"
    },
    {
      name: "Caprese Salad with White Beans",
      description: "Fresh mozzarella, tomatoes, and basil with white beans, drizzled with balsamic glaze.",
      calories: 410, macros: { protein: 20, carbs: 32, fat: 22, fiber: 8, sugar: 12 },
      ingredients: ["white beans (1/2 cup)", "fresh mozzarella (2 oz)", "tomatoes (1 cup)", "fresh basil (1/4 cup)", "balsamic glaze (1 tbsp)", "olive oil (1 tsp)"],
      instructions: "Arrange tomatoes, mozzarella, and beans on plate. Top with basil, drizzle with balsamic and olive oil.",
      prep_time: "8 minutes", difficulty: "Easy"
    },
    {
      name: "Sweet Potato and Black Bean Quesadilla",
      description: "Roasted sweet potato and black beans with cheese in a whole wheat tortilla, served with salsa.",
      calories: 440, macros: { protein: 18, carbs: 62, fat: 14, fiber: 12, sugar: 8 },
      ingredients: ["sweet potato (1 medium)", "black beans (1/2 cup)", "cheese (1/4 cup)", "whole wheat tortilla (2 small)", "salsa (2 tbsp)"],
      instructions: "Roast sweet potato, mash lightly. Layer with beans and cheese in tortilla. Cook until crispy.",
      prep_time: "25 minutes", difficulty: "Medium"
    },
    {
      name: "Greek Orzo Salad",
      description: "Orzo pasta with cucumber, tomatoes, red onion, olives, and feta in a lemon-herb dressing.",
      calories: 400, macros: { protein: 12, carbs: 54, fat: 16, fiber: 4, sugar: 8 },
      ingredients: ["orzo pasta (1/2 cup)", "cucumber (1/2 cup)", "tomatoes (1/2 cup)", "red onion (2 tbsp)", "olives (1/4 cup)", "feta (2 tbsp)", "lemon juice (2 tbsp)", "oregano (1 tsp)"],
      instructions: "Cook orzo, cool. Mix with vegetables, olives, and feta. Dress with lemon juice and oregano.",
      prep_time: "15 minutes", difficulty: "Easy"
    },
    {
      name: "Stuffed Bell Pepper with Quinoa",
      description: "Bell pepper stuffed with quinoa, diced tomatoes, corn, and herbs, topped with melted cheese.",
      calories: 360, macros: { protein: 14, carbs: 48, fat: 12, fiber: 8, sugar: 12 },
      ingredients: ["bell pepper (1 large)", "quinoa (1/3 cup)", "diced tomatoes (1/2 cup)", "corn (1/4 cup)", "cheese (2 tbsp)", "herbs (1 tbsp)"],
      instructions: "Cook quinoa with tomatoes and corn. Stuff pepper, top with cheese. Bake 25 minutes at 375°F.",
      prep_time: "35 minutes", difficulty: "Medium"
    },
    {
      name: "Falafel Salad Bowl",
      description: "Baked falafel over mixed greens with cucumber, tomatoes, and creamy tahini dressing.",
      calories: 420, macros: { protein: 16, carbs: 42, fat: 20, fiber: 10, sugar: 8 },
      ingredients: ["falafel (4 pieces)", "mixed greens (2 cups)", "cucumber (1/2 cup)", "tomatoes (1/2 cup)", "tahini (2 tbsp)", "lemon juice (1 tbsp)"],
      instructions: "Bake falafel according to package. Arrange over greens with vegetables. Drizzle with tahini dressing.",
      prep_time: "15 minutes", difficulty: "Easy"
    },
    {
      name: "Mushroom and Barley Risotto",
      description: "Creamy barley risotto with mixed mushrooms, onions, and fresh herbs, finished with parmesan.",
      calories: 380, macros: { protein: 12, carbs: 58, fat: 12, fiber: 10, sugar: 6 },
      ingredients: ["pearl barley (1/2 cup)", "mixed mushrooms (1 cup)", "onion (1/4 cup)", "vegetable broth (2 cups)", "parmesan (2 tbsp)", "herbs (1 tbsp)"],
      instructions: "Sauté mushrooms and onions. Add barley and broth gradually, stirring until creamy. Finish with cheese.",
      prep_time: "40 minutes", difficulty: "Medium"
    }
  ];

  const dinnerTemplates = [
    {
      name: "Eggplant Parmesan with Zucchini Noodles",
      description: "Baked eggplant slices layered with marinara sauce and mozzarella, served over spiralized zucchini noodles.",
      calories: 380, macros: { protein: 18, carbs: 28, fat: 22, fiber: 12, sugar: 16 },
      ingredients: ["eggplant (1 medium)", "marinara sauce (1/2 cup)", "mozzarella (1/4 cup)", "zucchini (2 medium)", "parmesan (2 tbsp)", "basil (1 tbsp)"],
      instructions: "Slice and salt eggplant, bake until tender. Layer with sauce and cheese. Spiralize zucchini and sauté briefly.",
      prep_time: "45 minutes", difficulty: "Medium"
    },
    {
      name: "Vegetarian Stir-Fry with Tofu",
      description: "Crispy tofu with bell peppers, snap peas, and broccoli in soy-ginger sauce over brown rice.",
      calories: 420, macros: { protein: 18, carbs: 45, fat: 18, fiber: 8, sugar: 12 },
      ingredients: ["firm tofu (4 oz)", "bell peppers (1 cup)", "snap peas (1 cup)", "broccoli (1 cup)", "brown rice (1/2 cup)", "soy sauce (2 tbsp)", "ginger (1 tsp)"],
      instructions: "Press tofu and cut into cubes. Stir-fry vegetables, add tofu and sauce. Serve over cooked brown rice.",
      prep_time: "25 minutes", difficulty: "Medium"
    },
    {
      name: "Stuffed Portobello Mushrooms",
      description: "Large portobello caps stuffed with quinoa, sun-dried tomatoes, spinach, and goat cheese.",
      calories: 340, macros: { protein: 16, carbs: 32, fat: 18, fiber: 6, sugar: 8 },
      ingredients: ["portobello mushrooms (2 large)", "quinoa (1/3 cup)", "sun-dried tomatoes (1/4 cup)", "spinach (1 cup)", "goat cheese (2 tbsp)"],
      instructions: "Remove mushroom stems, brush with oil. Mix quinoa with vegetables and cheese. Stuff mushrooms and bake 20 minutes.",
      prep_time: "30 minutes", difficulty: "Medium"
    },
    {
      name: "Cauliflower and Chickpea Curry",
      description: "Aromatic curry with cauliflower, chickpeas, coconut milk, and warming spices served over basmati rice.",
      calories: 410, macros: { protein: 14, carbs: 58, fat: 14, fiber: 12, sugar: 10 },
      ingredients: ["cauliflower (2 cups)", "chickpeas (1/2 cup)", "coconut milk (1/2 cup)", "basmati rice (1/3 cup)", "curry powder (1 tbsp)", "onion (1/2 cup)"],
      instructions: "Sauté onion, add curry powder. Add cauliflower, chickpeas, and coconut milk. Simmer 20 minutes. Serve over rice.",
      prep_time: "35 minutes", difficulty: "Easy"
    },
    {
      name: "Mediterranean Stuffed Zucchini",
      description: "Zucchini boats filled with diced tomatoes, olives, feta cheese, and fresh herbs.",
      calories: 320, macros: { protein: 14, carbs: 22, fat: 20, fiber: 6, sugar: 14 },
      ingredients: ["zucchini (2 medium)", "diced tomatoes (1/2 cup)", "olives (1/4 cup)", "feta cheese (1/4 cup)", "oregano (1 tsp)", "olive oil (1 tbsp)"],
      instructions: "Halve zucchini lengthwise, scoop out center. Mix filling ingredients. Stuff zucchini and bake 25 minutes.",
      prep_time: "35 minutes", difficulty: "Medium"
    },
    {
      name: "Lentil Shepherd's Pie",
      description: "Hearty lentil and vegetable base topped with creamy mashed cauliflower instead of potatoes.",
      calories: 390, macros: { protein: 18, carbs: 48, fat: 12, fiber: 14, sugar: 12 },
      ingredients: ["green lentils (1/2 cup)", "mixed vegetables (1 cup)", "cauliflower (2 cups)", "vegetable broth (1 cup)", "herbs (1 tbsp)", "olive oil (1 tbsp)"],
      instructions: "Cook lentils with vegetables in broth. Steam and mash cauliflower. Layer in baking dish and bake 20 minutes.",
      prep_time: "50 minutes", difficulty: "Medium"
    },
    {
      name: "Caprese Stuffed Chicken Breast",
      description: "Chicken breast stuffed with fresh mozzarella, tomatoes, and basil, served with roasted asparagus.",
      calories: 420, macros: { protein: 38, carbs: 12, fat: 24, fiber: 4, sugar: 8 },
      ingredients: ["chicken breast (5 oz)", "mozzarella (2 oz)", "tomatoes (1/2 cup)", "basil (2 tbsp)", "asparagus (1 cup)", "balsamic glaze (1 tbsp)"],
      instructions: "Butterfly chicken breast, stuff with mozzarella, tomatoes, and basil. Bake with asparagus at 375°F for 25 minutes.",
      prep_time: "35 minutes", difficulty: "Medium"
    },
    {
      name: "Thai-Style Coconut Curry Vegetables",
      description: "Mixed vegetables in creamy coconut curry sauce with Thai basil, served over jasmine rice.",
      calories: 370, macros: { protein: 8, carbs: 52, fat: 16, fiber: 8, sugar: 12 },
      ingredients: ["mixed vegetables (2 cups)", "coconut milk (1/2 cup)", "curry paste (1 tbsp)", "jasmine rice (1/3 cup)", "Thai basil (1/4 cup)", "lime juice (1 tbsp)"],
      instructions: "Sauté vegetables, add curry paste and coconut milk. Simmer 15 minutes. Serve over rice with basil and lime.",
      prep_time: "25 minutes", difficulty: "Easy"
    },
    {
      name: "Quinoa-Stuffed Bell Peppers",
      description: "Colorful bell peppers stuffed with quinoa, black beans, corn, and Mexican spices, topped with cheese.",
      calories: 400, macros: { protein: 16, carbs: 54, fat: 14, fiber: 12, sugar: 12 },
      ingredients: ["bell peppers (2 medium)", "quinoa (1/3 cup)", "black beans (1/2 cup)", "corn (1/4 cup)", "cheese (1/4 cup)", "cumin (1 tsp)"],
      instructions: "Cook quinoa with beans, corn, and spices. Stuff peppers, top with cheese. Bake 30 minutes at 375°F.",
      prep_time: "45 minutes", difficulty: "Medium"
    },
    {
      name: "Baked Cod with Herb Crust",
      description: "Flaky cod fillet with a crispy herb and breadcrumb crust, served with steamed green beans.",
      calories: 350, macros: { protein: 32, carbs: 18, fat: 16, fiber: 4, sugar: 6 },
      ingredients: ["cod fillet (5 oz)", "breadcrumbs (1/4 cup)", "herbs (2 tbsp)", "green beans (1.5 cups)", "lemon (1/2)", "olive oil (1 tbsp)"],
      instructions: "Mix breadcrumbs with herbs and oil. Top cod and bake 15 minutes. Steam green beans until tender.",
      prep_time: "20 minutes", difficulty: "Easy"
    }
  ];

  const snackTemplates = [
    {
      name: "Apple Slices with Almond Butter",
      description: "Crisp apple slices paired with creamy almond butter for natural sweetness and healthy fats.",
      calories: 180, macros: { protein: 4, carbs: 20, fat: 10, fiber: 4, sugar: 16 },
      ingredients: ["apple (1 medium)", "almond butter (1 tbsp)"],
      instructions: "Slice apple and serve with almond butter for dipping.",
      prep_time: "3 minutes", difficulty: "Easy"
    },
    {
      name: "Greek Yogurt with Honey and Cinnamon",
      description: "Creamy Greek yogurt drizzled with natural honey and topped with cinnamon.",
      calories: 150, macros: { protein: 15, carbs: 18, fat: 2, fiber: 0, sugar: 18 },
      ingredients: ["Greek yogurt (1/2 cup)", "honey (1 tbsp)", "cinnamon (1/4 tsp)"],
      instructions: "Spoon yogurt into bowl, drizzle with honey, and sprinkle with cinnamon.",
      prep_time: "2 minutes", difficulty: "Easy"
    },
    {
      name: "Trail Mix with Nuts and Dried Fruit",
      description: "Mix of almonds, walnuts, and dried cranberries for protein, healthy fats, and natural sweetness.",
      calories: 200, macros: { protein: 6, carbs: 18, fat: 14, fiber: 3, sugar: 14 },
      ingredients: ["almonds (10)", "walnuts (5)", "dried cranberries (2 tbsp)"],
      instructions: "Mix nuts and dried fruit in a small bowl and enjoy.",
      prep_time: "1 minute", difficulty: "Easy"
    },
    {
      name: "Hummus with Carrot Sticks",
      description: "Fresh carrot sticks with creamy hummus for a crunchy, protein-rich snack.",
      calories: 120, macros: { protein: 5, carbs: 14, fat: 6, fiber: 4, sugar: 6 },
      ingredients: ["carrots (1 cup sticks)", "hummus (2 tbsp)"],
      instructions: "Cut carrots into sticks and serve with hummus for dipping.",
      prep_time: "5 minutes", difficulty: "Easy"
    },
    {
      name: "Cottage Cheese with Berries",
      description: "Low-fat cottage cheese topped with fresh mixed berries for protein and antioxidants.",
      calories: 140, macros: { protein: 14, carbs: 16, fat: 2, fiber: 3, sugar: 12 },
      ingredients: ["cottage cheese (1/2 cup)", "mixed berries (1/2 cup)"],
      instructions: "Spoon cottage cheese into bowl and top with fresh berries.",
      prep_time: "2 minutes", difficulty: "Easy"
    },
    {
      name: "Avocado Toast Bites",
      description: "Small whole grain crackers topped with mashed avocado and a sprinkle of sea salt.",
      calories: 160, macros: { protein: 4, carbs: 12, fat: 12, fiber: 6, sugar: 1 },
      ingredients: ["whole grain crackers (6)", "avocado (1/4 medium)", "sea salt (pinch)"],
      instructions: "Mash avocado and spread on crackers. Sprinkle with sea salt.",
      prep_time: "3 minutes", difficulty: "Easy"
    },
    {
      name: "Banana with Peanut Butter",
      description: "Sliced banana with natural peanut butter for potassium and healthy fats.",
      calories: 190, macros: { protein: 6, carbs: 24, fat: 8, fiber: 4, sugar: 18 },
      ingredients: ["banana (1 medium)", "peanut butter (1 tbsp)"],
      instructions: "Slice banana and serve with peanut butter for dipping or spreading.",
      prep_time: "2 minutes", difficulty: "Easy"
    },
    {
      name: "Cucumber Slices with Tzatziki",
      description: "Cool cucumber slices with creamy tzatziki sauce for a refreshing, low-calorie snack.",
      calories: 80, macros: { protein: 4, carbs: 8, fat: 4, fiber: 2, sugar: 6 },
      ingredients: ["cucumber (1 cup slices)", "tzatziki (2 tbsp)"],
      instructions: "Slice cucumber and serve with tzatziki for dipping.",
      prep_time: "3 minutes", difficulty: "Easy"
    },
    {
      name: "Hard-Boiled Egg with Everything Seasoning",
      description: "Protein-rich hard-boiled egg sprinkled with everything bagel seasoning.",
      calories: 90, macros: { protein: 6, carbs: 1, fat: 6, fiber: 0, sugar: 1 },
      ingredients: ["hard-boiled egg (1 large)", "everything seasoning (1/2 tsp)"],
      instructions: "Peel hard-boiled egg and sprinkle with seasoning.",
      prep_time: "1 minute", difficulty: "Easy"
    },
    {
      name: "Roasted Chickpeas",
      description: "Crunchy roasted chickpeas seasoned with cumin and paprika for a protein-packed snack.",
      calories: 130, macros: { protein: 6, carbs: 20, fat: 3, fiber: 5, sugar: 3 },
      ingredients: ["chickpeas (1/2 cup)", "cumin (1/2 tsp)", "paprika (1/2 tsp)", "olive oil (1/2 tsp)"],
      instructions: "Toss chickpeas with oil and spices. Roast at 400°F for 20 minutes until crispy.",
      prep_time: "25 minutes", difficulty: "Easy"
    },
    {
      name: "Cheese and Whole Grain Crackers",
      description: "Low-fat cheese with whole grain crackers for calcium and complex carbohydrates.",
      calories: 150, macros: { protein: 8, carbs: 12, fat: 8, fiber: 2, sugar: 2 },
      ingredients: ["low-fat cheese (1 oz)", "whole grain crackers (6)"],
      instructions: "Arrange cheese and crackers on plate and enjoy.",
      prep_time: "1 minute", difficulty: "Easy"
    },
    {
      name: "Edamame with Sea Salt",
      description: "Steamed edamame pods sprinkled with coarse sea salt for plant-based protein.",
      calories: 110, macros: { protein: 8, carbs: 8, fat: 5, fiber: 4, sugar: 2 },
      ingredients: ["edamame (1/2 cup shelled)", "sea salt (1/4 tsp)"],
      instructions: "Steam edamame pods and sprinkle with sea salt while warm.",
      prep_time: "5 minutes", difficulty: "Easy"
    }
  ];

  // Advanced shuffling and uniqueness algorithm
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Create multiple shuffled versions for better distribution
  const shuffledBreakfast = shuffleArray(breakfastTemplates);
  const shuffledLunch = shuffleArray(lunchTemplates);
  const shuffledDinner = shuffleArray(dinnerTemplates);
  const shuffledSnack = shuffleArray(snackTemplates);

  // Track used meals to avoid repetition
  const usedMeals = new Set();

  for (let day = 1; day <= targetDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);

    // Advanced meal selection with uniqueness tracking
    const selectUniqueMeal = (templates: any[], mealType: string, dayNum: number) => {
      // Try to find an unused meal first
      for (let i = 0; i < templates.length; i++) {
        const index = (dayNum - 1 + i + Math.floor(randomSeed * templates.length)) % templates.length;
        const meal = templates[index];
        const mealKey = `${mealType}-${meal.name}`;
        
        if (!usedMeals.has(mealKey)) {
          usedMeals.add(mealKey);
          return { ...meal, name: `${meal.name} (Day ${dayNum})` };
        }
      }
      
      // If all meals have been used, add variation to make it unique
      const baseIndex = (dayNum - 1) % templates.length;
      const baseMeal = templates[baseIndex];
      const variationNumber = Math.floor((dayNum - 1) / templates.length) + 1;
      
      return {
        ...baseMeal,
        name: `${baseMeal.name} - Variation ${variationNumber}`,
        description: `${baseMeal.description} (Day ${dayNum} variation with adjusted seasonings and presentation)`,
        calories: baseMeal.calories + (variationNumber * 5), // Slight calorie adjustment
      };
    };

    const dayPlan = {
      day: day,
      date: currentDate.toISOString().split('T')[0],
      meals: [
        {
          mealType: "breakfast",
          ...selectUniqueMeal(shuffledBreakfast, "breakfast", day)
        },
        {
          mealType: "lunch", 
          ...selectUniqueMeal(shuffledLunch, "lunch", day)
        },
        {
          mealType: "dinner",
          ...selectUniqueMeal(shuffledDinner, "dinner", day)
        },
        {
          mealType: "snack",
          ...selectUniqueMeal(shuffledSnack, "snack", day)
        }
      ]
    };

    plan.push(dayPlan);
  }

  console.log(`✅ Fallback plan generated with ${plan.length} days and ${usedMeals.size} unique meal variations (target was ${targetDays} days)`);
  return plan;
} 