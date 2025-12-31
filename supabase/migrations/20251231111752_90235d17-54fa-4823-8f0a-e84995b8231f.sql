-- Create room_geometry table for storing frozen geometry data
CREATE TABLE IF NOT EXISTS public.room_geometry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  layout_hash TEXT NOT NULL,
  geometry_data JSONB NOT NULL DEFAULT '{}',
  camera_matrix JSONB NOT NULL DEFAULT '{}',
  floor_polygon JSONB NOT NULL DEFAULT '[]',
  wall_normals JSONB NOT NULL DEFAULT '{}',
  furniture_anchors JSONB NOT NULL DEFAULT '[]',
  control_signals JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  UNIQUE(layout_hash, user_id)
);

-- Enable RLS
ALTER TABLE public.room_geometry ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own geometry" ON public.room_geometry FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own geometry" ON public.room_geometry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own geometry" ON public.room_geometry FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own geometry" ON public.room_geometry FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_room_geometry_updated_at
  BEFORE UPDATE ON public.room_geometry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();