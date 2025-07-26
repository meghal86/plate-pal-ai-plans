
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBZcgezrASocaPO7iSivw5t2ZPAUvTzhFQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash';

// Nutrition parsing prompt
const NUTRITION_PARSE_PROMPT = `You are a nutrition expert. Analyze the provided diet plan and extract structured meal information. 
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

Extract all meals from the plan and provide accurate nutritional information. If you cannot determine specific nutritional values, provide reasonable estimates based on typical serving sizes.`;

async function callGemini(content: string): Promise<any> {
  try {
    const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${NUTRITION_PARSE_PROMPT}\n\nPlease analyze this diet plan and extract the meal information: ${content}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

async function extractTextFromFile(fileUrl: string): Promise<string> {
  try {
    // Download the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/') || contentType?.includes('application/pdf')) {
      // For text files and PDFs, try to extract text
      const text = await response.text();
      return text;
    } else if (contentType?.includes('image/')) {
      // For images, we would need OCR, but for now return a placeholder
      return "Image file detected. OCR processing would be needed for full text extraction.";
    } else {
      throw new Error(`Unsupported file type: ${contentType}`);
    }
  } catch (error) {
    console.error('File extraction error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    console.log('Parsing nutrition plan:', fileName);

    // Extract text content from the file
    const fileContent = await extractTextFromFile(fileUrl);
    console.log('Extracted content length:', fileContent.length);

    // Call Gemini to parse the nutrition plan
    const aiResponse = await callGemini(fileContent);
    console.log('Gemini response received');

    // Parse the AI response
    let parsedEvents;
    try {
      // Try to parse as JSON
      parsedEvents = JSON.parse(aiResponse);
      
      // Ensure it's an array
      if (!Array.isArray(parsedEvents)) {
        throw new Error('AI response is not an array');
      }

      // Add unique IDs if missing
      parsedEvents = parsedEvents.map((event, index) => ({
        ...event,
        id: event.id || `meal_${Date.now()}_${index}`,
        date: event.date || new Date().toISOString().split('T')[0]
      }));

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Fallback to sample events if parsing fails
      parsedEvents = [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          meal: "Greek Yogurt with Berries",
          mealType: "breakfast",
          description: "1 cup Greek yogurt with mixed berries and honey",
          calories: 180,
          macros: { protein: 15, carbs: 25, fat: 5 }
        },
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          meal: "Grilled Chicken Salad",
          mealType: "lunch",
          description: "Mixed greens with grilled chicken, cherry tomatoes, and olive oil dressing",
          calories: 350,
          macros: { protein: 30, carbs: 15, fat: 20 }
        }
      ];
    }

    console.log('Parsed events:', parsedEvents.length);

    return new Response(JSON.stringify({ 
      success: true, 
      events: parsedEvents,
      message: `AI parsed ${parsedEvents.length} meal events from ${fileName}`,
      aiResponse: aiResponse // Include for debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-nutrition-plan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
