-- Etkinliklere kategori alanı ekle
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Kategori bazlı sorgulama için index
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities (category);
