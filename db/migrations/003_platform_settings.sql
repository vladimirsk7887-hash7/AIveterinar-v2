-- Migration 003: Platform settings table
-- Stores platform-level configuration (AI provider defaults, encrypted API keys)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only superadmin (service role) can access this table
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- No public access — all access via service role key (supabaseAdmin)
CREATE POLICY "No public access" ON platform_settings
  FOR ALL USING (false);
