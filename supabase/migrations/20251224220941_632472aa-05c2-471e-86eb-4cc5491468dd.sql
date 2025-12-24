-- Agent B Knowledge table for storing all types of knowledge
CREATE TABLE public.agent_b_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('layout', 'design', 'style', 'rule', 'preference')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  file_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  weight NUMERIC DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layout templates that Agent B can reference
CREATE TABLE public.agent_b_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT,
  room_dimensions JSONB,
  canvas_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style collections for Agent B
CREATE TABLE public.agent_b_style_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  colors TEXT[],
  materials TEXT[],
  furniture_styles TEXT[],
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.agent_b_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_b_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_b_style_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_b_knowledge
CREATE POLICY "Users can view their own knowledge" ON public.agent_b_knowledge
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge" ON public.agent_b_knowledge
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge" ON public.agent_b_knowledge
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge" ON public.agent_b_knowledge
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_b_layout_templates
CREATE POLICY "Users can view their own layout templates" ON public.agent_b_layout_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own layout templates" ON public.agent_b_layout_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layout templates" ON public.agent_b_layout_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layout templates" ON public.agent_b_layout_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_b_style_collections
CREATE POLICY "Users can view their own style collections" ON public.agent_b_style_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own style collections" ON public.agent_b_style_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style collections" ON public.agent_b_style_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style collections" ON public.agent_b_style_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger for agent_b_knowledge
CREATE TRIGGER update_agent_b_knowledge_updated_at
  BEFORE UPDATE ON public.agent_b_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();