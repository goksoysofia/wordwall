-- Balon Patlatma: display_mode 'pop' | 'read' (Kart: 'grid' | 'stack')
-- Eski kısıt yalnızca kart modlarını içeriyordu; 'read' / 'pop' eklenince INSERT başarısız oluyordu.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_display_mode_check;

ALTER TABLE activities ADD CONSTRAINT activities_display_mode_check
  CHECK (
    display_mode IS NULL
    OR display_mode IN ('grid', 'stack', 'pop', 'read')
  );
