# Balon Patlatma — Okuma Modu Tasarımı

## Özet

Mevcut BalloonPop bileşenine `displayMode: "read"` modu eklenir. Bu modda soru sorulmaz, doğru/yanlış kavramı yoktur. Seçenek sayısı kadar balon gösterilir, balona tıklandığında ekranın ortasında bir modal kart açılır ve danışan seçeneği okur. Amaç danışana seçenekleri eğlenceli bir şekilde okutmaktır.

## Veri Modeli

- **Yeni tip/kolon yok.** Mevcut `display_mode` kolonu (`activities` tablosu) kullanılır.
- `balloon-pop` tipi için `display_mode` değerleri: `"pop"` (mevcut soru-cevap) ve `"read"` (yeni okuma modu).
- `display_mode` null ise default `"pop"` davranışı uygulanır.
- `ActivityOption` tipinde değişiklik yok — `isCorrect` alanı read modunda yok sayılır.

## BalloonPop Bileşen Değişiklikleri

### Yeni Prop

```typescript
displayMode?: "pop" | "read"  // default: "pop"
```

### Davranış Farkları

| Özellik | pop modu | read modu |
|---------|----------|-----------|
| Başlık (title) | Soru gösterilir | Gösterilmez |
| Balon sayısı | Tüm seçenekler | Sadece seçenek sayısı kadar |
| Balon üzeri metin | Seçenek metni görünür | Metin görünmez, sadece renkli balon |
| Tıklama | Balon patlar, doğru/yanlış feedback | Balon patlar → modal kart açılır |
| Modal kart | Yok | Seçenek metni + varsa görsel |
| Kart kapatma | — | Karta veya boş alana tıkla |
| Skor göstergesi | "3/5 doğru" | "3/5 okundu" |
| Tamamlanma | Tüm doğrular patlatılınca → onComplete → ResultsScreen | Tüm balonlar patlatılınca → kutlama animasyonu + "Tekrar Oyna" |
| onComplete | GameStats ile çağrılır | Çağrılmaz — bileşen kendi kutlama ekranını gösterir |

### Modal Kart Detayları

- Ekranın ortasında, yarı saydam koyu arka plan (overlay)
- Kart tema renklerinden birini kullanır
- Metin varsa büyük font ile gösterir
- Görsel varsa kartın üst kısmında gösterir
- Framer Motion ile scale 0→1 açılış animasyonu
- Herhangi bir yere tıklayınca scale 1→0 kapanış animasyonu

### Kutlama (Read Modu Tamamlanma)

- ResultsScreen gösterilmez
- Tema emoji'leri ile confetti benzeri efekt
- `celebrationText` gösterilir (örn. "Aferin! 🎉")
- "Tekrar Oyna" butonu — tıklayınca tüm balonlar sıfırlanır

### Ses Efektleri

- Balon patlama → mevcut pop sesi (her iki modda aynı)
- Modal kart açılma → hafif bir "reveal" sesi (sounds.ts'den)
- Kutlama → mevcut celebration sesi

## Create Wizard Değişiklikleri

### Mod Seçim Adımı

`balloon-pop` seçildiğinde step listesine `"display"` adımı eklenir:
- Steps: `["type", "display", "theme", "content", "preview"]`

İki seçenek:
- 🎯 **Balon Patlat** (`"pop"`) — "Soruya doğru cevap veren balonları patlat"
- 📖 **Balon Oku** (`"read"`) — "Balonları patlatarak seçenekleri oku"

### Content Adımı — Read Modu Farkları

- "Soru" alanı gizlenir (title boş string olarak gönderilir)
- `isCorrect` toggle'ları gizlenir
- "Geri Bildirim Göster" toggle'ı gizlenir
- Validation: `options.length >= 2 && her option'da text veya imageUrl var` (isCorrect kontrolü yok)

### Preview Adımı

- Mod bilgisi gösterilir: "Mod: Balon Oku"
- Soru satırı gösterilmez

## Play Sayfası

- `activity.display_mode` değerini `BalloonPop`'a `displayMode` prop'u olarak iletir
- `balloon-pop` tipi ve `display_mode: "read"` ise → `displayMode="read"`
- `display_mode` null veya `"pop"` ise → mevcut davranış

## Edit Sayfası

- Mevcut etkinlik düzenlenirken `display_mode` bilgisi korunur
- Read modundaki etkinlikte soru alanı ve isCorrect toggle'ları gizlenir (create ile aynı mantık)

## Değişiklik Gereken Dosyalar

1. **`src/components/BalloonPop.tsx`** — displayMode prop, modal kart bileşeni, read modu mantığı, kutlama animasyonu
2. **`src/app/create/page.tsx`** — display adımı (balloon-pop için), content validation farkları, preview farkları
3. **`src/app/play/[id]/page.tsx`** — displayMode prop iletimi
4. **`src/app/edit/[id]/page.tsx`** — displayMode prop iletimi ve create ile aynı content farkları
