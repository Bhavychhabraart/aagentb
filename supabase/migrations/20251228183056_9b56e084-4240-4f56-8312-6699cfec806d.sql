-- Create custom_materials table for user-uploaded materials
CREATE TABLE public.custom_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Custom',
  subcategory text,
  description text,
  image_url text NOT NULL,
  color_hex text,
  properties jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  share_token text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_materials
CREATE POLICY "Users can create their own materials"
  ON public.custom_materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own materials"
  ON public.custom_materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public materials"
  ON public.custom_materials FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can update their own materials"
  ON public.custom_materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON public.custom_materials FOR DELETE
  USING (auth.uid() = user_id);

-- Add sharing columns to staged_furniture
ALTER TABLE public.staged_furniture
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone;

-- Create shared_products table for tracking shares
CREATE TABLE public.shared_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.staged_furniture(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL,
  share_token text UNIQUE NOT NULL,
  is_public boolean DEFAULT false,
  shared_with_user_id uuid,
  allow_copy boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS on shared_products
ALTER TABLE public.shared_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_products
CREATE POLICY "Users can create shares for their products"
  ON public.shared_products FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can view their own shares"
  ON public.shared_products FOR SELECT
  USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Anyone can view shares by token"
  ON public.shared_products FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can delete their own shares"
  ON public.shared_products FOR DELETE
  USING (auth.uid() = shared_by_user_id);

-- Update staged_furniture RLS to allow viewing public products
CREATE POLICY "Anyone can view public staged furniture"
  ON public.staged_furniture FOR SELECT
  USING (is_public = true);

-- Create storage bucket for custom materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-materials', 'custom-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custom-materials bucket
CREATE POLICY "Users can upload custom materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'custom-materials');

CREATE POLICY "Anyone can view custom materials"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'custom-materials');

CREATE POLICY "Users can delete their custom materials"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'custom-materials');