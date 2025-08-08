# Aggressive Uniqueness Fix for Gemini API

## Issue
Despite previous fixes, the Gemini API was still generating similar responses regardless of different parameters chosen by users.

## Root Cause Analysis
The issue was that the randomness wasn't aggressive enough. The AI was falling back to common meal patterns and standard combinations despite the temperature and sampling parameters.

## Aggressive Fixes Implemented

### 1. Multi-Layered Randomness System
Instead of one random element, now using 4 different random categories:

```typescript
// 12 different cuisine styles
const cuisineStyles = [
  'Mediterranean-inspired dishes', 'Asian fusion flavors', 'Latin American influences', 
  'Middle Eastern spices', 'Indian subcontinental cuisine', 'European comfort foods',
  'African-inspired ingredients', 'Nordic minimalist approach', 'Mexican street food style',
  'Thai and Vietnamese fresh herbs', 'Japanese umami-rich meals', 'Italian rustic cooking'
];

// 12 different cooking methods
const cookingMethods = [
  'grilling and roasting techniques', 'steaming and poaching methods', 'stir-frying and sautéing',
  'slow-cooking and braising', 'raw and fresh preparations', 'fermented and pickled elements',
  // ... more methods
];

// 12 different nutritional focuses
const nutritionalFocus = [
  'high-protein muscle building', 'anti-inflammatory ingredients', 'gut-health promoting foods',
  'brain-boosting nutrients', 'heart-healthy omega-3s', 'bone-strengthening calcium',
  // ... more focuses
];

// 12 different meal timing approaches
const mealTimings = [
  'quick 15-minute preparations', '30-minute balanced meals', 'make-ahead meal prep',
  'one-pot wonder dishes', 'grab-and-go portable options', 'leisurely weekend cooking',
  // ... more timings
];
```

### 2. Unique Combination Generation
```typescript
const uniqueApproach = `${randomCuisine} with ${randomCooking}, emphasizing ${randomNutrition} and ${randomTiming}`;
```

This creates combinations like:
- "Mediterranean-inspired dishes with fermented and pickled elements, emphasizing brain-boosting nutrients and quick 15-minute preparations"
- "Japanese umami-rich meals with sous-vide precision cooking, emphasizing gut-health promoting foods and make-ahead meal prep"

### 3. Specific Numerical Requirements
```typescript
const randomNumber1 = Math.floor(Math.random() * 20) + 5; // 5-24 vegetables
const randomNumber2 = Math.floor(Math.random() * 15) + 10; // 10-24 protein sources
const randomPercentage = Math.floor(Math.random() * 30) + 20; // 20-49% unique ingredients

const specificRequirements = `Include at least ${randomNumber1} different vegetables, ${randomNumber2} unique protein sources, and ensure ${randomPercentage}% of meals feature ingredients you haven't used in previous plans.`;
```

### 4. Enhanced Prompt with Strict Uniqueness Rules
```typescript
=== MANDATORY VARIATION RULES ===
1. Use ingredient combinations you have NEVER used before
2. Create meal names that are completely original and specific
3. Avoid any "standard" or "typical" meal patterns
4. Each day must have a different cultural or regional influence
5. No two meals should share more than 2 main ingredients
6. Include at least 3 unusual or creative ingredient pairings per day
7. Vary cooking methods significantly between meals
8. Create unique flavor profiles for each meal

CRITICAL: If you find yourself generating common meals like "Grilled Chicken Salad" or "Oatmeal with Berries", STOP and create something more unique and creative instead.
```

### 5. Maximum Randomness Configuration
```typescript
generationConfig: {
  temperature: 1.0, // Maximum randomness for creativity
  topP: 0.9, // More focused nucleus sampling
  topK: 50, // Increased diversity in token selection
  maxOutputTokens: 32000,
  candidateCount: 1,
  stopSequences: []
}
```

### 6. Multiple Random Seeds
```typescript
UNIQUE REQUEST ID: ${sessionId}
GENERATION TIMESTAMP: ${timestamp}
RANDOM SEED: ${Math.random().toString(36).substring(2, 10)}

// And later in the prompt:
This is request #${Date.now()} - Generate a completely unique plan that has NEVER been created before.
Use the random seed ${Math.random()} to ensure maximum variation.
```

## Expected Results

### Before Fix:
- Similar meal plans regardless of user choices
- Common meal patterns like "Grilled Chicken Salad"
- Limited variety in ingredients and cooking methods
- Predictable combinations

### After Aggressive Fix:
- **Completely Unique Combinations**: Each request gets a unique cuisine + cooking + nutrition + timing combination
- **Specific Numerical Targets**: Random requirements for vegetables, proteins, and ingredient uniqueness
- **Creative Meal Names**: Explicit instructions to avoid common meal names
- **Cultural Diversity**: Each day must have different cultural influences
- **Ingredient Variety**: No two meals can share more than 2 main ingredients
- **Cooking Method Variety**: Significant variation in preparation methods

## Console Output Example:
```
🎲 Randomness applied: {
  sessionId: "user123-1703123456789...",
  cuisine: "Thai and Vietnamese fresh herbs",
  cooking: "fermented and pickled elements",
  nutrition: "gut-health promoting foods",
  timing: "make-ahead meal prep",
  temperature: 1.0,
  topP: 0.9,
  topK: 50
}
```

## Testing Instructions:
1. Generate multiple plans with identical user parameters
2. Verify each plan has completely different meals
3. Check that meal names are creative and specific
4. Confirm ingredient combinations are unique
5. Verify cultural/regional diversity across days

This aggressive approach should eliminate any possibility of duplicate or similar responses, ensuring every diet plan generation is truly unique and creative.