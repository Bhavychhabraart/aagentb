-- Allow public read access to room-uploads bucket (it's already marked as public)
CREATE POLICY "Public can view room-uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'room-uploads');

-- Allow authenticated users to upload to room-uploads
CREATE POLICY "Authenticated users can upload to room-uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'room-uploads' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads in room-uploads
CREATE POLICY "Users can update their own room-uploads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'room-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads in room-uploads
CREATE POLICY "Users can delete their own room-uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'room-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);