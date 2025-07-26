
-- Update storage policies to allow demo uploads without authentication
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create new policies that allow demo uploads
CREATE POLICY "Allow demo uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'nutrition-files' 
  AND (storage.foldername(name))[1] = 'demo'
);

CREATE POLICY "Allow demo file viewing" ON storage.objects
FOR SELECT USING (
  bucket_id = 'nutrition-files' 
  AND (storage.foldername(name))[1] = 'demo'
);

CREATE POLICY "Allow demo file updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'nutrition-files' 
  AND (storage.foldername(name))[1] = 'demo'
);

CREATE POLICY "Allow demo file deletion" ON storage.objects
FOR DELETE USING (
  bucket_id = 'nutrition-files' 
  AND (storage.foldername(name))[1] = 'demo'
);
