-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'spouse', 'guardian', 'caregiver')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kids_profiles table
CREATE TABLE IF NOT EXISTS kids_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    dietary_restrictions TEXT[],
    allergies TEXT[],
    favorite_foods TEXT[],
    disliked_foods TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kids_growth_records table
CREATE TABLE IF NOT EXISTS kids_growth_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kid_id UUID REFERENCES kids_profiles(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kids_nutrition_logs table
CREATE TABLE IF NOT EXISTS kids_nutrition_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kid_id UUID REFERENCES kids_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    calcium_mg INTEGER,
    iron_mg DECIMAL(4,2),
    notes TEXT,
    logged_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add family_id to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_kids_profiles_family_id ON kids_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_kids_growth_records_kid_id ON kids_growth_records(kid_id);
CREATE INDEX IF NOT EXISTS idx_kids_nutrition_logs_kid_id ON kids_nutrition_logs(kid_id);

-- Enable Row Level Security (RLS)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_members
CREATE POLICY "Users can view their own family memberships" ON family_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family memberships" ON family_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family memberships" ON family_members
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for families
CREATE POLICY "Family members can view their family" ON families
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = families.id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );

CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for kids_profiles
CREATE POLICY "Family members can view kids in their family" ON kids_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = kids_profiles.family_id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );

CREATE POLICY "Family members can create kids in their family" ON kids_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = kids_profiles.family_id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );

CREATE POLICY "Family members can update kids in their family" ON kids_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = kids_profiles.family_id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );

-- RLS Policies for kids_growth_records
CREATE POLICY "Family members can view growth records for kids in their family" ON kids_growth_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kids_profiles kp
            JOIN family_members fm ON fm.family_id = kp.family_id
            WHERE kp.id = kids_growth_records.kid_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        )
    );

CREATE POLICY "Family members can create growth records for kids in their family" ON kids_growth_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kids_profiles kp
            JOIN family_members fm ON fm.family_id = kp.family_id
            WHERE kp.id = kids_growth_records.kid_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        )
    );

-- RLS Policies for kids_nutrition_logs
CREATE POLICY "Family members can view nutrition logs for kids in their family" ON kids_nutrition_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kids_profiles kp
            JOIN family_members fm ON fm.family_id = kp.family_id
            WHERE kp.id = kids_nutrition_logs.kid_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        )
    );

CREATE POLICY "Family members can create nutrition logs for kids in their family" ON kids_nutrition_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kids_profiles kp
            JOIN family_members fm ON fm.family_id = kp.family_id
            WHERE kp.id = kids_nutrition_logs.kid_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        )
    );

-- Create function to automatically create family when user creates first family member
CREATE OR REPLACE FUNCTION create_family_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- If user doesn't have a family yet, create one
    IF NOT EXISTS (
        SELECT 1 FROM families 
        WHERE created_by = NEW.user_id
    ) THEN
        INSERT INTO families (name, created_by)
        VALUES ('My Family', NEW.user_id);
    END IF;
    
    -- Set the family_id for the new family member
    NEW.family_id = (
        SELECT id FROM families 
        WHERE created_by = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 1
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create family
CREATE TRIGGER trigger_create_family_for_user
    BEFORE INSERT ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION create_family_for_user();

-- Create function to update user_profiles family_id when family is created
CREATE OR REPLACE FUNCTION update_user_profile_family_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_profiles with the new family_id
    UPDATE user_profiles 
    SET family_id = NEW.id
    WHERE user_id = NEW.created_by;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user_profiles
CREATE TRIGGER trigger_update_user_profile_family_id
    AFTER INSERT ON families
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_family_id(); 