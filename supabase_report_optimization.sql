CREATE INDEX IF NOT EXISTS idx_transaksi_created_at_desc
  ON transaksi (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaksi_status_created_at_desc
  ON transaksi (status_transaksi, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaksi_petugas_created_at_desc
  ON transaksi (petugas_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_profile_nama_lengkap_lower
  ON users_profile ((lower(nama_lengkap)));

CREATE OR REPLACE FUNCTION report_filtered_transactions(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  total_bayar INTEGER,
  total_tiket INTEGER,
  diskon_nominal INTEGER,
  metode_bayar TEXT,
  status_transaksi TEXT,
  refund_nominal INTEGER,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  petugas_nama_lengkap TEXT,
  total_items BIGINT
)
LANGUAGE sql
AS $$
  WITH filtered AS (
    SELECT
      t.id,
      t.created_at,
      t.total_bayar,
      t.total_tiket,
      t.diskon_nominal,
      t.metode_bayar::text AS metode_bayar,
      t.status_transaksi::text AS status_transaksi,
      t.refund_nominal,
      t.cancel_reason,
      t.cancelled_at,
      up.nama_lengkap AS petugas_nama_lengkap
    FROM transaksi t
    JOIN users_profile up ON up.id = t.petugas_id
    WHERE (p_start IS NULL OR t.created_at >= p_start)
      AND (p_end IS NULL OR t.created_at < p_end)
      AND (p_status IS NULL OR t.status_transaksi::text = p_status)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR lower(t.id::text) LIKE '%' || lower(p_search) || '%'
        OR lower(up.nama_lengkap) LIKE '%' || lower(p_search) || '%'
      )
  )
  SELECT
    filtered.id,
    filtered.created_at,
    filtered.total_bayar,
    filtered.total_tiket,
    filtered.diskon_nominal,
    filtered.metode_bayar,
    filtered.status_transaksi,
    filtered.refund_nominal,
    filtered.cancel_reason,
    filtered.cancelled_at,
    filtered.petugas_nama_lengkap,
    COUNT(*) OVER() AS total_items
  FROM filtered
  ORDER BY filtered.created_at DESC
  OFFSET GREATEST(p_page - 1, 0) * p_page_size
  LIMIT p_page_size;
$$;

CREATE OR REPLACE FUNCTION report_transaction_summary(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  revenue BIGINT,
  tickets BIGINT,
  discount BIGINT,
  refund BIGINT,
  cancelled_count BIGINT,
  transaction_count BIGINT
)
LANGUAGE sql
AS $$
  WITH filtered AS (
    SELECT
      t.total_bayar,
      t.total_tiket,
      t.diskon_nominal,
      t.status_transaksi::text AS status_transaksi,
      t.refund_nominal
    FROM transaksi t
    JOIN users_profile up ON up.id = t.petugas_id
    WHERE (p_start IS NULL OR t.created_at >= p_start)
      AND (p_end IS NULL OR t.created_at < p_end)
      AND (p_status IS NULL OR t.status_transaksi::text = p_status)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR lower(t.id::text) LIKE '%' || lower(p_search) || '%'
        OR lower(up.nama_lengkap) LIKE '%' || lower(p_search) || '%'
      )
  )
  SELECT
    COALESCE(SUM(CASE WHEN status_transaksi = 'dibatalkan' THEN 0 ELSE total_bayar END), 0) AS revenue,
    COALESCE(SUM(CASE WHEN status_transaksi = 'dibatalkan' THEN 0 ELSE total_tiket END), 0) AS tickets,
    COALESCE(SUM(CASE WHEN status_transaksi = 'dibatalkan' THEN 0 ELSE diskon_nominal END), 0) AS discount,
    COALESCE(SUM(CASE WHEN status_transaksi = 'dibatalkan' THEN COALESCE(refund_nominal, total_bayar) ELSE 0 END), 0) AS refund,
    COALESCE(SUM(CASE WHEN status_transaksi = 'dibatalkan' THEN 1 ELSE 0 END), 0) AS cancelled_count,
    COUNT(*) AS transaction_count
  FROM filtered;
$$;

CREATE OR REPLACE FUNCTION report_daily_recap(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  date_key DATE,
  transaction_count BIGINT,
  cancelled_count BIGINT,
  tickets BIGINT,
  discount BIGINT,
  refund BIGINT,
  revenue BIGINT,
  total_items BIGINT
)
LANGUAGE sql
AS $$
  WITH filtered AS (
    SELECT
      t.created_at::date AS date_key,
      t.total_bayar,
      t.total_tiket,
      t.diskon_nominal,
      t.status_transaksi::text AS status_transaksi,
      t.refund_nominal
    FROM transaksi t
    JOIN users_profile up ON up.id = t.petugas_id
    WHERE (p_start IS NULL OR t.created_at >= p_start)
      AND (p_end IS NULL OR t.created_at < p_end)
      AND (p_status IS NULL OR t.status_transaksi::text = p_status)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR lower(t.id::text) LIKE '%' || lower(p_search) || '%'
        OR lower(up.nama_lengkap) LIKE '%' || lower(p_search) || '%'
      )
  ),
  grouped AS (
    SELECT
      filtered.date_key,
      COUNT(*) AS transaction_count,
      SUM(CASE WHEN filtered.status_transaksi = 'dibatalkan' THEN 1 ELSE 0 END) AS cancelled_count,
      COALESCE(SUM(CASE WHEN filtered.status_transaksi = 'dibatalkan' THEN 0 ELSE filtered.total_tiket END), 0) AS tickets,
      COALESCE(SUM(CASE WHEN filtered.status_transaksi = 'dibatalkan' THEN 0 ELSE filtered.diskon_nominal END), 0) AS discount,
      COALESCE(SUM(CASE WHEN filtered.status_transaksi = 'dibatalkan' THEN COALESCE(filtered.refund_nominal, filtered.total_bayar) ELSE 0 END), 0) AS refund,
      COALESCE(SUM(CASE WHEN filtered.status_transaksi = 'dibatalkan' THEN 0 ELSE filtered.total_bayar END), 0) AS revenue
    FROM filtered
    GROUP BY filtered.date_key
  )
  SELECT
    grouped.date_key,
    grouped.transaction_count,
    grouped.cancelled_count,
    grouped.tickets,
    grouped.discount,
    grouped.refund,
    grouped.revenue,
    COUNT(*) OVER() AS total_items
  FROM grouped
  ORDER BY grouped.date_key DESC
  OFFSET GREATEST(p_page - 1, 0) * p_page_size
  LIMIT p_page_size;
$$;
