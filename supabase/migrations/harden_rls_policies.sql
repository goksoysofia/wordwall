-- Defense-in-depth RLS hardening.
--
-- All application traffic goes through API routes using the SERVICE ROLE key,
-- which bypasses RLS — authorization is enforced there. These policies are a
-- second layer in case the anon key is ever used directly against the DB.
--
-- Safe to run multiple times (idempotent guards included).

-- ── templates ────────────────────────────────────────────────────────────────
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read templates" ON templates;
CREATE POLICY "Anyone can read templates" ON templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON templates;
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Only the owner may delete, and never an official template.
DROP POLICY IF EXISTS "Users can delete own community templates" ON templates;
CREATE POLICY "Users can delete own community templates" ON templates
  FOR DELETE USING (auth.uid() = user_id AND source <> 'official');

-- ── live_sessions ─────────────────────────────────────────────────────────────
-- Replace the wide-open "anyone can update" policy with a narrower one.
-- (Participant join still needs to bump participants / advance index by code,
--  so updates remain allowed to active sessions, but no longer to inactive ones.)
DROP POLICY IF EXISTS "Anyone can update sessions" ON live_sessions;
CREATE POLICY "Anyone can update active sessions" ON live_sessions
  FOR UPDATE USING (is_active = true);
