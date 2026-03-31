CREATE OR REPLACE FUNCTION report_daily_recap_with_expenses(
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
  expenses BIGINT,
  net_revenue BIGINT,
  total_items BIGINT
)
LANGUAGE sql
AS $$
  WITH filtered_transactions AS (
    SELECT
      timezone('Asia/Jakarta', t.created_at)::date AS date_key,
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
  grouped_transactions AS (
    SELECT
      ft.date_key,
      COUNT(*) AS transaction_count,
      SUM(CASE WHEN ft.status_transaksi = 'dibatalkan' THEN 1 ELSE 0 END) AS cancelled_count,
      COALESCE(SUM(CASE WHEN ft.status_transaksi = 'dibatalkan' THEN 0 ELSE ft.total_tiket END), 0) AS tickets,
      COALESCE(SUM(CASE WHEN ft.status_transaksi = 'dibatalkan' THEN 0 ELSE ft.diskon_nominal END), 0) AS discount,
      COALESCE(SUM(CASE WHEN ft.status_transaksi = 'dibatalkan' THEN COALESCE(ft.refund_nominal, ft.total_bayar) ELSE 0 END), 0) AS refund,
      COALESCE(SUM(CASE WHEN ft.status_transaksi = 'dibatalkan' THEN 0 ELSE ft.total_bayar END), 0) AS revenue
    FROM filtered_transactions ft
    GROUP BY ft.date_key
  ),
  grouped_expenses AS (
    SELECT
      timezone('Asia/Jakarta', oe.expense_at)::date AS date_key,
      COALESCE(SUM(oe.nominal), 0) AS expenses
    FROM operational_expenses oe
    WHERE (p_start IS NULL OR oe.expense_at >= p_start)
      AND (p_end IS NULL OR oe.expense_at < p_end)
    GROUP BY timezone('Asia/Jakarta', oe.expense_at)::date
  ),
  merged AS (
    SELECT
      COALESCE(gt.date_key, ge.date_key) AS date_key,
      COALESCE(gt.transaction_count, 0) AS transaction_count,
      COALESCE(gt.cancelled_count, 0) AS cancelled_count,
      COALESCE(gt.tickets, 0) AS tickets,
      COALESCE(gt.discount, 0) AS discount,
      COALESCE(gt.refund, 0) AS refund,
      COALESCE(gt.revenue, 0) AS revenue,
      COALESCE(ge.expenses, 0) AS expenses,
      COALESCE(gt.revenue, 0) - COALESCE(ge.expenses, 0) AS net_revenue
    FROM grouped_transactions gt
    FULL OUTER JOIN grouped_expenses ge ON ge.date_key = gt.date_key
  )
  SELECT
    merged.date_key,
    merged.transaction_count,
    merged.cancelled_count,
    merged.tickets,
    merged.discount,
    merged.refund,
    merged.revenue,
    merged.expenses,
    merged.net_revenue,
    COUNT(*) OVER() AS total_items
  FROM merged
  ORDER BY merged.date_key DESC
  OFFSET GREATEST(p_page - 1, 0) * p_page_size
  LIMIT p_page_size;
$$;
