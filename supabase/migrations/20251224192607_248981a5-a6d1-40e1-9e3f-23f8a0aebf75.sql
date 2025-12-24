-- Create cameras table for camera placement on bird's eye view
CREATE TABLE public.cameras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Camera 1',
  x_position NUMERIC NOT NULL DEFAULT 50,
  y_position NUMERIC NOT NULL DEFAULT 50,
  rotation NUMERIC NOT NULL DEFAULT 0,
  fov_angle NUMERIC NOT NULL DEFAULT 60,
  capture_width NUMERIC NOT NULL DEFAULT 100,
  capture_height NUMERIC NOT NULL DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cameras table
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- RLS policies for cameras
CREATE POLICY "Users can view their own cameras" 
ON public.cameras 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cameras" 
ON public.cameras 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cameras" 
ON public.cameras 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cameras" 
ON public.cameras 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add room locking columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN locked_render_url TEXT;

-- Create trigger for updating cameras updated_at
CREATE TRIGGER update_cameras_updated_at
BEFORE UPDATE ON public.cameras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();