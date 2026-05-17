-- leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.crm_users(id),
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','negotiation','won','lost')),
  source TEXT DEFAULT 'manual',
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot','warm','cold')),
  value NUMERIC DEFAULT 0,
  score INTEGER DEFAULT 70,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.crm_users(id),
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active','inactive','prospect')),
  value NUMERIC DEFAULT 0,
  deals INTEGER DEFAULT 0,
  score INTEGER DEFAULT 70,
  avatar TEXT DEFAULT '',
  gradient TEXT DEFAULT 'from-blue-500 to-cyan-500',
  since TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.crm_users(id),
  label TEXT NOT NULL,
  color TEXT DEFAULT '',
  time TEXT DEFAULT '',
  description TEXT DEFAULT '',
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
