-- Migration 007: Add Max messenger credentials to clinics
-- Max bot token (encrypted) and chat ID for appointment notifications

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS max_bot_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS max_chat_id TEXT;
