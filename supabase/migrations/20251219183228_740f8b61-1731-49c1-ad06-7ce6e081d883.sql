-- Add parent_render_id to track render version history
ALTER TABLE public.renders 
ADD COLUMN parent_render_id uuid REFERENCES public.renders(id) ON DELETE SET NULL;

-- Add index for faster parent render lookups
CREATE INDEX idx_renders_parent_render_id ON public.renders(parent_render_id);