-- Add render_id column to link staged items to specific renders
ALTER TABLE public.staged_furniture 
ADD COLUMN render_id uuid REFERENCES public.renders(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_staged_furniture_render_id ON public.staged_furniture(render_id);