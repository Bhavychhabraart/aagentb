-- Create staging_zones table for whole-house zone selection
CREATE TABLE public.staging_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Zone 1',
  -- Region definition (percentage-based coordinates)
  x_start DECIMAL NOT NULL,
  y_start DECIMAL NOT NULL,
  x_end DECIMAL NOT NULL,
  y_end DECIMAL NOT NULL,
  -- Camera settings for this zone
  camera_position TEXT DEFAULT 'perspective',
  camera_angle DECIMAL DEFAULT 0,
  -- Thumbnail of the zone
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staging_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own zones" 
ON public.staging_zones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own zones" 
ON public.staging_zones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zones" 
ON public.staging_zones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zones" 
ON public.staging_zones 
FOR DELETE 
USING (auth.uid() = user_id);