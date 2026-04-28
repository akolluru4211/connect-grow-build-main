-- Drop the overly permissive INSERT policy for blog-images bucket
DROP POLICY "Authenticated users can upload blog images" ON storage.objects;

-- Create user-scoped INSERT policy (users can only upload to their own folder)
CREATE POLICY "Users can upload blog images to their folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'blog-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);