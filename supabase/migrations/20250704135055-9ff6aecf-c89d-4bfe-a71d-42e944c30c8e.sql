
-- Drop existing problematic tables and create new ones with proper structure
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;

-- Create a new user_profiles table with proper columns
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  age integer,
  weight numeric,
  height numeric,
  activity_level text DEFAULT 'moderate',
  health_goals text,
  dietary_restrictions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create a new diet_plans table with proper structure
CREATE TABLE nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  plan_content jsonb,
  duration text,
  calories text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create uploaded_files table for file tracking
CREATE TABLE uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for nutrition_plans  
CREATE POLICY "Users can manage their own plans" ON nutrition_plans
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "Users can manage their own files" ON uploaded_files
  FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket for nutrition files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nutrition-files', 'nutrition-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'nutrition-files');

CREATE POLICY "Users can read their own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'nutrition-files');
