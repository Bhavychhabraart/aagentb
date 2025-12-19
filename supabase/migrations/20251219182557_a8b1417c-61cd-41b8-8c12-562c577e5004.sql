-- Create table for staged furniture items per project
CREATE TABLE public.staged_furniture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  catalog_item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  item_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, catalog_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.staged_furniture ENABLE ROW LEVEL SECURITY;

-- Users can view their own staged items
CREATE POLICY "Users can view their own staged furniture"
ON public.staged_furniture
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add staged items to their projects
CREATE POLICY "Users can add staged furniture"
ON public.staged_furniture
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove staged items from their projects
CREATE POLICY "Users can delete their own staged furniture"
ON public.staged_furniture
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_staged_furniture_project ON public.staged_furniture(project_id);