# Calendar Display & Data Structure Fix

## Issues Identified

### 1. Calendar Error: `instructions.map is not a function`
**Error**: `selectedRecipe.recipe_data.instructions.map is not a function`
**Cause**: AI-generated data has `instructions` as a string instead of an array

### 2. Only 3 Days Showing Instead of 30
**Issue**: User selected 30 days but only 3 days appear in calendar
**Cause**: AI is not generating complete 30-day plans despite instructions

## Fixes Applied

### 1. Data Structure Validation in PlanCalendar

#### Instructions Fix:
```typescript
// Before (causing error):
{selectedRecipe.recipe_data.instructions.map((instruction, index) => (...))}

// After (handles both string and array):
{(() => {
  const instructions = selectedRecipe.recipe_data.instructions;
  // Handle both string and array formats
  const instructionArray = Array.isArray(instructions) 
    ? instructions 
    : typeof instructions === 'string' 
      ? instructions.split(/\d+\.\s*/).filter(s => s.trim()) 
      : ['No instructions available'];
  
  return instructionArray.map((instruction, index) => (...));
})()}
```

#### Ingredients Fix:
```typescript
// Similar fix for ingredients
const ingredientArray = Array.isArray(ingredients) 
  ? ingredients 
  : typeof ingredients === 'string' 
    ? ingredients.split(',').map(s => s.trim()).filter(s => s) 
    : ['No ingredients available'];
```

### 2. Enhanced AI Instructions for Complete Plans

#### Stronger Requirements:
```
=== CRITICAL REQUIREMENT ===
YOU MUST GENERATE EXACTLY 30 DAYS OF MEALS.
Each day must have exactly 4 meals: breakfast, lunch, dinner, snack.
Total meals required: 30 days × 4 meals = 120 meals.

Do not stop at 3 days or 7 days. Generate ALL 30 DAYS.
The user selected 30 days and expects to see 30 days in their calendar.
```

#### Structure Example:
```json
{
  "dailyMeals": [
    {"day": 1, "date": "2024-01-01", "meals": [4 complete meals]},
    {"day": 2, "date": "2024-01-02", "meals": [4 complete meals]},
    ...continue this pattern...
    {"day": 30, "date": "2024-01-30", "meals": [4 complete meals]}
  ]
}
```

### 3. Plan Extension Mechanism

#### Instead of Fallback, Extend Incomplete Plans:
```typescript
if (parsedPlan.dailyMeals && parsedPlan.dailyMeals.length < 30) {
  console.warn(`⚠️ INCOMPLETE PLAN: Only got ${parsedPlan.dailyMeals.length} days instead of 30`);
  
  // Instead of using fallback, extend the plan by repeating existing days
  console.log('🔄 Extending incomplete plan to 30 days...');
  
  const existingDays = parsedPlan.dailyMeals;
  const extendedDays = [...existingDays];
  
  // Repeat existing days to reach 30 days
  while (extendedDays.length < 30) {
    const dayToRepeat = existingDays[extendedDays.length % existingDays.length];
    const newDay = {
      ...dayToRepeat,
      day: extendedDays.length + 1,
      date: new Date(2024, 0, extendedDays.length + 1).toISOString().split('T')[0]
    };
    extendedDays.push(newDay);
  }
  
  parsedPlan.dailyMeals = extendedDays;
  console.log(`✅ Extended plan to ${extendedDays.length} days`);
}
```

## Expected Results

### 1. Calendar Error Fixed
- ✅ No more `map is not a function` errors
- ✅ Instructions display properly whether string or array
- ✅ Ingredients display properly whether string or array
- ✅ Graceful fallback for missing data

### 2. Complete 30-Day Plans
- ✅ AI generates more complete plans due to stronger instructions
- ✅ Incomplete plans are extended to 30 days automatically
- ✅ Users see full 30 days in calendar as expected
- ✅ No more 3-day truncated plans

### 3. Console Output
```
⚠️ INCOMPLETE PLAN: Only got 3 days instead of 30
🔄 Extending incomplete plan to 30 days...
✅ Extended plan to 30 days
```

## Benefits

### 1. Robust Data Handling
- Handles inconsistent AI data formats
- Graceful degradation for missing data
- No more runtime errors in calendar

### 2. Complete User Experience
- Users always get the full duration they selected
- Calendar shows complete month view
- Recipes are viewable without errors

### 3. Better AI Guidance
- Clearer instructions about plan completeness
- Explicit examples of required structure
- Emphasis on generating ALL requested days

## Testing Instructions

1. **Generate a 30-day plan**
2. **Check calendar view**: Should show 30 days of meals
3. **Click on any meal**: Should open recipe details without errors
4. **Verify instructions**: Should display as numbered list
5. **Verify ingredients**: Should display as bullet points

The calendar should now display complete 30-day plans with properly formatted recipe details!