-- LifeOS Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Responsibilities table
CREATE TABLE IF NOT EXISTS responsibilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  energy_required TEXT NOT NULL CHECK (energy_required IN ('low', 'medium', 'high')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one-time', 'recurring')),
  schedule_datetime TIMESTAMPTZ NOT NULL,
  schedule_rrule TEXT,
  schedule_timezone TEXT,
  reminder_intensity TEXT NOT NULL CHECK (reminder_intensity IN ('gentle', 'persistent', 'critical')),
  escalation_rules JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed', 'snoozed', 'archived')),
  created_from TEXT DEFAULT 'text' CHECK (created_from IN ('text', 'voice', 'photo')),
  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('market', 'home', 'work', 'custom')),
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'tr')),
  reminder_intensity TEXT DEFAULT 'gentle' CHECK (reminder_intensity IN ('gentle', 'persistent', 'critical')),
  briefing_schedule JSONB DEFAULT '{"morning": true, "evening": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_responsibilities_user_id ON responsibilities(user_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_status ON responsibilities(status);
CREATE INDEX IF NOT EXISTS idx_responsibilities_schedule_datetime ON responsibilities(schedule_datetime);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for responsibilities
CREATE POLICY "Users can view their own responsibilities"
  ON responsibilities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responsibilities"
  ON responsibilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responsibilities"
  ON responsibilities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responsibilities"
  ON responsibilities FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for lists
CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for settings
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_responsibilities_updated_at
  BEFORE UPDATE ON responsibilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

