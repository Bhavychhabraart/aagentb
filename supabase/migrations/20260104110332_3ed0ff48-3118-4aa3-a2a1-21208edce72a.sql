-- Add layout_reference_url to track which layout image a zone was drawn on
ALTER TABLE public.staging_zones 
ADD COLUMN IF NOT EXISTS layout_reference_url TEXT;