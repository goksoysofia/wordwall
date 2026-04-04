-- Etkinliklere doğru/yanlış geri bildirim gösterme ayarı
ALTER TABLE activities ADD COLUMN IF NOT EXISTS show_feedback BOOLEAN NOT NULL DEFAULT true;
