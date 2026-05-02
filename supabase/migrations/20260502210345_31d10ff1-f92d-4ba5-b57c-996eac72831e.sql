-- Claim status pipeline (simple, ordered)
CREATE TYPE public.claim_status AS ENUM (
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'paid',
  'closed'
);

CREATE TYPE public.claim_kind AS ENUM (
  'insurance',
  'scheme',
  'hospital_dispute'
);

CREATE TYPE public.claim_doc_kind AS ENUM (
  'dispute_letter',
  'scheme_application',
  'upload',
  'other'
);

-- Claims
CREATE TABLE public.claims (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  kind public.claim_kind NOT NULL DEFAULT 'insurance',
  status public.claim_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  insurer_name TEXT,
  scheme_name TEXT,
  policy_number TEXT,
  claim_number TEXT,
  amount_claimed NUMERIC(12,2),
  amount_approved NUMERIC(12,2),
  submitted_at DATE,
  decided_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX claims_user_idx ON public.claims(user_id, created_at DESC);
CREATE INDEX claims_bill_idx ON public.claims(bill_id);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own claims" ON public.claims
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own claims" ON public.claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own claims" ON public.claims
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own claims" ON public.claims
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER claims_updated_at BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Claim documents (letters + uploads)
CREATE TABLE public.claim_documents (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  kind public.claim_doc_kind NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX claim_documents_claim_idx ON public.claim_documents(claim_id);
CREATE INDEX claim_documents_user_idx ON public.claim_documents(user_id, created_at DESC);

ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own claim docs" ON public.claim_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own claim docs" ON public.claim_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own claim docs" ON public.claim_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own claim docs" ON public.claim_documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER claim_documents_updated_at BEFORE UPDATE ON public.claim_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reminders
CREATE TABLE public.reminders (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reminders_user_idx ON public.reminders(user_id, due_at);
CREATE INDEX reminders_due_idx ON public.reminders(due_at) WHERE sent_at IS NULL AND done_at IS NULL;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();