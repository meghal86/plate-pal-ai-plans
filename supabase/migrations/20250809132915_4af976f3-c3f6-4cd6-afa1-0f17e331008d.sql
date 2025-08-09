-- Relax insert/select policies to allow creators without explicit family_members row
DROP POLICY IF EXISTS "Users can insert kids meal plans for their family kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can view kids meal plans they have access to" ON public.kids_meal_plans;

-- SELECT: creator, kid creator, family creator, or accepted family member
CREATE POLICY "Users can view kids meal plans they have access to"
ON public.kids_meal_plans
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.kids_profiles kp
    WHERE kp.id = kids_meal_plans.kid_id
      AND (
        kp.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.families f
          WHERE f.id = kp.family_id AND f.created_by = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.family_id = kp.family_id AND fm.user_id = auth.uid() AND fm.status = 'accepted'
        )
      )
  )
);

-- INSERT: require created_by = auth.uid and linkage to a kid the user owns or can access via family
CREATE POLICY "Users can insert kids meal plans for their family kids"
ON public.kids_meal_plans
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.kids_profiles kp
    WHERE kp.id = kids_meal_plans.kid_id
      AND (
        kp.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.families f
          WHERE f.id = kp.family_id AND f.created_by = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.family_id = kp.family_id AND fm.user_id = auth.uid() AND fm.status = 'accepted'
        )
      )
  )
);