-- Add view_type column to renders table for tracking different render types
ALTER TABLE public.renders ADD COLUMN IF NOT EXISTS view_type text DEFAULT 'original';

-- Add a comment explaining the column
COMMENT ON COLUMN public.renders.view_type IS 'Type of render: original, edit, composite, view_perspective, view_front, view_side, view_top, view_cinematic, view_custom';