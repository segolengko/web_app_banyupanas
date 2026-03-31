CREATE TABLE IF NOT EXISTS integration_api_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT integration_api_clients_scopes_check CHECK (
    scopes <@ ARRAY['transactions:read']::TEXT[]
  )
);

CREATE INDEX IF NOT EXISTS idx_integration_api_clients_active
  ON integration_api_clients (is_active, name);

CREATE INDEX IF NOT EXISTS idx_integration_api_clients_last_used_at
  ON integration_api_clients (last_used_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION set_integration_api_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_integration_api_clients_updated_at ON integration_api_clients;
CREATE TRIGGER trg_integration_api_clients_updated_at
BEFORE UPDATE ON integration_api_clients
FOR EACH ROW
EXECUTE FUNCTION set_integration_api_clients_updated_at();

-- Cara membuat API key:
-- 1. Buat raw key acak, misalnya: bp_live_xxxxxxxxxxxxxxxxxxxxxxxx
-- 2. Ambil prefix 12 karakter pertama sebagai key_prefix
-- 3. Simpan SHA-256 hex dari raw key sebagai key_hash
-- 4. Berikan raw key hanya sekali ke pihak integrator
--
-- Contoh insert manual:
-- INSERT INTO integration_api_clients (name, key_prefix, key_hash, scopes, notes)
-- VALUES (
--   'Aplikasi Kantor',
--   'bp_live_abcd',
--   '<sha256_hex_dari_raw_key>',
--   ARRAY['transactions:read']::TEXT[],
--   'Akses baca transaksi dari sistem kantor'
-- );
