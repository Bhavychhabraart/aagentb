-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  quote_type TEXT NOT NULL DEFAULT 'manual' CHECK (quote_type IN ('manual', 'render_analysis', 'custom_products', 'full_layout')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  source_render_url TEXT,
  source_layout_url TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  notes TEXT,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_versions table (Budget, Standard, Premium tiers)
CREATE TABLE public.quote_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  tier_level INTEGER NOT NULL DEFAULT 1 CHECK (tier_level BETWEEN 1 AND 3),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  commission NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_version_id UUID NOT NULL REFERENCES public.quote_versions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'catalog' CHECK (item_type IN ('catalog', 'custom', 'vendor')),
  catalog_item_id TEXT,
  vendor_product_id UUID REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  custom_product_id TEXT,
  item_name TEXT NOT NULL,
  item_category TEXT,
  item_description TEXT,
  item_image_url TEXT,
  material_id TEXT,
  material_name TEXT,
  material_category TEXT,
  finish_id TEXT,
  finish_name TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  material_upcharge NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  position_x NUMERIC,
  position_y NUMERIC,
  ai_confidence NUMERIC,
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_pricing table for market rates
CREATE TABLE public.material_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  material_category TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('budget', 'standard', 'premium')),
  base_rate NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'sqft',
  supplier_name TEXT,
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_pricing ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- Quote versions policies (access through parent quote)
CREATE POLICY "Users can view their quote versions" ON public.quote_versions FOR SELECT USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_versions.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can create quote versions" ON public.quote_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_versions.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can update their quote versions" ON public.quote_versions FOR UPDATE USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_versions.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can delete their quote versions" ON public.quote_versions FOR DELETE USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_versions.quote_id AND quotes.user_id = auth.uid()));

-- Quote items policies (access through parent quote_version)
CREATE POLICY "Users can view their quote items" ON public.quote_items FOR SELECT USING (EXISTS (SELECT 1 FROM quote_versions JOIN quotes ON quotes.id = quote_versions.quote_id WHERE quote_versions.id = quote_items.quote_version_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can create quote items" ON public.quote_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quote_versions JOIN quotes ON quotes.id = quote_versions.quote_id WHERE quote_versions.id = quote_items.quote_version_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can update their quote items" ON public.quote_items FOR UPDATE USING (EXISTS (SELECT 1 FROM quote_versions JOIN quotes ON quotes.id = quote_versions.quote_id WHERE quote_versions.id = quote_items.quote_version_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can delete their quote items" ON public.quote_items FOR DELETE USING (EXISTS (SELECT 1 FROM quote_versions JOIN quotes ON quotes.id = quote_versions.quote_id WHERE quote_versions.id = quote_items.quote_version_id AND quotes.user_id = auth.uid()));

-- Material pricing policies
CREATE POLICY "Users can view their own material pricing" ON public.material_pricing FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own material pricing" ON public.material_pricing FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own material pricing" ON public.material_pricing FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own material pricing" ON public.material_pricing FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_material_pricing_updated_at BEFORE UPDATE ON public.material_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster quote lookups
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_project_id ON public.quotes(project_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quote_versions_quote_id ON public.quote_versions(quote_id);
CREATE INDEX idx_quote_items_quote_version_id ON public.quote_items(quote_version_id);
CREATE INDEX idx_material_pricing_category ON public.material_pricing(material_category, tier);