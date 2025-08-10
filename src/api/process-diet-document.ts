import { API_CONFIG } from '@/config/api';

export interface ProcessedDietDocument {
  title: string;
  description: string;
  duration: string;
  calories: string;
  dailyMeals: any[];
  source: 'uploaded_document';
  originalFileName: string;
  processingNotes?: string;
}

export async function processUploadedDietDocument(
  file: File,
  planName: string,
  userId: string
): Promise<ProcessedDietDocument> {
  try {
    console.log('📄 Processing uploaded diet document:', file.name);
    
    // Convert file to base64 for Gemini API
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;
    
    // Determine processing method based on file type
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      return await processDocumentWithVisionRetry(base64Data, mimeType, planName, file.name);
    } else if (mimeType.startsWith('text/') || mimeType.includes('document')) {
      const textContent = await fileToText(file);
      return await processTextDocumentRetry(textContent, planName, file.name);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('❌ Error processing document:', error);
    throw error;
  }
}

async function processDocumentWithVisionRetry(
  base64Data: string,
  mimeType: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  try {
    // First attempt with comprehensive extraction
    return await processDocumentWithVision(base64Data, mimeType, planName, fileName);
  } catch (error) {
    console.warn('⚠️ First extraction attempt failed, trying with focused prompt...', error);
    
    // Second attempt with a more focused prompt for better extraction
    return await processDocumentWithVisionFocused(base64Data, mimeType, planName, fileName);
  }
}

async function processTextDocumentRetry(
  textContent: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  try {
    // First attempt with comprehensive extraction
    return await processTextDocument(textContent, planName, fileName);
  } catch (error) {
    console.warn('⚠️ First text extraction attempt failed, trying with focused prompt...', error);
    
    // Second attempt with a more focused prompt
    return await processTextDocumentFocused(textContent, planName, fileName);
  }
}

async function processDocumentWithVision(
  base64Data: string,
  mimeType: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  console.log('👁️ Processing document with Gemini Vision API');
  
  const prompt = `
You are a nutrition expert tasked with analyzing an uploaded diet plan document. 
Extract ALL the meal information and convert it to a structured format.

CRITICAL INSTRUCTIONS:
1. Read and analyze the ENTIRE document carefully - scan every page, section, and detail
2. Extract ALL meals, ALL days, and ALL nutritional information found
3. If the document contains a 30-day plan, extract ALL 30 days - do not skip any days
4. If the document contains a 7-day plan, extract ALL 7 days
5. If the document contains a 14-day plan, extract ALL 14 days
6. Convert to the EXACT JSON format specified below
7. If calories aren't specified, estimate reasonable values based on meal content
8. If macros aren't provided, estimate based on the meal description and ingredients
9. Pay special attention to any weekly schedules, daily breakdowns, or meal rotations

REQUIRED JSON FORMAT:
{
  "title": "Extracted or generated title",
  "description": "Brief description of the diet plan",
  "duration": "X days" (e.g., "7 days", "14 days", "30 days"),
  "calories": "estimated daily calories",
  "dailyMeals": [
    {
      "day": 1,
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal name from document",
          "description": "Detailed description",
          "calories": 300,
          "prep_time": "15 min",
          "difficulty": "Easy",
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": ["step1", "step2"],
          "macros": {
            "protein": 20,
            "carbs": 30,
            "fat": 10,
            "fiber": 5,
            "sugar": 8
          }
        }
      ]
    }
  ]
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown or explanations
- Include ALL meals found in the document - do not summarize or skip days
- If document has 30 days of meals, your JSON must contain all 30 days
- If document has weekly meal plans, repeat them for the full duration
- If document has only sample meals, create a reasonable plan structure
- Estimate missing nutritional information professionally
- Use "breakfast", "lunch", "dinner", "snack" for mealType
- Ensure the "dailyMeals" array contains the correct number of days as specified in the document

EXTRACTION PRIORITY:
1. First, determine the total duration of the plan (how many days total)
2. Then extract meals for each specific day mentioned
3. If meals repeat weekly, duplicate them for the full duration
4. Ensure no days are missing from the final output

Analyze the uploaded document and extract the COMPLETE diet plan information:
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3, // Lower temperature for more consistent extraction
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 32000,
      candidateCount: 1,
      responseMimeType: "application/json"
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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates[0].content.parts[0].text;

  // Parse and validate the response
  const parsedPlan = parseAndValidateResponse(aiResponse, planName, fileName);
  
  return {
    ...parsedPlan,
    source: 'uploaded_document',
    originalFileName: fileName,
    processingNotes: 'Processed using Gemini Vision API'
  };
}

async function processDocumentWithVisionFocused(
  base64Data: string,
  mimeType: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  console.log('🎯 Processing document with focused Gemini Vision API');
  
  const focusedPrompt = `
CRITICAL EXTRACTION TASK: This document contains a diet plan. I need you to extract EVERY SINGLE DAY and EVERY SINGLE MEAL.

ANALYSIS STEPS:
1. First, scan the ENTIRE document to determine the total number of days (look for patterns like "Day 1", "Day 2", "Week 1", etc.)
2. Then, systematically extract meals for each day you find
3. If you see weekly patterns (Week 1, Week 2, etc.), extract all weeks and all days within each week
4. If you see monthly patterns, extract all days in the month

EXTRACTION RULES:
- If this is a 30-day plan, your JSON MUST contain 30 days (days 1-30)
- If this is a 7-day plan, your JSON MUST contain 7 days (days 1-7)  
- If this is a 14-day plan, your JSON MUST contain 14 days (days 1-14)
- Do NOT summarize, skip, or combine days
- Extract EVERY meal for EVERY day (breakfast, lunch, dinner, snacks)

IMPORTANT: Look for these patterns in the document:
- "Day 1", "Day 2", etc.
- "Week 1 Day 1", "Week 1 Day 2", etc.
- "Monday", "Tuesday", etc. (if repeated across weeks)
- Any numbered or dated meal plans

Return ONLY this JSON structure with ALL days extracted:
{
  "title": "${planName}",
  "description": "Complete diet plan extracted from ${fileName}",
  "duration": "X days",
  "calories": "estimated daily calories",
  "dailyMeals": [
    {
      "day": 1,
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "specific meal name from document",
          "description": "detailed meal description",
          "calories": 300,
          "prep_time": "15 min",
          "difficulty": "Easy",
          "ingredients": ["specific ingredient 1", "specific ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "macros": {"protein": 20, "carbs": 30, "fat": 10, "fiber": 5, "sugar": 8}
        }
      ]
    }
  ]
}

