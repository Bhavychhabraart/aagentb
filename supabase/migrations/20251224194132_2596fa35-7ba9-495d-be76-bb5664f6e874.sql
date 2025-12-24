-- Add position columns to staged_furniture table for tracking furniture location in renders
ALTER TABLE public.staged_furniture 
  ADD COLUMN x_position NUMERIC DEFAULT 50,
  ADD COLUMN y_position NUMERIC DEFAULT 50,
  ADD COLUMN width_percent NUMERIC DEFAULT 20,
  ADD COLUMN height_percent NUMERIC DEFAULT 20;