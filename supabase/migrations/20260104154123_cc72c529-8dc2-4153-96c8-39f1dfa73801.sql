-- Add indexes for frequently queried columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_room_uploads_project ON room_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_room_uploads_project_type ON room_uploads(project_id, upload_type);
CREATE INDEX IF NOT EXISTS idx_style_uploads_project ON style_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_product_items_project ON product_items(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_project ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_renders_project_status ON renders(project_id, status);
CREATE INDEX IF NOT EXISTS idx_renders_project_created ON renders(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staged_furniture_project ON staged_furniture(project_id);
CREATE INDEX IF NOT EXISTS idx_staging_zones_project ON staging_zones(project_id);