CRITICAL: The dailyMeals array must contain ALL days found in the document. Do not stop early.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: focusedPrompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1, // Even lower temperature for focused extraction
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 32000,
      candidateCount: 1,
      responseMimeType: "application/json"
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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates[0].content.parts[0].text;

  const parsedPlan = parseAndValidateResponse(aiResponse, planName, fileName);
  
  return {
    ...parsedPlan,
    source: 'uploaded_document',
    originalFileName: fileName,
    processingNotes: 'Processed using focused Gemini Vision API (retry attempt)'
  };
}

async function processTextDocument(
  textContent: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  console.log('📝 Processing text document with Gemini API');
  
  const prompt = `
You are a nutrition expert analyzing a text-based diet plan document.
Extract ALL meal information and convert it to a structured JSON format.

TEXT CONTENT TO ANALYZE:
${textContent}

CRITICAL INSTRUCTIONS:
1. Analyze the ENTIRE text content carefully - read every line and section
2. Extract ALL meals, ALL days, and ALL nutritional information found
3. If the text contains a 30-day plan, extract ALL 30 days - do not skip any days
4. If the text contains weekly meal plans, repeat them for the full duration
5. Convert to the EXACT JSON format specified below
6. If duration isn't clear, estimate based on content (7, 14, or 30 days)
7. Estimate calories and macros if not provided
8. Pay attention to any day numbers, week numbers, or meal schedules

REQUIRED JSON FORMAT:
{
  "title": "${planName}",
  "description": "Brief description extracted from content",
  "duration": "X days",
  "calories": "estimated daily calories",
  "dailyMeals": [
    {
      "day": 1,
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal name",
          "description": "Description",
          "calories": 300,
          "prep_time": "15 min",
          "difficulty": "Easy",
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": ["step1", "step2"],
          "macros": {
            "protein": 20,
            "carbs": 30,
            "fat": 10,
            "fiber": 5,
            "sugar": 8
          }
        }
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown or explanations.
`;

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
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 32000,
      candidateCount: 1,
      responseMimeType: "application/json"
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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates[0].content.parts[0].text;

  const parsedPlan = parseAndValidateResponse(aiResponse, planName, fileName);
  
  return {
    ...parsedPlan,
    source: 'uploaded_document',
    originalFileName: fileName,
    processingNotes: 'Processed using Gemini Text API'
  };
}

