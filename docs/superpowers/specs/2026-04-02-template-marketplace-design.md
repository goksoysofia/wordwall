# Sablon Pazari (Template Marketplace) Tasarim Speci

## Ozet

Dil ve konusma terapistlerinin en buyuk sorunu: her seans icin sifirdan materyal hazirlamak. Sablon pazari, hazir etkinlik sablonlari sunarak bu sorunu cozer. Resmi (kuratolu) + topluluk (terapist paylasimli) iki katmanli bir sistem.

## Is Modeli

- **Freemium**: Free kullanicilar her kategoriden 1 resmi sablona erisir + tum topluluk sablonlari. Premium kullanicilar tum resmi sablonlara erisir.
- Topluluk sablonlari herkese acik — viral buyumeyi tetikler.
- Auth ve odeme altyapisi sonraki fazlarda gelecek. Bu faz sadece sablon sisteminin kendisi.

## Veri Modeli

### `templates` Supabase Tablosu

| Alan | Tip | Aciklama |
|------|-----|----------|
| id | uuid, PK | Otomatik |
| title | text, NOT NULL | Sablon basligi |
| description | text | Aciklama metni |
| type | text, NOT NULL | ActivityType (wheel, card, match, group-sort, quiz, missing-word, memory, balloon-pop) |
| display_mode | text, NULL | card tipi icin grid/stack |
| theme | text, NOT NULL | Theme id |
| options | jsonb, NOT NULL | ActivityOption[] — mevcut yapi aynen |
| category | text, NOT NULL | artikulasyon, kelime-hazinesi, gramer, anlama, sosyal-iletisim, diger |
| tags | text[], default '{}' | Aranabilir etiketler |
| source | text, NOT NULL | "official" veya "community" |
| author_name | text, NULL | Topluluk sablonlarinda olusturanin adi |
| use_count | integer, default 0 | Kac kez kopyalandi |
| is_premium | boolean, default false | Free'de erisilebilir mi |
| created_at | timestamptz, default now() | Olusturulma zamani |

### Iliski

Template → Activity: bir template "Kullan" ile yeni bir Activity olarak kopyalanir. Dogrudan FK baglantisi yok. Template salt okunur bir blueprint, Activity kisisel kopyadir.

## Kategori Sistemi

6 sabit kategori:

1. **artikulasyon** — Ses uretimi calismalari
2. **kelime-hazinesi** — Yeni kelime ogrenme
3. **gramer** — Cumle yapisi, ekler
4. **anlama** — Dinleme ve anlama
5. **sosyal-iletisim** — Pragmatik dil
6. **diger** — Genel amacli

## API Tasarimi

Mevcut Next.js route handler + Supabase pattern'i takip edilir.

### Endpoint'ler

**GET /api/templates**
- Query params: `category`, `source` (official|community), `search`, `sort` (popular|newest, default: popular)
- Response: Template[]

**GET /api/templates/[id]**
- Response: tek Template objesi

**POST /api/templates**
- Topluluk sablonu olusturur
- Body: `{ title, description, type, display_mode, theme, options, category, tags, author_name }`
- `source` otomatik "community", `is_premium` otomatik false

**POST /api/templates/[id]/use**
- Template'i Activity olarak kopyalar
- Islem: template oku → options/type/theme/display_mode'u yeni Activity'ye kopyala → title'a " (kopya)" ekle → use_count +1 → yeni activity id don
- `is_premium` kontrolu: simdilik client-side (auth gelince server-side)
- Response: `{ id: "yeni-activity-id" }`

**DELETE /api/templates/[id]**
- Topluluk sablonunu siler (auth gelene kadar herkes silebilir)

## Sayfa Yapisi

### /dashboard/templates (veya /templates)

**Layout:**
- Ust: kategori filtreleri (yatay scroll pill butonlar)
- "Resmi" / "Topluluk" sekmeleri
- Arama cubugu (title + tags uzerinde arar)
- Sablon kartlari grid (2 sutun mobil, 3 sutun desktop)

**Sablon Karti:**
- Aktivite tipi ikonu + etiketi
- Baslik
- Kategori badge
- Tema renk seridi
- use_count gostergesi
- Premium ise kilit ikonu
- "Kullan" butonu

### "Kullan" Akisi

1. "Kullan" tikla
2. POST /api/templates/[id]/use
3. Redirect → /edit/[yeni-activity-id] (ozellestirme imkani)
4. Kaydet → Oyna

### "Sablon Olarak Paylas" Akisi

- Mevcut etkinlik kartinda veya edit sayfasinda buton
- Tiklaninca: isim, aciklama, kategori, tags giris modali
- POST /api/templates
- source: "community", author_name elle girilir

## Seed Data — 18 Resmi Sablon

### Artikulasyon (3)
1. "/s/ sesi kelime basi eslestirme" — match, 8 cift
2. "/r/ sesi balon patlatma" — balloon-pop, 10 balon
3. "/k/ sesi hafiza oyunu" — memory, 6 cift

### Kelime Hazinesi (3)
4. "Hayvanlar gruplama" — group-sort, evcil/yabani/ciftlik
5. "Meyve-sebze eslestirme" — match, resim-kelime
6. "Vucut bolumleri quiz" — quiz, resimli

### Gramer (3)
7. "Cogul eki bosluk doldurma" — missing-word
8. "Gecmis zaman quiz" — quiz
9. "Buyuk-kucuk gruplama" — group-sort

### Dil Anlama (3)
10. "Zit anlamlilar eslestirme" — match
11. "Ne ile ne yapariz?" — quiz
12. "Siralama oyunu" — group-sort

### Sosyal Iletisim (3)
13. "Duygu eslestirme" — match
14. "Ne hisseder?" — quiz
15. "Kibarlik kelimeleri balon patlatma" — balloon-pop

### Diger (3)
16. "Renkler carki" — wheel
17. "Haftanin gunleri hafiza" — memory
18. "Sayilar 1-10 kart acma" — card/grid

## Free vs Premium Siniri (Bu Faz)

- Free: her kategoriden 1 resmi sablon + tum topluluk sablonlari
- Premium: tum resmi sablonlar
- Premium kontrolu simdilik client-side flag. Auth + odeme sonraki fazda.

## Kapsam Disi (Sonraki Fazlar)

- Kullanici hesaplari (auth)
- Odeme altyapisi (Stripe)
- Raporlama/ilerleme takibi
- Sablon moderasyonu
- Yorum/puanlama sistemi
- Etkinlik limiti (5 free)
