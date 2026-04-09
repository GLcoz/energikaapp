-- ═══════════════════════════════════════════════════════════
-- Supabase Row Level Security (RLS) Policies
-- for Energika ERP - Centre d'Orthophonie
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ─── Helper function to get user role ─────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE auth_id = auth.uid()::TEXT;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─── Helper function to get user profile id ───────────────
CREATE OR REPLACE FUNCTION get_profile_id()
RETURNS TEXT AS $$
  SELECT id FROM profiles WHERE auth_id = auth.uid()::TEXT;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- PROFILES: Users can read their own profile, admins can read all
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth_id = auth.uid()::TEXT);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (get_user_role() = 'ADMIN');

-- ═══════════════════════════════════════════════════════════
-- PATIENTS: Orthos see only their patients, Admins see all
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Admins can manage all patients"
  ON patients FOR ALL
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "Orthos can view their own patients"
  ON patients FOR SELECT
  USING (therapist_id = get_profile_id()::TEXT);

CREATE POLICY "Orthos can update their own patients"
  ON patients FOR UPDATE
  USING (therapist_id = get_profile_id()::TEXT);

CREATE POLICY "Orthos can insert patients"
  ON patients FOR INSERT
  WITH CHECK (therapist_id = get_profile_id()::TEXT);

-- ═══════════════════════════════════════════════════════════
-- MONTHLY_BILLINGS: ADMIN ONLY - Orthos have NO ACCESS
-- This ensures orthophonistes cannot see financial data
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Only admins can access monthly_billings"
  ON monthly_billings FOR ALL
  USING (get_user_role() = 'ADMIN');

-- ═══════════════════════════════════════════════════════════
-- EXPENSES: ADMIN ONLY - Orthos have NO ACCESS
-- Financial data is restricted to administrators
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Only admins can access expenses"
  ON expenses FOR ALL
  USING (get_user_role() = 'ADMIN');

-- ═══════════════════════════════════════════════════════════
-- SESSIONS: Orthos see only their sessions, Admins see all
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Admins can manage all sessions"
  ON sessions FOR ALL
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "Orthos can view their own sessions"
  ON sessions FOR SELECT
  USING (therapist_id = get_profile_id()::TEXT);

CREATE POLICY "Orthos can manage their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (therapist_id = get_profile_id()::TEXT);

CREATE POLICY "Orthos can update their own sessions"
  ON sessions FOR UPDATE
  USING (therapist_id = get_profile_id()::TEXT);

-- ═══════════════════════════════════════════════════════════
-- CRON JOB: Auto-generate monthly billing for all active patients
-- Run on the 1st of each month at 00:01 (UTC)
-- ═══════════════════════════════════════════════════════════

-- Enable pg_cron extension (run once)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule(
--   'generate-monthly-billing',
--   '1 0 1 * *', -- At 00:01 on the 1st of every month
--   $$
--   INSERT INTO monthly_billings (id, patient_id, month, year, amount_due, status, created_at, updated_at)
--   SELECT
--     gen_random_uuid(),
--     id,
--     EXTRACT(MONTH FROM NOW())::INT,
--     EXTRACT(YEAR FROM NOW())::INT,
--     monthly_fee,
--     'PENDING',
--     NOW(),
--     NOW()
--   FROM patients
--   WHERE is_active = true
--   ON CONFLICT (patient_id, month, year) DO NOTHING;
--   $$
-- );
