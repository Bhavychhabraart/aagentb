-- Create table for vendor product photos
CREATE TABLE public.vendor_product_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  product_id UUID REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  template_name TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('solo', 'model')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vendor_product_photos ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own photos
CREATE POLICY "Vendors can view own photos" 
ON public.vendor_product_photos FOR SELECT 
USING (vendor_id = auth.uid());

-- Vendors can insert their own photos
CREATE POLICY "Vendors can insert own photos" 
ON public.vendor_product_photos FOR INSERT 
WITH CHECK (vendor_id = auth.uid());

-- Vendors can delete their own photos
CREATE POLICY "Vendors can delete own photos" 
ON public.vendor_product_photos FOR DELETE 
USING (vendor_id = auth.uid());