-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'vendor');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendor products table
CREATE TABLE public.vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    sku TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_products
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- Vendors can CRUD their own products
CREATE POLICY "Vendors can view their own products"
ON public.vendor_products FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create products"
ON public.vendor_products FOR INSERT
WITH CHECK (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can update their own products"
ON public.vendor_products FOR UPDATE
USING (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can delete their own products"
ON public.vendor_products FOR DELETE
USING (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'));

-- All authenticated users can view active vendor products (for staging)
CREATE POLICY "Users can view active vendor products"
ON public.vendor_products FOR SELECT
USING (is_active = true);

-- Add vendor tracking to order_items
ALTER TABLE public.order_items ADD COLUMN vendor_id UUID REFERENCES auth.users(id);
ALTER TABLE public.order_items ADD COLUMN vendor_product_id UUID REFERENCES public.vendor_products(id);

-- Update order_items RLS to allow vendors to view their sales
CREATE POLICY "Vendors can view order items with their products"
ON public.order_items FOR SELECT
USING (vendor_id = auth.uid());

-- Trigger for updated_at on vendor_products
CREATE TRIGGER update_vendor_products_updated_at
BEFORE UPDATE ON public.vendor_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();