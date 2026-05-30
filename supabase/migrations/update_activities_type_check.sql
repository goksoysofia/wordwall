-- Mevcut type constraint'ini kaldır ve yeni tüm oyun tiplerini ekle
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN (
    'wheel', 'card', 'match', 'group-sort', 'quiz', 'missing-word', 'memory', 'balloon-pop',
    -- Yeni etkinlik tipleri
    'sequence', 'sentence', 'unscramble', 'odd-one-out', 'true-false',
    'listen-choose', 'word-search', 'flashcards', 'bingo', 'syllable-count'
  ));
