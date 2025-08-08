# Final Aggressive JSON Repair Fix

## Issue Persisting
Despite previous fixes, the AI is still generating invalid JSON with comments and placeholders:
```json
"meals":[/* ... (Repeat similar structure for remaining 29 days) */]},
// ... (Days 3-30 with 4 meals each, following the same structure.)
```

## Root Cause
The AI is not following JSON format instructions and continues to include:
- JavaScript-style comments `/* */` and `//`
- Placeholder text `... (Repeat similar structure)`
- Explanatory notes `**(Note: Due to the sheer volume...)**`

## Final Aggressive Solution

### 1. Stronger AI Instructions
```
=== ABSOLUTE JSON REQUIREMENTS ===
YOU MUST RETURN ONLY VALID JSON. NO EXCEPTIONS.

FORBIDDEN - DO NOT INCLUDE ANY OF THESE:
❌ Comments: /* */ or //
❌ Markdown: ```json or ```
❌ Notes: **(Note: or any explanations
❌ Placeholders: "... (Repeat" or "Replace placeholder"
❌ Text before JSON: Any text before the opening {
❌ Text after JSON: Any text after the closing }

REQUIRED - YOU MUST DO THIS:
✅ Start immediately with {
✅ End immediately with }
✅ Generate ALL 30 days with 4 meals each (120 total meals)
```

### 2. Aggressive JSON Cleaning
```typescript
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
```

### 3. Multi-Level Repair Mechanism
```typescript
try {
  parsedPlan = JSON.parse(cleanResponse.trim());
  console.log('✅ JSON parsing successful!');
} catch (firstParseError) {
  // LEVEL 1: Aggressive comment removal
  repairedResponse = repairedResponse.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
  repairedResponse = repairedResponse.replace(/,\s*\/\*.*?\*\//g, ',');
  
  // LEVEL 2: Fix placeholder patterns
  repairedResponse = repairedResponse.replace(/\[\s*\/\*\s*\.\.\.\s*\([^)]*\)\s*\*\/\s*\]/g, '[]');
  
  // LEVEL 3: Truncate at last valid structure
  const lastCompleteObject = repairedResponse.lastIndexOf('}}');
  const lastCompleteArray = repairedResponse.lastIndexOf(']}');
  const lastComplete = Math.max(lastCompleteObject, lastCompleteArray);
  
  if (lastComplete > 0) {
    repairedResponse = repairedResponse.substring(0, lastComplete + 2);
  }
  
  // LEVEL 4: Balance braces and brackets
  // Add missing closing braces/brackets
  
  try {
    parsedPlan = JSON.parse(repairedResponse);
    console.log('✅ JSON parsing successful after repair!');
  } catch (repairError) {
    // LEVEL 5: Extract single day as last resort
    const firstDayMatch = repairedResponse.match(/"dailyMeals":\s*\[\s*({[^}]*"meals":\s*\[[^\]]*\][^}]*})/);
    if (firstDayMatch) {
      const singleDayPlan = `{"title":"AI-Generated Plan","description":"Partial plan extracted","duration":"30 days","calories":"1800","dailyMeals":[${firstDayMatch[1]}]}`;
      parsedPlan = JSON.parse(singleDayPlan);
      console.log('✅ Successfully extracted single day plan!');
    } else {
      throw repairError; // Give up and use fallback
    }
  }
}
```

## Expected Console Output

### Success Case:
```
🔄 Attempting to parse as JSON...
✅ JSON parsing successful!
```

### Repair Case:
```
🔄 Attempting to parse as JSON...
❌ First JSON parse failed, attempting aggressive repair...
🔧 Repaired response preview: {"title":"30-Day Plan"...
🔧 Attempting to parse repaired JSON...
✅ JSON parsing successful after repair!
```

### Last Resort Case:
```
❌ Repair also failed: SyntaxError: Unexpected token
🔧 Final attempt: extracting first complete day only...
✅ Successfully extracted single day plan!
```

### Fallback Case (should be rare now):
```
⚠️ FALLBACK TRIGGER 4: JSON parsing failed. Using fallback plan.
🔄 USING FALLBACK PLAN - This is why you get identical responses!
```

## Benefits of This Approach

### 1. Multi-Level Defense
- **Level 1**: Stronger AI instructions
- **Level 2**: Aggressive cleaning
- **Level 3**: Smart repair
- **Level 4**: Structure balancing
- **Level 5**: Partial extraction
- **Level 6**: Randomized fallback (if all else fails)

### 2. Better Debugging
- Clear console messages showing which level succeeded
- Preview of repaired JSON for debugging
- Specific error messages for each failure point

### 3. Graceful Degradation
- Even if full plan fails, extract partial plan
- Partial plan is still better than static fallback
- Fallback is now randomized if triggered

This aggressive approach should finally resolve the JSON parsing issues and eliminate the identical response problem.