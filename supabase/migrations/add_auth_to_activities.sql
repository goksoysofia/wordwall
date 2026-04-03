-- Add user_id and is_public columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_is_public ON activities(is_public);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Anyone can read public activities (for play page)
CREATE POLICY "Anyone can read public activities" ON activities
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Authenticated users can insert their own activities
CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Update templates table to link to user
ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
