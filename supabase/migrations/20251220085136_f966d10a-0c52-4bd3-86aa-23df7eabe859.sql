-- Create layouts table for 2D floor plans
CREATE TABLE public.layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT DEFAULT 'Untitled Layout',
  room_dimensions JSONB DEFAULT '{"width": 20, "depth": 15, "unit": "ft"}'::jsonb,
  canvas_data JSONB,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.layouts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own layouts"
ON public.layouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own layouts"
ON public.layouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layouts"
ON public.layouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layouts"
ON public.layouts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_layouts_updated_at
  BEFORE UPDATE ON public.layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();