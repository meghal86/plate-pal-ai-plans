-- Make the nutrition-files bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'nutrition-files';

-- Create storage policies for nutrition-files bucket
CREATE POLICY "Allow public uploads to nutrition-files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'nutrition-files');

CREATE POLICY "Allow public access to nutrition-files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'nutrition-files');

CREATE POLICY "Allow public updates to nutrition-files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'nutrition-files');

CREATE POLICY "Allow public deletes from nutrition-files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'nutrition-files');