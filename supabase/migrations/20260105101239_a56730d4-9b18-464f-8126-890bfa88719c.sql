-- Create custom products table for storing AI-generated custom furniture specs
CREATE TABLE public.custom_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  render_id uuid REFERENCES public.renders(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text,
  description text,
  dimensions jsonb,
  materials jsonb,
  manufacturing jsonb,
  pricing jsonb,
  source_image_url text,
  position_x numeric,
  position_y numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom products"
  ON public.custom_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom products"
  ON public.custom_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom products"
  ON public.custom_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom products"
  ON public.custom_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_custom_products_project_id ON public.custom_products(project_id);
CREATE INDEX idx_custom_products_render_id ON public.custom_products(render_id);
CREATE INDEX idx_custom_products_user_id ON public.custom_products(user_id);