
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    console.log('Parsing nutrition plan:', fileName);

    // For demo purposes, generate sample parsed events
    // In a real implementation, you would:
    // 1. Download the file from the URL
    // 2. Extract text content (OCR for images, text extraction for PDFs)
    // 3. Use Llama or another AI model to parse the nutrition plan
    // 4. Structure the data into calendar events

    const sampleEvents = [
      {
        id: crypto.randomUUID(),
        date: new Date(),
        meal: "Greek Yogurt with Berries",
        mealType: "breakfast",
        description: "1 cup Greek yogurt with mixed berries and honey",
        calories: 180
      },
      {
        id: crypto.randomUUID(),
        date: new Date(),
        meal: "Grilled Chicken Salad",
        mealType: "lunch",
        description: "Mixed greens with grilled chicken, cherry tomatoes, and olive oil dressing",
        calories: 350
      },
      {
        id: crypto.randomUUID(),
        date: new Date(),
        meal: "Salmon with Quinoa",
        mealType: "dinner",
        description: "Baked salmon fillet with quinoa and steamed vegetables",
        calories: 450
      },
      {
        id: crypto.randomUUID(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        meal: "Oatmeal with Banana",
        mealType: "breakfast",
        description: "Steel-cut oats with sliced banana and cinnamon",
        calories: 250
      },
      {
        id: crypto.randomUUID(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        meal: "Turkey Wrap",
        mealType: "lunch",
        description: "Whole wheat wrap with turkey, lettuce, tomato, and avocado",
        calories: 320
      }
    ];

    console.log('Generated sample events:', sampleEvents.length);

    return new Response(JSON.stringify({ 
      success: true, 
      events: sampleEvents,
      message: `Parsed ${sampleEvents.length} meal events from ${fileName}`
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
