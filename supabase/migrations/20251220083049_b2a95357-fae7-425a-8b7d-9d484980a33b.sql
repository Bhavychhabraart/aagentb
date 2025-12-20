-- Create vendor_requests table for tracking custom furniture quote requests
CREATE TABLE public.vendor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  furniture_name TEXT NOT NULL,
  furniture_image_url TEXT,
  furniture_description TEXT,
  bom_data JSONB,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own vendor requests" 
ON public.vendor_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendor requests" 
ON public.vendor_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor requests" 
ON public.vendor_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendor requests" 
ON public.vendor_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_requests_updated_at
BEFORE UPDATE ON public.vendor_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();