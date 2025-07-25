-- Update RLS policy for uploaded_files to allow inserts for testing
DROP POLICY IF EXISTS "Users can manage their own files" ON uploaded_files;

-- Create separate policies for different operations
CREATE POLICY "Allow file uploads for testing" 
ON uploaded_files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own files" 
ON uploaded_files 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own files" 
ON uploaded_files 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own files" 
ON uploaded_files 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);