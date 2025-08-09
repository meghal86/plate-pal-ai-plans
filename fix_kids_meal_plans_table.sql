-- Check if kids_meal_plans table exists and create it if it doesn't
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') THEN
        -- Create the table
        CREATE TABLE kids_meal_plans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            kid_id UUID NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            duration INTEGER NOT NULL,
            plan_data JSONB NOT NULL,
            preferences JSONB,
            is_active BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES profiles(id)
        );

        -- Create indexes
        CREATE INDEX idx_kids_meal_plans_kid_id ON kids_meal_plans(kid_id);
        CREATE INDEX idx_kids_meal_plans_active ON kids_meal_plans(kid_id, is_active);

        -- Enable RLS
        ALTER TABLE kids_meal_plans ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy
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

        -- Create update trigger function
        CREATE OR REPLACE FUNCTION update_kids_meal_plans_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Create update trigger
        CREATE TRIGGER update_kids_meal_plans_updated_at
            BEFORE UPDATE ON kids_meal_plans
            FOR EACH ROW
            EXECUTE FUNCTION update_kids_meal_plans_updated_at();

        -- Create single active plan function
        CREATE OR REPLACE FUNCTION ensure_single_active_plan()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF NEW.is_active = true THEN
                UPDATE kids_meal_plans 
                SET is_active = false 
                WHERE kid_id = NEW.kid_id AND id != NEW.id;
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Create single active plan trigger
        CREATE TRIGGER ensure_single_active_plan_trigger
            BEFORE INSERT OR UPDATE ON kids_meal_plans
            FOR EACH ROW
            EXECUTE FUNCTION ensure_single_active_plan();

        RAISE NOTICE 'kids_meal_plans table created successfully';
    ELSE
        RAISE NOTICE 'kids_meal_plans table already exists';
    END IF;
END
$$;