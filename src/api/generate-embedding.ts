import { API_CONFIG } from '@/config/api';

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('Generating embedding for text length:', text.length);
    
    // Truncate text if it's too long (embedding models have limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: truncatedText
            }
          ]
        }
      ],
      taskType: "RETRIEVAL_DOCUMENT",
      title: "Nutrition Plan Embedding"
    };

    const response = await fetch(`${API_CONFIG.GEMINI_API_URL}/models/embedding-001:embedContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_CONFIG.GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Embedding API error response:', errorText);
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const embedding = data.embedding.values;
    
    console.log('Generated embedding with dimensions:', embedding.length);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // Fallback: generate a simple hash-based embedding
    return generateFallbackEmbedding(text);
  }
}

function generateFallbackEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const textLength = Math.min(text.length, 1536);
  
  for (let i = 0; i < 1536; i++) {
    if (i < textLength) {
      // Use character codes to create a simple embedding
      const charCode = text.charCodeAt(i);
      embedding.push((charCode % 1000) / 1000); // Normalize to 0-1 range
    } else {
      // Pad with zeros
      embedding.push(0);
    }
  }
  
  return embedding;
}

export function extractPlanTextForEmbedding(planContent: any): string {
  let text = '';
  
  // Add basic plan information
  if (planContent.title) text += planContent.title + ' ';
  if (planContent.description) text += planContent.description + ' ';
  if (planContent.duration) text += planContent.duration + ' ';
  if (planContent.calories) text += planContent.calories + ' ';
  
  // Add meal information
  if (planContent.dailyMeals && Array.isArray(planContent.dailyMeals)) {
    planContent.dailyMeals.forEach((day: any, dayIndex: number) => {
      text += `Day ${dayIndex + 1} `;
      
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: any) => {
          if (meal.name) text += meal.name + ' ';
          if (meal.description) text += meal.description + ' ';
          if (meal.mealType) text += meal.mealType + ' ';
          if (meal.calories) text += meal.calories + ' calories ';
          
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            text += meal.ingredients.join(' ') + ' ';
          }
          
          if (meal.instructions) text += meal.instructions + ' ';
        });
      }
    });
  }
  
  // Add legacy meal format support
  if (planContent.meals && Array.isArray(planContent.meals)) {
    planContent.meals.forEach((meal: any) => {
      if (meal.name) text += meal.name + ' ';
      if (meal.description) text += meal.description + ' ';
      if (meal.mealType) text += meal.mealType + ' ';
      if (meal.calories) text += meal.calories + ' calories ';
    });
  }
  
  return text.trim();
} 