-- Schema for Full Revenue Loans — aplicado idempotentemente al bootear el backend.

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  decision_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_merchant ON applications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_applications_updated ON applications(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(decision_status);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  event_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Prefill links: personalized URLs for experiments. Each token carries
-- pre-filled merchant data + custom offer amounts so we can send a
-- personalized link to every merchant without biasing the experiment
-- with a generic offer.
CREATE TABLE IF NOT EXISTS prefill_links (
  token VARCHAR(16) PRIMARY KEY,
  merchant_id TEXT,
  offers JSONB,
  base_amount INTEGER,
  prefill JSONB,
  expires_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefill_merchant ON prefill_links(merchant_id);
CREATE INDEX IF NOT EXISTS idx_prefill_created ON prefill_links(created_at DESC);
