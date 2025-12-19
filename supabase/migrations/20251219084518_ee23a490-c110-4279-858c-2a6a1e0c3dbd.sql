-- Add type column to room_uploads to distinguish between layout and room photo
ALTER TABLE public.room_uploads 
ADD COLUMN IF NOT EXISTS upload_type text NOT NULL DEFAULT 'room_photo';

-- Create style_uploads table for mood board / style reference images
CREATE TABLE public.style_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on style_uploads
ALTER TABLE public.style_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for style_uploads
CREATE POLICY "Users can view their own style uploads"
ON public.style_uploads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own style uploads"
ON public.style_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style uploads"
ON public.style_uploads FOR DELETE
USING (auth.uid() = user_id);

-- Create product_items table for furniture/product references
CREATE TABLE public.product_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  product_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on product_items
ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_items
CREATE POLICY "Users can view their own product items"
ON public.product_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product items"
ON public.product_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product items"
ON public.product_items FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own product items"
ON public.product_items FOR UPDATE
USING (auth.uid() = user_id);