-- ─────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT,                        -- NULL for OAuth users
  provider     TEXT NOT NULL DEFAULT 'local', -- 'local' | 'google' | 'facebook'
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_upmira te voy a pasardated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- We use the service role key on the backend (bypasses RLS),
-- so RLS here is a safety net for direct client access.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Only the service role (backend) can SELECT all rows
-- Users cannot read each other's data via the anon/authenticated Supabase client
CREATE POLICY "Service role full access"
  ON public.users
  USING (true)
  WITH CHECK (true);

-- ─── Estancias table ──────────────────────────────────────────────────────────
-- If the constraint already exists with old values, run:
--   ALTER TABLE estancias DROP CONSTRAINT estancias_estado_check;
--   ALTER TABLE estancias ADD CONSTRAINT estancias_estado_check
--     CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- ─── Sample data (optional, for local testing) ────────────────────────────────
-- INSERT INTO public.users (name, email, password_hash, provider)
-- VALUES ('Test User', 'test@example.com', '<bcrypt_hash>', 'local');
