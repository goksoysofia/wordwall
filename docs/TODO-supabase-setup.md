# Supabase Kurulum Yapilacaklar

Supabase env dosyasina erisimin oldugunda bu adimlari sirala ile yap:

## 1. Env Dosyasini Kontrol Et

`.env.local` dosyasinda su degiskenlerin oldugunu dogrula:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## 2. Templates Tablosunu Olustur

Supabase Dashboard > SQL Editor'a git ve su dosyanin icerigini calistir:

```
supabase/migrations/create_templates_table.sql
```

Bu tablo + 5 index olusturur.

## 3. Seed Data Ekle

Ayni SQL Editor'da su dosyanin icerigini calistir:

```
supabase/seed/templates-seed.sql
```

Bu 18 resmi sablonu ekler (6 kategori x 3 sablon).

## 4. Test Et

```bash
npm run dev
```

Kontrol listesi:
- [ ] `/dashboard` — etkinlikler listeleniyor mu?
- [ ] `/dashboard` — "Sablon Pazari" linki gorunuyor mu?
- [ ] `/dashboard/templates` — 18 sablon kartla gorunuyor mu?
- [ ] Kategori filtreleri calisiyor mu?
- [ ] "Resmi" / "Topluluk" sekmeleri calisiyor mu?
- [ ] Arama calisiyor mu? (ornek: "r sesi")
- [ ] Bir sablona "Kullan" tikla — edit sayfasina yonlendiriyor mu?
- [ ] Edit sayfasinda veri kopyalanmis mi?
- [ ] Kaydet ve Oyna calisiyor mu?
- [ ] Dashboard'da bir etkinlikte "Sablon Olarak Paylas" tikla — modal aciliyor mu?
- [ ] Modal'i doldur ve paylas — basarili mesaji gorunuyor mu?
- [ ] `/dashboard/templates` > Topluluk sekmesi — paylasilan sablon gorunuyor mu?
- [ ] 3D cark calisiyor mu? (`wheel` tipinde bir etkinlik olustur ve oyna)
- [ ] Yeni oyun tipleri calisiyor mu? (match, group-sort, quiz, missing-word, memory, balloon-pop)
- [ ] Ses efektleri duyuluyor mu? (dogru/yanlis cevaplarda)
