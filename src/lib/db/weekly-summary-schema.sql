-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║  Automação de Resumo Semanal de Grupos WhatsApp + Aba Task                ║
-- ║  Tabelas: settings, mensagens capturadas, resumos diários/semanais,       ║
-- ║           tasks e alertas críticos.                                       ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ── 1. Configuração de resumo por grupo (toggle on/off) ──────────────────────
CREATE TABLE IF NOT EXISTS public.group_summary_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id    TEXT NOT NULL,                 -- JID do grupo (xxxx@g.us)
  group_name  TEXT DEFAULT '',
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, group_id)
);

-- ── 2. Mensagens capturadas dos grupos ativados ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id          TEXT NOT NULL,
  group_name        TEXT DEFAULT '',
  sender_name       TEXT DEFAULT '',
  sender_phone      TEXT DEFAULT '',
  message_text      TEXT DEFAULT '',
  message_type      TEXT DEFAULT 'text',     -- text | audio | image | video | document
  transcription     TEXT DEFAULT '',         -- texto transcrito (áudios via Whisper)
  wa_message_id     TEXT DEFAULT '',         -- id da mensagem no WhatsApp (dedupe)
  message_timestamp TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_messages_lookup
  ON public.group_messages (company_id, group_id, message_timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_messages_dedupe
  ON public.group_messages (company_id, group_id, wa_message_id)
  WHERE wa_message_id <> '';

-- ── 3. Resumos diários (gerados às 23h) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id      TEXT NOT NULL,
  group_name    TEXT DEFAULT '',
  summary_date  DATE NOT NULL,
  content       TEXT DEFAULT '',             -- resumo do dia (texto)
  message_count INTEGER DEFAULT 0,
  has_critical  BOOLEAN DEFAULT FALSE,
  critical_note TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, group_id, summary_date)
);

-- ── 4. Resumos semanais (gerados segunda 6h) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id    TEXT NOT NULL,
  group_name  TEXT DEFAULT '',
  week_start  DATE NOT NULL,
  week_end    DATE NOT NULL,
  content     JSONB DEFAULT '{}'::jsonb,     -- { resumo, action_items, decisoes, pendencias, followup, clima }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_lookup
  ON public.weekly_summaries (company_id, created_at DESC);

-- ── 5. Tasks (aba Task — visível para toda a empresa) ────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id          TEXT DEFAULT '',
  group_name        TEXT DEFAULT '',
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '',
  responsible       TEXT DEFAULT '',
  due_date          DATE,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  priority          TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  source            TEXT DEFAULT 'manual',  -- manual | weekly_summary | critical_alert
  source_summary_id UUID,
  created_by        UUID REFERENCES public.crm_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_company
  ON public.tasks (company_id, status, created_at DESC);

-- ── 6. Alertas críticos (detectados no resumo diário) ────────────────────────
CREATE TABLE IF NOT EXISTS public.critical_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id      TEXT DEFAULT '',
  group_name    TEXT DEFAULT '',
  message       TEXT NOT NULL,
  level         TEXT DEFAULT 'warning' CHECK (level IN ('warning','critical')),
  detected_date DATE DEFAULT CURRENT_DATE,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_company
  ON public.critical_alerts (company_id, is_read, created_at DESC);
