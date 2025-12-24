-- Create design_preferences table to store learned user preferences
CREATE TABLE public.design_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'style', 'color', 'furniture', 'function', 'lighting', 'budget'
  preference_key TEXT NOT NULL,
  weight NUMERIC DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT, -- 'agent_b_answer', 'style_ref', 'staged_product', 'render_approved'
  UNIQUE(user_id, category, preference_key)
);

-- Enable RLS
ALTER TABLE public.design_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_preferences
CREATE POLICY "Users can view their own preferences"
ON public.design_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
ON public.design_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.design_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON public.design_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Create design_memory_settings table for user memory toggle
CREATE TABLE public.design_memory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  memory_enabled BOOLEAN DEFAULT true,
  auto_learn BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_memory_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_memory_settings
CREATE POLICY "Users can view their own memory settings"
ON public.design_memory_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory settings"
ON public.design_memory_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory settings"
ON public.design_memory_settings FOR UPDATE
USING (auth.uid() = user_id);