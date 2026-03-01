-- Migration 006: Add source column to appointments and conversations
-- Tracks which channel originated the booking (widget | max | tg)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'widget';

-- Also fix conversations: widget.js hardcodes 'widget', accept override via API
-- No schema change needed for conversations (source column already exists from migration 001)
