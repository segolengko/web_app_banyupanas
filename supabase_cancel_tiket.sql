DO $$
BEGIN
  CREATE TYPE status_transaksi AS ENUM ('selesai', 'dibatalkan');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE transaksi
  ADD COLUMN IF NOT EXISTS status_transaksi status_transaksi NOT NULL DEFAULT 'selesai',
  ADD COLUMN IF NOT EXISTS refund_nominal INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users_profile(id);

UPDATE transaksi
SET
  status_transaksi = COALESCE(status_transaksi, 'selesai'::status_transaksi),
  refund_nominal = COALESCE(refund_nominal, 0)
WHERE status_transaksi IS NULL OR refund_nominal IS NULL;

CREATE INDEX IF NOT EXISTS idx_transaksi_status_transaksi ON transaksi(status_transaksi);
CREATE INDEX IF NOT EXISTS idx_transaksi_cancelled_at ON transaksi(cancelled_at);
