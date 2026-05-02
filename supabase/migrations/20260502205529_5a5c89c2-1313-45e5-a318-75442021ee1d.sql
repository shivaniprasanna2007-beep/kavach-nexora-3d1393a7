-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  family_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bills
CREATE TYPE public.bill_status AS ENUM ('uploaded', 'processing', 'audited', 'failed');

CREATE TABLE public.bills (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_mime TEXT,
  hospital_name TEXT,
  patient_name TEXT,
  bill_date DATE,
  bill_number TEXT,
  total_billed NUMERIC(12,2),
  total_fair NUMERIC(12,2),
  total_overcharge NUMERIC(12,2),
  potential_savings NUMERIC(12,2),
  language TEXT NOT NULL DEFAULT 'en',
  status public.bill_status NOT NULL DEFAULT 'uploaded',
  audit_summary TEXT,
  audit_raw JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bills_user_idx ON public.bills(user_id, created_at DESC);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bills" ON public.bills
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bills" ON public.bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bills" ON public.bills
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own bills" ON public.bills
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER bills_updated_at BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bill items
CREATE TABLE public.bill_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2),
  amount NUMERIC(12,2),
  fair_price NUMERIC(12,2),
  overcharge NUMERIC(12,2),
  is_overcharged BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bill_items_bill_idx ON public.bill_items(bill_id);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bill items" ON public.bill_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bill items" ON public.bill_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bill items" ON public.bill_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own bill items" ON public.bill_items
  FOR DELETE USING (auth.uid() = user_id);

-- Audit findings
CREATE TYPE public.finding_severity AS ENUM ('info', 'low', 'medium', 'high');
CREATE TYPE public.finding_kind AS ENUM ('overcharge', 'scheme_eligibility', 'duplicate', 'unnecessary', 'insurance', 'other');

CREATE TABLE public.audit_findings (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.finding_kind NOT NULL,
  severity public.finding_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  estimated_savings NUMERIC(12,2),
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_findings_bill_idx ON public.audit_findings(bill_id);

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own findings" ON public.audit_findings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own findings" ON public.audit_findings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own findings" ON public.audit_findings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own findings" ON public.audit_findings
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for bills (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('bills', 'bills', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own bills"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bills' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own bills storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'bills' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own bills storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'bills' AND auth.uid()::text = (storage.foldername(name))[1]);