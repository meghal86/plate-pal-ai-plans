-- Create kids_meal_plans table
CREATE TABLE kids_meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kid_id UUID NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- number of days
    plan_data JSONB NOT NULL, -- stores the complete meal plan
    preferences JSONB, -- stores the preferences used to generate the plan
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create index for faster queries
CREATE INDEX idx_kids_meal_plans_kid_id ON kids_meal_plans(kid_id);
CREATE INDEX idx_kids_meal_plans_active ON kids_meal_plans(kid_id, is_active);

-- Add RLS policies
ALTER TABLE kids_meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access meal plans for kids in their family
CREATE POLICY "Users can access meal plans for their family kids" ON kids_meal_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kids_profiles kp
            JOIN family_members fm ON kp.family_id = fm.family_id
            JOIN profiles p ON fm.user_id = p.id
            WHERE kp.id = kids_meal_plans.kid_id
            AND p.id = auth.uid()
        )
    );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_kids_meal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_kids_meal_plans_updated_at
    BEFORE UPDATE ON kids_meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_kids_meal_plans_updated_at();

-- Function to ensure only one active plan per kid
CREATE OR REPLACE FUNCTION ensure_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a plan to active, deactivate all other plans for this kid
    IF NEW.is_active = true THEN
        UPDATE kids_meal_plans 
        SET is_active = false 
        WHERE kid_id = NEW.kid_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active plan per kid
CREATE TRIGGER ensure_single_active_plan_trigger
    BEFORE INSERT OR UPDATE ON kids_meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_plan();