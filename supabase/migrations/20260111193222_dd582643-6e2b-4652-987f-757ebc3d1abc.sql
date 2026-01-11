-- Create layouts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'layouts',
  'layouts',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
);

-- Storage policies for layouts bucket
CREATE POLICY "Public can view layouts" ON storage.objects
  FOR SELECT USING (bucket_id = 'layouts');

CREATE POLICY "Authenticated users can upload layouts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'layouts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own layouts" ON storage.objects
  FOR UPDATE USING (bucket_id = 'layouts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own layouts" ON storage.objects
  FOR DELETE USING (bucket_id = 'layouts' AND auth.uid()::text = (storage.foldername(name))[1]);