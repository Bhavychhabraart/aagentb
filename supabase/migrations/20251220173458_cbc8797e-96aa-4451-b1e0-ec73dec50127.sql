-- Add indexes to improve query performance and fix timeouts

-- Index for renders table queries (filter by project_id, status, order by created_at)
CREATE INDEX IF NOT EXISTS idx_renders_project_status ON public.renders (project_id, status);
CREATE INDEX IF NOT EXISTS idx_renders_status_created ON public.renders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renders_user_id ON public.renders (user_id);

-- Index for chat_messages table queries (filter by project_id, order by created_at)
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON public.chat_messages (project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_created ON public.chat_messages (project_id, created_at);

-- Index for staged_furniture table queries (filter by user_id)
CREATE INDEX IF NOT EXISTS idx_staged_furniture_user ON public.staged_furniture (user_id);