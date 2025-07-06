
-- Create storage policy to allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nutrition-files', 'nutrition-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'nutrition-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'nutrition-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'nutrition-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'nutrition-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
