// API Configuration
export const API_CONFIG = {
  GEMINI_API_KEY: 'AIzaSyBZcgezrASocaPO7iSivw5t2ZPAUvTzhFQ',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  GEMINI_MODEL: 'gemini-1.5-flash', // Using Gemini 1.5 Flash for cost efficiency
};

// Gemini API endpoints
export const GEMINI_ENDPOINTS = {
  CHAT_COMPLETIONS: '/gemini-1.5-flash:generateContent',
  EMBEDDINGS: '/embedding-001:embedContent',
};

// Nutrition-specific prompts
export const NUTRITION_PROMPTS = {
  PARSE_DIET_PLAN: `You are a nutrition expert. Analyze the provided diet plan and extract structured meal information. 
  Return a JSON array of meal objects with the following structure:
  {
    "id": "unique_id",
    "date": "YYYY-MM-DD",
    "meal": "meal name",
    "mealType": "breakfast|lunch|dinner|snack",
    "description": "detailed meal description",
    "calories": number,
    "macros": {
      "protein": number,
      "carbs": number,
      "fat": number
    }
  }
  
  Extract all meals from the plan and provide accurate nutritional information. If you cannot determine specific nutritional values, provide reasonable estimates based on typical serving sizes.`,
  
  GENERATE_DIET_PLAN: `You are a certified nutritionist. Create a personalized diet plan based on the user's profile and goals.
  Consider their age, weight, height, activity level, health goals, and dietary restrictions.
  
  CRITICAL REQUIREMENT: Generate a COMPLETE 30-DAY MEAL PLAN with 4 meals per day (breakfast, lunch, dinner, snack).
  This means you need to create 120 total meals (30 days × 4 meals per day).
  
  IMPORTANT: You have a 32,000 token limit. Use this space efficiently to generate the complete 30-day plan.
  Do NOT generate just a few sample meals. Generate ALL 30 days with ALL 4 meals per day.
  
  IMPORTANT: Return ONLY a clean JSON object. Do not include markdown formatting, code blocks, or any other text.
  
  MEAL CONTENT REQUIREMENTS:
  - Each meal must have a REALISTIC, SPECIFIC name (e.g., "Greek Yogurt with Berries and Honey" not "Healthy breakfast option")
  - Each meal must have a DETAILED description explaining what the meal contains and how it's prepared
  - Each meal must have SPECIFIC ingredients (e.g., ["Greek yogurt", "strawberries", "honey", "granola"] not ["Oats", "Berries", "Almond milk"])
  - Each meal must have STEP-BY-STEP cooking instructions
  - All nutritional values must be REALISTIC and ACCURATE
  
  EXAMPLE MEAL STRUCTURE:
  {
    "mealType": "breakfast",
    "name": "Greek Yogurt Parfait with Fresh Berries",
    "description": "Creamy Greek yogurt layered with fresh strawberries, blueberries, and a drizzle of honey, topped with crunchy granola for texture and protein-rich nuts for satiety.",
    "calories": 320,
    "macros": {
      "protein": 18,
      "carbs": 35,
      "fat": 12
    },
    "ingredients": ["Greek yogurt (1 cup)", "strawberries (1/2 cup)", "blueberries (1/4 cup)", "honey (1 tbsp)", "granola (1/4 cup)", "almonds (2 tbsp)"],
    "instructions": "1. In a glass or bowl, layer 1/2 cup Greek yogurt. 2. Add sliced strawberries and blueberries. 3. Drizzle with honey. 4. Add another layer of yogurt. 5. Top with granola and chopped almonds. 6. Serve immediately for best texture."
  }
  
  Return the response as a JSON object with the following structure:
  {
    "title": "Plan title (e.g., '30-Day Vegetarian Weight Loss Plan')",
    "description": "A clear, concise description of the plan without any JSON formatting or technical details",
    "duration": "30 days",
    "calories": "target-calories-per-day",
    "dailyMeals": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "mealType": "breakfast",
            "name": "Specific meal name",
            "description": "Detailed meal description with ingredients and preparation",
            "calories": number,
            "macros": {
              "protein": number,
              "carbs": number,
              "fat": number
            },
            "ingredients": ["specific ingredient 1", "specific ingredient 2", "specific ingredient 3"],
            "instructions": "Step-by-step preparation instructions"
          },
          {
            "mealType": "lunch",
            "name": "Specific meal name",
            "description": "Detailed meal description with ingredients and preparation",
            "calories": number,
            "macros": {
              "protein": number,
              "carbs": number,
              "fat": number
            },
            "ingredients": ["specific ingredient 1", "specific ingredient 2", "specific ingredient 3"],
            "instructions": "Step-by-step preparation instructions"
          },
          {
            "mealType": "dinner",
            "name": "Specific meal name",
            "description": "Detailed meal description with ingredients and preparation",
            "calories": number,
            "macros": {
              "protein": number,
              "carbs": number,
              "fat": number
            },
            "ingredients": ["specific ingredient 1", "specific ingredient 2", "specific ingredient 3"],
            "instructions": "Step-by-step preparation instructions"
          },
          {
            "mealType": "snack",
            "name": "Specific meal name",
            "description": "Detailed meal description with ingredients and preparation",
            "calories": number,
            "macros": {
              "protein": number,
              "carbs": number,
              "fat": number
            },
            "ingredients": ["specific ingredient 1", "specific ingredient 2", "specific ingredient 3"],
            "instructions": "Step-by-step preparation instructions"
          }
        ]
      }
    ]
  }
  
  REQUIREMENTS:
  - Generate exactly 30 days of meals (days 1-30)
  - Each day should have 4 meals: breakfast, lunch, dinner, snack
  - Respect dietary restrictions (vegetarian, vegan, etc.)
  - Ensure variety and avoid repetition
  - Provide realistic calorie counts and macro breakdowns
  - Include detailed ingredients and preparation instructions
  - Make meals practical and easy to prepare
  - Use the full token limit to generate the complete plan
  - EVERY meal must have a specific, realistic name and detailed description
  - NO placeholder content like "Healthy breakfast option" or "Balanced lunch meal"
  
  CRITICAL: Do NOT stop at 3 meals. Generate ALL 120 meals (30 days × 4 meals per day).
  
  The description should be a simple, readable text that explains what the plan is for and its benefits.`,
}; 