-- Add polygon_points column to store array of {x, y} percentage coordinates
ALTER TABLE staging_zones ADD COLUMN polygon_points jsonb DEFAULT '[]'::jsonb;