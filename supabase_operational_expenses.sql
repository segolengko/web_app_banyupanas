CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nominal INTEGER NOT NULL CHECK (nominal >= 0),
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL DEFAULT 'tunai'
    CHECK (payment_method IN ('tunai', 'transfer', 'qris', 'lainnya')),
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operational_expenses_expense_at_desc
  ON operational_expenses (expense_at DESC);

CREATE INDEX IF NOT EXISTS idx_operational_expenses_category_expense_at_desc
  ON operational_expenses (category, expense_at DESC);

CREATE INDEX IF NOT EXISTS idx_operational_expenses_created_by_expense_at_desc
  ON operational_expenses (created_by, expense_at DESC);

CREATE OR REPLACE FUNCTION report_expense_summary(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  expenses BIGINT,
  expense_count BIGINT
)
LANGUAGE sql
AS $$
  SELECT
    COALESCE(SUM(oe.nominal), 0) AS expenses,
    COUNT(*) AS expense_count
  FROM operational_expenses oe
  WHERE (p_start IS NULL OR oe.expense_at >= p_start)
    AND (p_end IS NULL OR oe.expense_at < p_end);
$$;

CREATE OR REPLACE FUNCTION report_daily_expenses(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  date_key DATE,
  expenses BIGINT
)
LANGUAGE sql
AS $$
  SELECT
    oe.expense_at::date AS date_key,
    COALESCE(SUM(oe.nominal), 0) AS expenses
  FROM operational_expenses oe
  WHERE (p_start IS NULL OR oe.expense_at >= p_start)
    AND (p_end IS NULL OR oe.expense_at < p_end)
  GROUP BY oe.expense_at::date
  ORDER BY oe.expense_at::date DESC;
$$;
