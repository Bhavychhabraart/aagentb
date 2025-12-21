-- Create custom_finishes table for user-uploaded finishes
CREATE TABLE public.custom_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Custom',
  image_url TEXT NOT NULL,
  color_hex TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_finishes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own custom finishes" 
ON public.custom_finishes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom finishes" 
ON public.custom_finishes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom finishes" 
ON public.custom_finishes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for custom finishes
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-finishes', 'custom-finishes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custom finishes bucket
CREATE POLICY "Users can upload custom finishes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'custom-finishes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view custom finishes"
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-finishes');

CREATE POLICY "Users can delete their own custom finishes files"
ON storage.objects FOR DELETE
USING (bucket_id = 'custom-finishes' AND auth.uid()::text = (storage.foldername(name))[1]);