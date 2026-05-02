-- Migration 003: Direct messages between creators and businesses
-- Idempotent.

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'business')),
  sender_id   INTEGER NOT NULL,
  receiver_type VARCHAR(10) NOT NULL CHECK (receiver_type IN ('user', 'business')),
  receiver_id INTEGER NOT NULL,
  body        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created  ON messages(created_at DESC);
