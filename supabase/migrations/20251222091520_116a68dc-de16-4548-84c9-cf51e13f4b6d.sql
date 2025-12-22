-- Create rooms table for multi-room support within projects
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Room',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms
CREATE POLICY "Users can view their own rooms" 
ON public.rooms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rooms" 
ON public.rooms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms" 
ON public.rooms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add room_id to room_uploads table
ALTER TABLE public.room_uploads 
ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Add room_id to renders table  
ALTER TABLE public.renders 
ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Add room_id to staged_furniture table
ALTER TABLE public.staged_furniture 
ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Add room_id to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Create trigger for updating updated_at on rooms
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();