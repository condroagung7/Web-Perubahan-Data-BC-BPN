-- Migration: Create telegram_admins table for Telegram notification settings
CREATE TABLE IF NOT EXISTS telegram_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  chat_id text NOT NULL UNIQUE,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE telegram_admins ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (admin API uses service role client)
-- No public access needed