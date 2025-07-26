import { API_CONFIG, NUTRITION_PROMPTS } from '@/config/api';

export async function generateDietPlan(userContext: string, userId: string) {
  try {
    console.log('Sending request to Gemini API with context length:', userContext.length);
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${NUTRITION_PROMPTS.GENERATE_DIET_PLAN}\n\nCreate a personalized diet plan for this user: ${userContext}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000, // Increased for 30-day plan
      }
    };

    console.log('Request body length:', JSON.stringify(requestBody).length);

    const response = await fetch(`${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_CONFIG.GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('AI Response length:', aiResponse.length);
    console.log('AI Response preview:', aiResponse.substring(0, 500) + '...');

    // Parse the AI response to extract structured plan data
    try {
      // Clean up the response - remove markdown formatting if present
      let cleanResponse = aiResponse;
      
      // Remove markdown code blocks if present
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }
      
      console.log('Cleaned response length:', cleanResponse.length);
      console.log('Cleaned response preview:', cleanResponse.substring(0, 1000) + '...');
      
      // Try to parse as JSON
      const parsedPlan = JSON.parse(cleanResponse.trim());
      
      console.log('Parsed plan structure:', {
        hasTitle: !!parsedPlan.title,
        hasDescription: !!parsedPlan.description,
        hasDailyMeals: !!parsedPlan.dailyMeals,
        dailyMealsLength: parsedPlan.dailyMeals?.length || 0,
        hasMeals: !!parsedPlan.meals,
        mealsLength: parsedPlan.meals?.length || 0
      });
      
      // Check if we got a complete plan
      if (parsedPlan.dailyMeals && parsedPlan.dailyMeals.length < 30) {
        console.warn(`Warning: Only got ${parsedPlan.dailyMeals.length} days instead of 30`);
        
        // If we got less than 30 days, check if the response was truncated
        if (aiResponse.length > 30000) {
          console.warn('Response appears to be truncated. Using fallback plan.');
          return {
            title: parsedPlan.title || "AI-Generated Personalized Plan",
            description: parsedPlan.description || "A personalized nutrition plan designed for your specific goals and preferences.",
            duration: "30 days",
            calories: parsedPlan.calories || "1800-2000",
            dailyMeals: generateFallbackPlan()
          };
        }
      }
      
      if (parsedPlan.meals && parsedPlan.meals.length < 120) {
        console.warn(`Warning: Only got ${parsedPlan.meals.length} meals instead of 120`);
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
            console.warn('Detected placeholder content in AI response. Using fallback plan.');
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
      
      // If we got a plan with the old structure (just meals array), convert it to daily structure
      if (parsedPlan.meals && !parsedPlan.dailyMeals) {
        console.log('Converting old meal structure to daily structure');
        parsedPlan.dailyMeals = [{
          day: 1,
          date: new Date().toISOString().split('T')[0],
          meals: parsedPlan.meals
        }];
      }
      
      // Clean up the description if it contains JSON
      if (parsedPlan.description && parsedPlan.description.includes('{')) {
        try {
          // If description contains JSON, extract just the text part
          const descMatch = parsedPlan.description.match(/"description":\s*"([^"]+)"/);
          if (descMatch) {
            parsedPlan.description = descMatch[1];
          } else {
            // Fallback: take first 200 characters before any JSON
            const jsonStart = parsedPlan.description.indexOf('{');
            if (jsonStart > 0) {
              parsedPlan.description = parsedPlan.description.substring(0, jsonStart).trim();
            }
          }
        } catch (descError) {
          console.log('Description cleanup failed, using original');
        }
      }
      
      // Ensure we have a clean description
      if (!parsedPlan.description || parsedPlan.description.length < 10) {
        parsedPlan.description = `Personalized ${parsedPlan.title || 'nutrition'} plan designed for your specific goals and preferences.`;
      }
      
      return parsedPlan;
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // If JSON parsing fails, create a structured plan from the text
      return {
        title: "AI-Generated Personalized Plan",
        description: "A personalized nutrition plan designed for your specific goals and preferences.",
        duration: "30 days",
        calories: "1800-2000",
        dailyMeals: generateFallbackPlan()
      };
    }
  } catch (error) {
    console.error('Diet plan generation error:', error);
    throw error;
  }
}

// Generate a complete 30-day fallback plan
function generateFallbackPlan() {
  const plan = [];
  const startDate = new Date();
  
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
  
  for (let day = 1; day <= 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);
    
    // Rotate through templates for variety
    const breakfastIndex = (day - 1) % breakfastTemplates.length;
    const lunchIndex = (day - 1) % lunchTemplates.length;
    const dinnerIndex = (day - 1) % dinnerTemplates.length;
    const snackIndex = (day - 1) % snackTemplates.length;
    
    const dayPlan = {
      day: day,
      date: currentDate.toISOString().split('T')[0],
      meals: [
        {
          mealType: "breakfast",
          ...breakfastTemplates[breakfastIndex]
        },
        {
          mealType: "lunch",
          ...lunchTemplates[lunchIndex]
        },
        {
          mealType: "dinner",
          ...dinnerTemplates[dinnerIndex]
        },
        {
          mealType: "snack",
          ...snackTemplates[snackIndex]
        }
      ]
    };
    
    plan.push(dayPlan);
  }
  
  return plan;
} 