async function processTextDocumentFocused(
  textContent: string,
  planName: string,
  fileName: string
): Promise<ProcessedDietDocument> {
  console.log('🎯 Processing text document with focused Gemini API');
  
  const focusedPrompt = `
CRITICAL TEXT EXTRACTION: Extract EVERY SINGLE DAY and EVERY SINGLE MEAL from this text.

TEXT CONTENT TO ANALYZE:
${textContent}

ANALYSIS INSTRUCTIONS:
1. Read through the ENTIRE text content carefully
2. Identify ALL day references (Day 1, Day 2, Week 1 Day 1, Monday, Tuesday, etc.)
3. For each day found, extract ALL meals mentioned
4. If you find weekly patterns that repeat, include all repetitions
5. Count the total days and ensure your output matches

EXTRACTION REQUIREMENTS:
- If the text mentions 30 days of meals, extract ALL 30 days
- If the text has weekly meal plans that repeat, expand them to the full duration
- Do NOT summarize or skip any days
- Extract every breakfast, lunch, dinner, and snack mentioned

PATTERN RECOGNITION:
Look for these patterns in the text:
- "Day 1:", "Day 2:", etc.
- "Week 1 Day 1:", "Week 2 Day 1:", etc.
- "Monday:", "Tuesday:", etc. (if they repeat across weeks)
- Any numbered meal plans or daily schedules

Return ONLY this complete JSON with ALL days:
{
  "title": "${planName}",
  "description": "Complete diet plan extracted from text",
  "duration": "X days",
  "calories": "estimated daily calories",
  "dailyMeals": [
    {
      "day": 1,
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "specific meal name from text",
          "description": "detailed meal description",
          "calories": 300,
          "prep_time": "15 min",
          "difficulty": "Easy",
          "ingredients": ["specific ingredient 1", "specific ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "macros": {"protein": 20, "carbs": 30, "fat": 10, "fiber": 5, "sugar": 8}
        }
      ]
    }
  ]
}

CRITICAL: Your dailyMeals array must contain ALL days found in the text. Do not stop at just a few days.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: focusedPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 32000,
      candidateCount: 1,
      responseMimeType: "application/json"
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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates[0].content.parts[0].text;

  const parsedPlan = parseAndValidateResponse(aiResponse, planName, fileName);
  
  return {
    ...parsedPlan,
    source: 'uploaded_document',
    originalFileName: fileName,
    processingNotes: 'Processed using focused Gemini Text API (retry attempt)'
  };
}

function parseAndValidateResponse(
  aiResponse: string,
  planName: string,
  fileName: string
): ProcessedDietDocument {
  try {
    // Clean up the response
    let cleanResponse = aiResponse.trim();
    
    // Remove markdown formatting if present
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Extract JSON from response
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsedPlan = JSON.parse(cleanResponse);
    
    // Log extraction results for debugging
    const extractionResults = {
      title: parsedPlan.title,
      duration: parsedPlan.duration,
      daysExtracted: parsedPlan.dailyMeals?.length || 0,
      firstDay: parsedPlan.dailyMeals?.[0]?.day,
      lastDay: parsedPlan.dailyMeals?.[parsedPlan.dailyMeals?.length - 1]?.day,
      totalMealsExtracted: parsedPlan.dailyMeals?.reduce((total: number, day: any) => total + (day.meals?.length || 0), 0) || 0,
      sampleDays: parsedPlan.dailyMeals?.slice(0, 3).map((day: any) => ({
        day: day.day,
        mealsCount: day.meals?.length || 0,
        mealTypes: day.meals?.map((meal: any) => meal.mealType) || []
      })) || []
    };
    
    console.log('📊 Extraction Results:', extractionResults);
    
    // Log a portion of the raw response for debugging
    console.log('🔍 Raw AI Response (first 500 chars):', aiResponse.substring(0, 500));
    
    // Validate required fields
    if (!parsedPlan.dailyMeals || !Array.isArray(parsedPlan.dailyMeals)) {
      throw new Error('Invalid plan structure: missing dailyMeals array');
    }
    
    // Ensure we have a reasonable structure
    if (parsedPlan.dailyMeals.length === 0) {
      throw new Error('No meals found in document');
    }
    
    // Warn if extraction seems incomplete
    if (parsedPlan.dailyMeals.length < 7 && parsedPlan.duration && parsedPlan.duration.includes('30')) {
      console.warn('⚠️ Possible incomplete extraction: Expected 30 days but only got', parsedPlan.dailyMeals.length, 'days');
    }
    
    // Set defaults for missing fields
    return {
      title: parsedPlan.title || planName,
      description: parsedPlan.description || `Diet plan extracted from ${fileName}`,
      duration: parsedPlan.duration || `${parsedPlan.dailyMeals.length} days`,
      calories: parsedPlan.calories || '1800-2000',
      dailyMeals: parsedPlan.dailyMeals,
      source: 'uploaded_document',
      originalFileName: fileName
    };
    
  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    console.log('🔍 Raw AI Response for debugging:', aiResponse);
    
    // Try to extract partial information from the raw response
    let extractedDays = 0;
    const dayMatches = aiResponse.match(/day["\s]*:\s*\d+/gi);
    if (dayMatches) {
      extractedDays = dayMatches.length;
      console.log('📅 Found', extractedDays, 'day references in response');
    }
    
    // Also check for meal references
    const mealMatches = aiResponse.match(/"mealType":\s*"[^"]+"/gi);
    const mealCount = mealMatches ? mealMatches.length : 0;
    console.log('🍽️ Found', mealCount, 'meal references in response');
    
    // Check if response was truncated
    if (aiResponse.length > 30000) {
      console.warn('⚠️ Response may have been truncated due to length:', aiResponse.length, 'characters');
    }
    
    // Return a fallback structure with better error info
    return {
      title: planName,
      description: `Diet plan extracted from ${fileName} (parsing error occurred)`,
      duration: '7 days',
      calories: '1800-2000',
      dailyMeals: generateFallbackMealsFromDocument(fileName),
      source: 'uploaded_document',
      originalFileName: fileName,
      processingNotes: `Fallback structure used due to parsing error. AI found ${extractedDays} day references but JSON parsing failed.`
    };
  }
}

function generateFallbackMealsFromDocument(fileName: string): any[] {
  // Generate a 30-day structure as fallback (more likely to match uploaded plans)
  const fallbackMeals = [];
  
  for (let day = 1; day <= 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day - 1);
    
    fallbackMeals.push({
      day: day,
      date: date.toISOString().split('T')[0],
      meals: [
        {
          mealType: 'breakfast',
          name: `Breakfast from ${fileName}`,
          description: 'Meal details extracted from uploaded document',
          calories: 300,
          prep_time: '15 min',
          difficulty: 'Easy',
          ingredients: ['Please refer to original document'],
          instructions: ['Follow instructions from uploaded document'],
          macros: { protein: 15, carbs: 35, fat: 12, fiber: 5, sugar: 8 }
        },
        {
          mealType: 'lunch',
          name: `Lunch from ${fileName}`,
          description: 'Meal details extracted from uploaded document',
          calories: 400,
          prep_time: '20 min',
          difficulty: 'Easy',
          ingredients: ['Please refer to original document'],
          instructions: ['Follow instructions from uploaded document'],
          macros: { protein: 25, carbs: 40, fat: 15, fiber: 8, sugar: 6 }
        },
        {
          mealType: 'dinner',
          name: `Dinner from ${fileName}`,
          description: 'Meal details extracted from uploaded document',
          calories: 500,
          prep_time: '30 min',
          difficulty: 'Medium',
          ingredients: ['Please refer to original document'],
          instructions: ['Follow instructions from uploaded document'],
          macros: { protein: 30, carbs: 45, fat: 20, fiber: 10, sugar: 5 }
        }
      ]
    });
  }
  
  return fallbackMeals;
}

// Utility functions
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

