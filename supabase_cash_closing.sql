CREATE TABLE IF NOT EXISTS cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date DATE NOT NULL UNIQUE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  gross_revenue BIGINT NOT NULL DEFAULT 0,
  total_discount BIGINT NOT NULL DEFAULT 0,
  total_refund BIGINT NOT NULL DEFAULT 0,
  total_expenses BIGINT NOT NULL DEFAULT 0,
  net_revenue BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  closed_by UUID REFERENCES users_profile(id),
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_closings_closing_date_desc
  ON cash_closings (closing_date DESC);

CREATE INDEX IF NOT EXISTS idx_cash_closings_closed_by_closing_date_desc
  ON cash_closings (closed_by, closing_date DESC);
