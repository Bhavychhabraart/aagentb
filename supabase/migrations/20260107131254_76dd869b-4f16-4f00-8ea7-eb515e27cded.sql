-- Create mood_boards table
CREATE TABLE public.mood_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  analysis JSONB,
  extracted_products JSONB,
  extracted_styles JSONB,
  placement_instructions JSONB,
  floor_plan_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mood_board_products table
CREATE TABLE public.mood_board_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_board_id UUID REFERENCES mood_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  placement_zone TEXT,
  placement_instruction TEXT,
  position_in_layout JSONB,
  linked_catalog_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_board_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_boards
CREATE POLICY "Users can view their own mood boards" ON public.mood_boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood boards" ON public.mood_boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood boards" ON public.mood_boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood boards" ON public.mood_boards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for mood_board_products
CREATE POLICY "Users can view their mood board products" ON public.mood_board_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mood_boards
      WHERE mood_boards.id = mood_board_products.mood_board_id
      AND mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create mood board products" ON public.mood_board_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mood_boards
      WHERE mood_boards.id = mood_board_products.mood_board_id
      AND mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their mood board products" ON public.mood_board_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mood_boards
      WHERE mood_boards.id = mood_board_products.mood_board_id
      AND mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their mood board products" ON public.mood_board_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mood_boards
      WHERE mood_boards.id = mood_board_products.mood_board_id
      AND mood_boards.user_id = auth.uid()
    )
  );

-- Create storage bucket for mood boards
INSERT INTO storage.buckets (id, name, public) VALUES ('mood-boards', 'mood-boards', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload mood boards" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mood-boards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view mood boards" ON storage.objects
  FOR SELECT USING (bucket_id = 'mood-boards');

CREATE POLICY "Users can delete their mood boards" ON storage.objects
  FOR DELETE USING (bucket_id = 'mood-boards' AND auth.uid()::text = (storage.foldername(name))[1]);