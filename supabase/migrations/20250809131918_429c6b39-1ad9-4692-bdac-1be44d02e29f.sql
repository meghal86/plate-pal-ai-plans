-- Create kids_meal_plans table for Kids School Meal Planner (retry without IF NOT EXISTS for policies)
CREATE TABLE IF NOT EXISTS public.kids_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration integer NOT NULL,
  plan_data jsonb NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key to kids_profiles (safe public reference)
DO $$ BEGIN
  ALTER TABLE public.kids_meal_plans
    ADD CONSTRAINT kids_meal_plans_kid_id_fkey
    FOREIGN KEY (kid_id) REFERENCES public.kids_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  -- ignore if already exists
  NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE public.kids_meal_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view kids meal plans they have access to" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can insert kids meal plans for their family kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can update their own kids meal plans" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can delete their own kids meal plans" ON public.kids_meal_plans;

-- Select policy: creator or accepted family members of the kid's family
CREATE POLICY "Users can view kids meal plans they have access to"
ON public.kids_meal_plans
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.kids_profiles kp
    JOIN public.family_members fm ON fm.family_id = kp.family_id
    WHERE kp.id = kids_meal_plans.kid_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'accepted'
  )
);

-- Insert policy: creators who are accepted members of the kid's family
CREATE POLICY "Users can insert kids meal plans for their family kids"
ON public.kids_meal_plans
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.kids_profiles kp
    JOIN public.family_members fm ON fm.family_id = kp.family_id
    WHERE kp.id = kids_meal_plans.kid_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'accepted'
  )
);

-- Update/Delete policy: only creator can modify/delete
CREATE POLICY "Users can update their own kids meal plans"
ON public.kids_meal_plans
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own kids meal plans"
ON public.kids_meal_plans
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Timestamp trigger for updated_at
DROP TRIGGER IF EXISTS update_kids_meal_plans_updated_at ON public.kids_meal_plans;
CREATE TRIGGER update_kids_meal_plans_updated_at
BEFORE UPDATE ON public.kids_meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_kmp_kid_id ON public.kids_meal_plans (kid_id);
CREATE INDEX IF NOT EXISTS idx_kmp_created_by ON public.kids_meal_plans (created_by);
CREATE INDEX IF NOT EXISTS idx_kmp_is_active ON public.kids_meal_plans (is_active);