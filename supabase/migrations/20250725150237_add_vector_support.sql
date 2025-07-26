-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector embedding column to nutrition_plans table
ALTER TABLE nutrition_plans 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an index for vector similarity search
CREATE INDEX IF NOT EXISTS nutrition_plans_embedding_idx 
ON nutrition_plans 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to generate embeddings for plan content
CREATE OR REPLACE FUNCTION generate_plan_embedding(plan_content jsonb)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
  embedding_vector vector(1536);
  plan_text text;
BEGIN
  -- Extract text content from plan for embedding
  plan_text := COALESCE(
    plan_content->>'title', ''
  ) || ' ' || COALESCE(
    plan_content->>'description', ''
  ) || ' ' || COALESCE(
    plan_content->>'duration', ''
  ) || ' ' || COALESCE(
    plan_content->>'calories', ''
  );
  
  -- Extract meal information for better semantic search
  IF plan_content ? 'dailyMeals' THEN
    plan_text := plan_text || ' ' || (
      SELECT string_agg(
        COALESCE(day->>'date', '') || ' ' ||
        COALESCE(day->>'day', '') || ' ' ||
        (
          SELECT string_agg(
            COALESCE(meal->>'name', '') || ' ' ||
            COALESCE(meal->>'description', '') || ' ' ||
            COALESCE(meal->>'mealType', '') || ' ' ||
            COALESCE(meal->>'calories', '') || ' ' ||
            COALESCE(meal->>'ingredients', '[]') || ' ' ||
            COALESCE(meal->>'instructions', ''),
            ' '
          )
          FROM jsonb_array_elements(day->'meals') AS meal
        ),
        ' '
      )
      FROM jsonb_array_elements(plan_content->'dailyMeals') AS day
    );
  END IF;
  
  -- For now, we'll use a placeholder embedding
  -- In production, this would call an embedding service like OpenAI or Google
  -- For demonstration, we'll create a simple hash-based embedding
  embedding_vector := (
    SELECT ('[' || string_agg(
      (ascii(substr(plan_text, i, 1)) % 1000)::text, 
      ','
    ) || ']')::vector
    FROM generate_series(1, least(length(plan_text), 1536)) AS i
  );
  
  RETURN embedding_vector;
END;
$$;

-- Create a function to update embeddings when plan content changes
CREATE OR REPLACE FUNCTION update_plan_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan_content IS NOT NULL AND (OLD.plan_content IS NULL OR NEW.plan_content != OLD.plan_content) THEN
    NEW.embedding := generate_plan_embedding(NEW.plan_content);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update embeddings
DROP TRIGGER IF EXISTS nutrition_plans_embedding_trigger ON nutrition_plans;
CREATE TRIGGER nutrition_plans_embedding_trigger
  BEFORE INSERT OR UPDATE ON nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_embedding();

-- Create a function for semantic search of plans
CREATE OR REPLACE FUNCTION search_plans_by_similarity(
  search_query text,
  user_id uuid,
  similarity_threshold float DEFAULT 0.7,
  limit_count int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  duration text,
  calories text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Generate embedding for the search query
  query_embedding := generate_plan_embedding(jsonb_build_object('title', search_query));
  
  -- Return plans ordered by similarity
  RETURN QUERY
  SELECT 
    np.id,
    np.title,
    np.description,
    np.duration,
    np.calories,
    1 - (np.embedding <=> query_embedding) as similarity
  FROM nutrition_plans np
  WHERE np.user_id = search_plans_by_similarity.user_id
    AND np.embedding IS NOT NULL
    AND 1 - (np.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY np.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$;

-- Create a function to find similar plans
CREATE OR REPLACE FUNCTION find_similar_plans(
  plan_id uuid,
  user_id uuid,
  similarity_threshold float DEFAULT 0.8,
  limit_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  duration text,
  calories text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  plan_embedding vector(1536);
BEGIN
  -- Get the embedding of the reference plan
  SELECT embedding INTO plan_embedding
  FROM nutrition_plans
  WHERE id = plan_id AND user_id = find_similar_plans.user_id;
  
  IF plan_embedding IS NULL THEN
    RETURN;
  END IF;
  
  -- Return similar plans
  RETURN QUERY
  SELECT 
    np.id,
    np.title,
    np.description,
    np.duration,
    np.calories,
    1 - (np.embedding <=> plan_embedding) as similarity
  FROM nutrition_plans np
  WHERE np.user_id = find_similar_plans.user_id
    AND np.id != plan_id
    AND np.embedding IS NOT NULL
    AND 1 - (np.embedding <=> plan_embedding) >= similarity_threshold
  ORDER BY np.embedding <=> plan_embedding
  LIMIT limit_count;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION generate_plan_embedding IS 'Generates vector embeddings for nutrition plan content for semantic search';
COMMENT ON FUNCTION search_plans_by_similarity IS 'Searches for nutrition plans by semantic similarity to a query';
COMMENT ON FUNCTION find_similar_plans IS 'Finds nutrition plans similar to a given plan'; 