-- Reports and blocks (Phase 4: safety)

CREATE TABLE IF NOT EXISTS reports (
  id             SERIAL PRIMARY KEY,
  reporter_type  TEXT NOT NULL CHECK (reporter_type IN ('creator','business')),
  reporter_id    INTEGER NOT NULL,
  target_type    TEXT NOT NULL CHECK (target_type IN ('creator','business','content','opportunity','message')),
  target_id      INTEGER NOT NULL,
  reason         TEXT NOT NULL CHECK (reason IN ('spam','harassment','inappropriate','scam','impersonation','other')),
  details        TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','dismissed')),
  reviewed_by    INTEGER,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_type  TEXT NOT NULL CHECK (blocker_type IN ('creator','business')),
  blocker_id    INTEGER NOT NULL,
  blocked_type  TEXT NOT NULL CHECK (blocked_type IN ('creator','business')),
  blocked_id    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_type, blocker_id, blocked_type, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks (blocked_type, blocked_id);
