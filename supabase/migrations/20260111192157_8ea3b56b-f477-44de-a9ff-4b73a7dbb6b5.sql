-- Create design wizard sessions table
CREATE TABLE public.design_wizard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Step 1: Layout
  layout_file_url TEXT,
  layout_thumbnail_url TEXT,
  room_dimensions JSONB,
  room_type TEXT,
  
  -- Step 2: Mood Board
  mood_board_data JSONB,
  color_palette TEXT[],
  style_references JSONB,
  placed_products JSONB,
  custom_products JSONB,
  
  -- Step 3: Render
  generated_render_url TEXT,
  boq_data JSONB,
  
  -- Metadata
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.design_wizard_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wizard sessions" ON public.design_wizard_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wizard sessions" ON public.design_wizard_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard sessions" ON public.design_wizard_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wizard sessions" ON public.design_wizard_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_design_wizard_sessions_updated_at
  BEFORE UPDATE ON public.design_wizard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();