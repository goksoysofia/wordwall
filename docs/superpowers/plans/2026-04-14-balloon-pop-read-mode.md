# Balon Patlatma — Okuma Modu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BalloonPop bileşenine `displayMode: "read"` modu ekleyerek balonların tıklandığında modal kart ile seçenek göstermesini sağlamak.

**Architecture:** Mevcut `BalloonPop.tsx` bileşenine `displayMode` prop'u eklenir. `"read"` modunda soru/doğru-yanlış mantığı devre dışı kalır, balon tıklandığında ekranın ortasında modal kart açılır. Create/edit wizard'larında balloon-pop için display modu seçim adımı eklenir.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Framer Motion, Tailwind CSS 4, Web Audio API

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/activity.ts` | Modify | `CardDisplayMode` → `DisplayMode` genişlet, `"pop"` ve `"read"` ekle |
| `src/components/BalloonPop.tsx` | Modify | `displayMode` prop, read modu mantığı, modal kart, kutlama ekranı |
| `src/app/create/page.tsx` | Modify | balloon-pop için display adımı, content validation farkları |
| `src/app/edit/[id]/page.tsx` | Modify | balloon-pop için display mode desteği |
| `src/app/play/[id]/page.tsx` | Modify | `displayMode` prop iletimi |

---

### Task 1: Tip Tanımlarını Güncelle

**Files:**
- Modify: `src/types/activity.ts`

- [ ] **Step 1: `CardDisplayMode` tipini genişlet**

`CardDisplayMode` yerine daha genel bir `DisplayMode` tipi kullan. Mevcut `"grid" | "stack"` değerlerine `"pop" | "read"` ekle:

```typescript
// src/types/activity.ts

export type ActivityType =
  | "wheel"
  | "card"
  | "match"
  | "group-sort"
  | "quiz"
  | "missing-word"
  | "memory"
  | "balloon-pop";

export type CardDisplayMode = "grid" | "stack";
export type BalloonDisplayMode = "pop" | "read";
export type DisplayMode = CardDisplayMode | BalloonDisplayMode;

export interface ActivityOption {
  id: string;
  text?: string;
  imageUrl?: string;
  pairText?: string;
  pairImageUrl?: string;
  group?: string;
  isCorrect?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  display_mode: DisplayMode | null;
  theme: string;
  category: string | null;
  show_feedback: boolean;
  options: ActivityOption[];
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityPayload {
  title: string;
  type: ActivityType;
  display_mode: DisplayMode | null;
  theme: string;
  category: string | null;
  show_feedback?: boolean;
  options: ActivityOption[];
}
```

- [ ] **Step 2: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata varsa `CardDisplayMode` kullanan yerleri bul — edit sayfasındaki state tipi güncellenmeli.

- [ ] **Step 3: Edit sayfasındaki tip referansını güncelle**

`src/app/edit/[id]/page.tsx` satır 42'de:

```typescript
// Eski:
const [displayMode, setDisplayMode] = useState<CardDisplayMode | null>(null);

// Yeni:
const [displayMode, setDisplayMode] = useState<DisplayMode | null>(null);
```

Import'u da güncelle — `CardDisplayMode` yerine `DisplayMode` import et (veya ikisini de import et).

- [ ] **Step 4: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 5: Commit**

```bash
git add src/types/activity.ts src/app/edit/[id]/page.tsx
git commit -m "refactor: DisplayMode tipi eklendi — balloon-pop read modu için hazırlık"
```

---

### Task 2: BalloonPop — Read Modu Temel Mantığı

**Files:**
- Modify: `src/components/BalloonPop.tsx`

- [ ] **Step 1: Props'a `displayMode` ekle ve read modu için temel dallanmayı yaz**

`BalloonPopProps` interface'ine `displayMode` ekle. Bileşen içinde read modunda farklı davranışları kontrol et:

```typescript
// BalloonPopProps — displayMode ekle:
export interface BalloonPopProps {
  options: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  title: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  showFeedback?: boolean;
  displayMode?: "pop" | "read";
  onComplete: (stats: GameStats) => void;
}
```

Bileşen imzasını güncelle:

```typescript
export default function BalloonPop({ options, title, theme, showFeedback = true, displayMode = "pop", onComplete }: BalloonPopProps) {
```

`isReadMode` sabitini tanımla:

```typescript
const isReadMode = displayMode === "read";
```

- [ ] **Step 2: Read modunda skor göstergesini güncelle**

Skor bölümünde "doğru/yanlış" yerine "okundu" göster. Mevcut skor div'ini şu şekilde güncelle — wrong göstergesini read modunda gizle:

```tsx
{/* Score */}
<div className="flex items-center gap-4">
  <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
    <span className="text-lg">🎈</span>
    <span className="font-heading text-lg font-bold text-[#2D1B69]">{popped.size}</span>
    <span className="text-xs font-bold text-[#8B7BAD]">/ {options.length}</span>
  </div>
  {!isReadMode && showFeedback && score.wrong > 0 && (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
      <span className="text-lg">💨</span>
      <span className="font-heading text-lg font-bold text-rose-500">{score.wrong}</span>
    </div>
  )}
</div>
```

- [ ] **Step 3: Read modunda soru başlığını gizle**

Mevcut soru/instruction div'ini read modunda gizle:

```tsx
{/* Question / Instruction — hide in read mode */}
{!isReadMode && (
  <motion.div
    className="w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
    style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <p className="font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title}</p>
    <p className="mt-1 text-xs font-bold text-[#8B7BAD]">Doğru balonları patlat! 🎯</p>
  </motion.div>
)}
```

- [ ] **Step 4: Read modunda balon üzerindeki metni gizle**

Balon SVG içindeki text elementini read modunda render etme:

```tsx
{/* Text — hide in read mode */}
{!isReadMode && balloon.text && (
  <text
    x="50"
    y="48"
    textAnchor="middle"
    dominantBaseline="middle"
    fill="white"
    fontSize={balloon.text.length > 8 ? balloonSize.fontSizeSmall : balloonSize.fontSize}
    fontWeight="800"
    fontFamily="'Nunito', sans-serif"
    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
  >
    {balloon.text.length > balloonSize.truncate
      ? balloon.text.slice(0, balloonSize.truncate - 1) + "…"
      : balloon.text}
  </text>
)}
```

Ayrıca balonun altındaki görsel (imageUrl) de read modunda gizlenmeli:

```tsx
{/* Image below balloon — hide in read mode */}
{!isReadMode && balloon.imageUrl && (
  <img
    src={balloon.imageUrl}
    alt=""
    className={`-mt-4 rounded-full border-2 border-white object-cover shadow-md ${balloonSize.imgSize}`}
  />
)}
```

- [ ] **Step 5: Read modunda handlePop'u güncelle**

Read modunda doğru/yanlış ses ve skor mantığını devre dışı bırak. `handlePop` fonksiyonunu güncelle:

```typescript
const handlePop = useCallback(
  (balloon: BalloonData) => {
    if (popped.has(balloon.id)) return;

    playPopSound();
    setPopped((prev) => new Set(prev).add(balloon.id));
    setPopEffects((prev) => [
      ...prev,
      { id: balloon.id, x: balloon.x, y: balloon.y, correct: balloon.isCorrect },
    ]);

    if (isReadMode) {
      // Read mode: show modal card
      setRevealedBalloon(balloon);
      playCardOpenSound();
    } else {
      // Pop mode: correct/wrong feedback
      if (balloon.isCorrect) {
        if (showFeedback) playCorrectSound();
        setScore((s) => {
          const next = { ...s, correct: s.correct + 1 };
          scoreRef.current = next;
          return next;
        });
      } else {
        if (showFeedback) playWrongSound();
        setScore((s) => {
          const next = { ...s, wrong: s.wrong + 1 };
          scoreRef.current = next;
          return next;
        });
      }
    }

    setTimeout(() => {
      setPopEffects((prev) => prev.filter((e) => e.id !== balloon.id));
    }, 1000);
  },
  [popped, isReadMode, showFeedback]
);
```

`playCardOpenSound` import'unu ekle:

```typescript
import { playPopSound, playCorrectSound, playWrongSound, playCardOpenSound, playCelebrationSound } from "@/lib/sounds";
```

`revealedBalloon` state'ini ekle:

```typescript
const [revealedBalloon, setRevealedBalloon] = useState<BalloonData | null>(null);
```

- [ ] **Step 6: Read modunda tamamlanma mantığını güncelle**

Mevcut `useEffect`'i read modunda farklı davranacak şekilde güncelle:

```typescript
useEffect(() => {
  if (isReadMode) {
    // Read mode: all balloons popped and no modal open
    if (popped.size === balloons.length && !revealedBalloon && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setTimeout(() => {
        playCelebrationSound();
        setShowReadComplete(true);
      }, 500);
    }
  } else {
    // Pop mode: existing logic
    if (score.correct >= correctCount && correctCount > 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setTimeout(() => {
        const s = scoreRef.current;
        const stats: GameStats = {
          totalItems: options.length,
          correctCount: s.correct,
          wrongCount: s.wrong,
          timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
          completedAt: new Date().toISOString(),
        };
        onComplete(stats);
      }, 800);
    }
  }
}, [isReadMode, score.correct, correctCount, onComplete, options.length, popped.size, balloons.length, revealedBalloon]);
```

`showReadComplete` state'ini ekle:

```typescript
const [showReadComplete, setShowReadComplete] = useState(false);
```

- [ ] **Step 7: Pop efektlerini read modunda güncelle**

Read modunda doğru/yanlış emoji yerine sadece patlama emojisi göster:

```tsx
{/* Pop effects */}
<AnimatePresence>
  {popEffects.map((effect) => (
    <motion.div
      key={`effect-${effect.id}`}
      className="pointer-events-none absolute z-20 font-heading text-3xl font-bold"
      style={{ left: `${effect.x}%`, top: `${effect.y}%`, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 2, y: -40 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {isReadMode ? "💥" : showFeedback ? (effect.correct ? "✅" : "❌") : "💥"}
    </motion.div>
  ))}
</AnimatePresence>
```

- [ ] **Step 8: `resetGame`'i read modu state'leri dahil güncelle**

```typescript
const resetGame = () => {
  setPopped(new Set());
  setPopEffects([]);
  setScore({ correct: 0, wrong: 0 });
  scoreRef.current = { correct: 0, wrong: 0 };
  hasCompletedRef.current = false;
  startTime.current = Date.now();
  setRevealedBalloon(null);
  setShowReadComplete(false);
};
```

- [ ] **Step 9: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok (modal kart ve kutlama henüz render edilmiyor ama state'ler tanımlı)

- [ ] **Step 10: Commit**

```bash
git add src/components/BalloonPop.tsx
git commit -m "feat: BalloonPop read modu temel mantığı — soru gizleme, balon metni gizleme, handlePop dallanması"
```

---

### Task 3: BalloonPop — Modal Kart Bileşeni

**Files:**
- Modify: `src/components/BalloonPop.tsx`

- [ ] **Step 1: Modal kart JSX'ini ekle**

Balon alanının hemen altına, "All popped message" bölümünden önce, modal kartı ekle:

```tsx
{/* Read Mode: Revealed Card Modal */}
<AnimatePresence>
  {isReadMode && revealedBalloon && (
    <motion.div
      key="read-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => setRevealedBalloon(null)}
    >
      <motion.div
        key="read-modal-card"
        className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8 shadow-2xl"
        style={{
          backgroundColor: revealedBalloon.color,
          border: "4px solid rgba(255,255,255,0.3)",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {revealedBalloon.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={revealedBalloon.imageUrl}
            alt=""
            className="h-32 w-32 rounded-2xl border-4 border-white/30 object-cover shadow-lg"
          />
        )}
        {revealedBalloon.text && (
          <p
            className="text-center font-heading text-3xl font-bold text-white sm:text-4xl"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          >
            {revealedBalloon.text}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold text-white/70">
          Devam etmek için dokunun
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Bu kodu bileşenin return bloğunun içinde, kapanış `</div>` etiketinden hemen önce ekle (en dış div'in içinde ama balloon area div'inin dışında). Modal `fixed inset-0 z-50` olduğu için konumu önemli değil, sayfanın üstüne oturur.

- [ ] **Step 2: Modal'a tıklandığında overlay kapanışını doğrula**

Overlay'e tıklanınca `setRevealedBalloon(null)` çağrılır. Kart içine tıklanınca `e.stopPropagation()` ile engellenir. Ama kullanıcı karta da tıklayınca kapanmasını istedi — kart onClick'ini de overlay ile aynı yap:

```tsx
<motion.div
  key="read-modal-card"
  className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8 shadow-2xl"
  style={{
    backgroundColor: revealedBalloon.color,
    border: "4px solid rgba(255,255,255,0.3)",
  }}
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
  onClick={() => setRevealedBalloon(null)}
>
```

`e.stopPropagation()` satırını kaldır — hem overlay'e hem karta tıklayınca kapanacak.

- [ ] **Step 3: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 4: Commit**

```bash
git add src/components/BalloonPop.tsx
git commit -m "feat: BalloonPop read modu modal kart — balon patlatılınca seçenek kartı gösterilir"
```

---

### Task 4: BalloonPop — Read Modu Kutlama Ekranı

**Files:**
- Modify: `src/components/BalloonPop.tsx`

- [ ] **Step 1: Mevcut "All popped message" bölümünü güncelle**

Mevcut "All popped message" bloğunu read modu için genişlet. Read modunda `showReadComplete` state'i true olduğunda kutlama ekranı gösterilecek. Mevcut bloğu şu şekilde değiştir:

```tsx
{/* All popped — completion */}
{isReadMode ? (
  // Read mode: celebration with replay button
  showReadComplete && (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
        <motion.div
          className="mb-3 text-5xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          🎉
        </motion.div>
        <p className="font-heading text-xl font-bold text-[#2D1B69]">
          {theme.celebrationText}
        </p>
        <p className="mt-1 text-sm font-bold text-[#8B7BAD]">
          {options.length} seçenek okundu!
        </p>
        <button
          type="button"
          onClick={resetGame}
          className="mt-4 rounded-2xl px-6 py-2.5 font-heading text-sm font-bold text-white shadow-md transition hover:scale-105 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FF8A50)" }}
        >
          🔄 Tekrar Oyna
        </button>
      </div>
    </motion.div>
  )
) : (
  // Pop mode: existing completion
  popped.size === balloons.length && (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
        <div className="mb-2 text-4xl">{!showFeedback || score.wrong === 0 ? "🏆" : "🎈"}</div>
        <p className="font-heading text-lg font-bold text-[#2D1B69]">
          {!showFeedback ? "Tebrikler!" : score.wrong === 0 ? "Mükemmel!" : "Tamamlandı!"}
        </p>
        {showFeedback && (
          <p className="text-sm font-bold text-[#8B7BAD]">
            {score.correct} doğru, {score.wrong} yanlış
          </p>
        )}
      </div>
    </motion.div>
  )
)}
```

- [ ] **Step 2: Emoji confetti efekti ekle (basit versiyon)**

Kutlama ekranına tema emoji'lerini dökülen confetti gibi ekle. `showReadComplete` true olduğunda, kutlama div'inin **üstüne** confetti emoji'leri yerleştir:

```tsx
{isReadMode && showReadComplete && (
  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
    {theme.decorEmojis.slice(0, 6).map((emoji, i) => (
      <motion.div
        key={`confetti-${i}`}
        className="absolute text-2xl"
        style={{ left: `${10 + i * 15}%` }}
        initial={{ y: -40, opacity: 1, rotate: 0 }}
        animate={{
          y: ["-10%", "110%"],
          rotate: [0, 360],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 2.5 + i * 0.3,
          delay: i * 0.2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeIn",
        }}
      >
        {emoji}
      </motion.div>
    ))}
  </div>
)}
```

Bu bloğu balloon area div'inin içinde, completion bloğunun hemen önüne ekle.

- [ ] **Step 3: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 4: Commit**

```bash
git add src/components/BalloonPop.tsx
git commit -m "feat: BalloonPop read modu kutlama ekranı — confetti ve tekrar oyna butonu"
```

---

### Task 5: Create Wizard — Balloon-Pop Display Adımı

**Files:**
- Modify: `src/app/create/page.tsx`

- [ ] **Step 1: `getFlowSteps` fonksiyonuna balloon-pop için display adımı ekle**

```typescript
function getFlowSteps(activityType: ActivityType | null): FlowStep[] {
  if (!activityType) return ["type"];
  if (activityType === "card") return ["type", "display", "theme", "content", "preview"];
  if (activityType === "balloon-pop") return ["type", "display", "theme", "content", "preview"];
  return ["type", "theme", "content", "preview"];
}
```

- [ ] **Step 2: `displayMode` state tipini genişlet**

Mevcut state tanımını güncelle:

```typescript
// Eski:
const [displayMode, setDisplayMode] = useState<"grid" | "stack" | null>(null);

// Yeni:
const [displayMode, setDisplayMode] = useState<"grid" | "stack" | "pop" | "read" | null>(null);
```

- [ ] **Step 3: `selectType` fonksiyonunu güncelle**

balloon-pop seçildiğinde de display adımına yönlendir:

```typescript
function selectType(type: ActivityType) {
  setActivityType(type);
  if (type === "card") {
    setDisplayMode(displayMode ?? null);
    setCurrentStep("display");
  } else if (type === "balloon-pop") {
    setDisplayMode(displayMode ?? null);
    setCurrentStep("display");
  } else {
    setDisplayMode(null);
    setCurrentStep("theme");
  }
  // Reset options for new type
  if (type !== activityType) {
    setOptions([{ id: uuidv4(), text: "" }]);
    setTitle("");
  }
}
```

- [ ] **Step 4: `confirmDisplayMode` fonksiyonunun tipini genişlet**

```typescript
// Eski:
function confirmDisplayMode(mode: "grid" | "stack") {

// Yeni:
function confirmDisplayMode(mode: "grid" | "stack" | "pop" | "read") {
  setDisplayMode(mode);
  setCurrentStep("theme");
}
```

- [ ] **Step 5: Display adımı UI'ına balloon-pop seçeneklerini ekle**

Mevcut display step section'ını (`currentStep === "display"`) her iki tip için çalışacak şekilde güncelle:

```tsx
{/* Step: Display */}
{currentStep === "display" && (
  <section className="animate-slide-up space-y-6" aria-labelledby="step-display-heading">
    <h2 id="step-display-heading" className="sr-only">Görünüm modu</h2>
    <div className="text-center">
      <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
        {activityType === "balloon-pop" ? "Balon modu seçin" : "Kartlar nasıl görünsün?"}
      </h3>
      <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">Bir görünüm modu seçin</p>
    </div>

    {activityType === "balloon-pop" ? (
      <div className="grid grid-cols-2 gap-5 pt-2">
        <button
          type="button"
          onClick={() => confirmDisplayMode("pop")}
          className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #FFE8F5, #FFD6EC)" }}
          >
            <span className="text-5xl">🎯</span>
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-[#2D1B69]">Balon Patlat</span>
            <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Soruya doğru cevap veren balonları patlat</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => confirmDisplayMode("read")}
          className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #E8F4FD, #D6ECFF)" }}
          >
            <span className="text-5xl">📖</span>
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-[#2D1B69]">Balon Oku</span>
            <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Balonları patlatarak seçenekleri oku</p>
          </div>
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-5 pt-2">
        {/* Existing card grid/stack buttons — keep as is */}
        <button
          type="button"
          onClick={() => confirmDisplayMode("grid")}
          className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #E8FFF0, #D6FFE0)" }}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-4 w-4 rounded-md bg-[#6BCB77]/60" />
              ))}
            </div>
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-[#2D1B69]">Izgara</span>
            <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">3x3 ızgara düzeni</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => confirmDisplayMode("stack")}
          className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #F3E8FF, #E6D6FF)" }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-8 w-12 rounded-lg border-2 border-[#9B59B6]/50 bg-[#9B59B6]/20" />
              <div className="h-8 w-12 -translate-y-4 rounded-lg border-2 border-[#9B59B6]/70 bg-[#9B59B6]/30" />
            </div>
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-[#2D1B69]">Sıralı</span>
            <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Kartlar sırayla açılır</p>
          </div>
        </button>
      </div>
    )}
  </section>
)}
```

- [ ] **Step 6: Content validation'ı read modu için güncelle**

`contentValid` useMemo'sundaki `balloon-pop` case'ini güncelle:

```typescript
case "quiz":
  return (
    options.length >= 2 &&
    options.every((o) => o.text.trim() || o.imageUrl) &&
    options.some((o) => o.isCorrect)
  );

case "balloon-pop":
  if (displayMode === "read") {
    return (
      options.length >= 2 &&
      options.every((o) => o.text.trim() || o.imageUrl)
    );
  }
  return (
    options.length >= 2 &&
    options.every((o) => o.text.trim() || o.imageUrl) &&
    options.some((o) => o.isCorrect)
  );
```

`contentValid` useMemo dependency array'ine `displayMode` ekle:

```typescript
}, [activityType, options, groups, title, displayMode]);
```

- [ ] **Step 7: Content adımında read modundaki farkları uygula**

Content bölümünde balloon-pop read modunda soru alanı ve isCorrect toggle'larını gizle.

Subtitle kısmında:
```tsx
{activityType === "balloon-pop" && displayMode === "read" && "Balonlara eklenecek seçenekleri girin"}
{activityType === "balloon-pop" && displayMode !== "read" && "Soruyu ve balonları oluşturun"}
```

Soru (title) input'u — read modunda gizle:
```tsx
{/* Title Input — hide for balloon-pop read mode */}
{!(activityType === "balloon-pop" && displayMode === "read") && (
  <div className="card-playful p-5">
    <label htmlFor="activity-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
      ...existing label logic...
    </label>
    <input ... />
  </div>
)}
```

Show Feedback toggle — read modunda gizle:
```tsx
{activityType && ["quiz", "missing-word", "match", "group-sort"].includes(activityType) || (activityType === "balloon-pop" && displayMode !== "read") ? (
```

Daha basit bir yaklaşım — mevcut condition'a `&& !(activityType === "balloon-pop" && displayMode === "read")` ekle:

```tsx
{activityType && ["quiz", "missing-word", "balloon-pop", "match", "group-sort"].includes(activityType) && !(activityType === "balloon-pop" && displayMode === "read") && (
```

isCorrect toggle'ları — read modunda gizle (satır ~721). Mevcut koşulu güncelle:

```tsx
{/* Eski: */}
{(activityType === "quiz" || activityType === "missing-word" || activityType === "balloon-pop") && (

{/* Yeni: */}
{(activityType === "quiz" || activityType === "missing-word" || (activityType === "balloon-pop" && displayMode !== "read")) && (
```

Validation mesajını da read modunda güncelle (satır ~903). "En az bir doğru cevap işaretleyin" mesajı read modunda gösterilmemeli:

```tsx
{/* Eski: */}
{(activityType === "quiz" || activityType === "missing-word" || activityType === "balloon-pop") &&
  !options.some((o) => o.isCorrect) &&
  "En az bir doğru cevap işaretleyin. "}

{/* Yeni: */}
{(activityType === "quiz" || activityType === "missing-word" || (activityType === "balloon-pop" && displayMode !== "read")) &&
  !options.some((o) => o.isCorrect) &&
  "En az bir doğru cevap işaretleyin. "}
```

- [ ] **Step 8: `handleSave`'de display_mode'u balloon-pop için de gönder**

```typescript
// Eski:
display_mode: activityType === "card" ? displayMode : null,

// Yeni:
display_mode: (activityType === "card" || activityType === "balloon-pop") ? displayMode : null,
```

- [ ] **Step 9: handleSave validation'da balloon-pop display mode kontrolü ekle**

```typescript
// Eski:
if (activityType === "card" && !displayMode) return;

// Yeni:
if (activityType === "card" && !displayMode) return;
if (activityType === "balloon-pop" && !displayMode) return;
```

- [ ] **Step 10: Preview adımında balloon-pop display mode göster**

Mevcut card display mode gösterimini genişlet:

```tsx
{/* Eski: */}
{activityType === "card" && displayMode && (
  <div className="flex items-center justify-between px-5 py-4">
    <span className="text-sm font-semibold text-[#8B7BAD]">👀 Görünüm</span>
    <span className="font-heading text-sm font-bold text-[#2D1B69]">
      {displayMode === "grid" ? "Izgara (3x3)" : "Sıralı"}
    </span>
  </div>
)}

{/* Yeni: */}
{(activityType === "card" || activityType === "balloon-pop") && displayMode && (
  <div className="flex items-center justify-between px-5 py-4">
    <span className="text-sm font-semibold text-[#8B7BAD]">👀 Görünüm</span>
    <span className="font-heading text-sm font-bold text-[#2D1B69]">
      {displayMode === "grid" ? "Izgara (3x3)" : displayMode === "stack" ? "Sıralı" : displayMode === "pop" ? "Balon Patlat" : "Balon Oku"}
    </span>
  </div>
)}
```

Preview'daki soru satırını read modunda gizle:

```tsx
{/* Eski: */}
<div className="flex items-center justify-between px-5 py-4">
  <span className="text-sm font-semibold text-[#8B7BAD]">📝 {activityType === "quiz" || activityType === "balloon-pop" ? "Soru" : ...}</span>
  <span ...>{title.trim() || "Adsız etkinlik"}</span>
</div>

{/* Yeni — read modunda gizle: */}
{!(activityType === "balloon-pop" && displayMode === "read") && (
  <div className="flex items-center justify-between px-5 py-4">
    <span className="text-sm font-semibold text-[#8B7BAD]">📝 {activityType === "quiz" || activityType === "balloon-pop" ? "Soru" : activityType === "missing-word" ? "Cümle" : "Etkinlik adı"}</span>
    <span className="font-heading text-sm font-bold text-[#2D1B69]">
      {title.trim() || "Adsız etkinlik"}
    </span>
  </div>
)}
```

- [ ] **Step 11: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 12: Commit**

```bash
git add src/app/create/page.tsx
git commit -m "feat: create wizard — balloon-pop display modu seçimi (pop/read)"
```

---

### Task 6: Edit Sayfası — Balloon-Pop Display Mode Desteği

**Files:**
- Modify: `src/app/edit/[id]/page.tsx`

- [ ] **Step 1: Display mode state tipini genişlet**

Import'u güncelle — `DisplayMode` ekle:

```typescript
import type { ActivityType, DisplayMode } from "@/types/activity";
```

State'i güncelle (eğer Task 1'de yapılmadıysa):

```typescript
const [displayMode, setDisplayMode] = useState<DisplayMode | null>(null);
```

- [ ] **Step 2: Tip seçimi butonlarında balloon-pop display mode yönetimi**

Mevcut onClick handler'ında card için olan mantığı genişlet:

```typescript
onClick={() => {
  setActivityType(t.type);
  if (t.type === "card" && !displayMode) setDisplayMode("grid");
  else if (t.type === "balloon-pop" && !displayMode) setDisplayMode("pop");
  else if (t.type !== "card" && t.type !== "balloon-pop") setDisplayMode(null);
}}
```

- [ ] **Step 3: Display mode UI bölümünü balloon-pop için de göster**

Mevcut `{activityType === "card" && (...)}` display mode bölümünü genişlet:

```tsx
{/* Display mode (card & balloon-pop) */}
{activityType === "card" && (
  <div className="animate-scale-in card-playful p-5">
    <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
      <span>👀</span> Görünüm Modu
    </label>
    <div className="grid grid-cols-2 gap-3">
      {(["grid", "stack"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setDisplayMode(m)}
          className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
            displayMode === m ? "text-white shadow-md" : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
          }`}
          style={
            displayMode === m
              ? { background: "linear-gradient(135deg, #4D96FF, #6BCB77)", border: "2px solid transparent" }
              : { border: "2px solid rgba(45, 27, 105, 0.06)" }
          }
        >
          {m === "grid" ? "⊞ Izgara" : "▤ Sıralı"}
        </button>
      ))}
    </div>
  </div>
)}

{activityType === "balloon-pop" && (
  <div className="animate-scale-in card-playful p-5">
    <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
      <span>👀</span> Balon Modu
    </label>
    <div className="grid grid-cols-2 gap-3">
      {(["pop", "read"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setDisplayMode(m)}
          className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
            displayMode === m ? "text-white shadow-md" : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
          }`}
          style={
            displayMode === m
              ? { background: "linear-gradient(135deg, #4D96FF, #6BCB77)", border: "2px solid transparent" }
              : { border: "2px solid rgba(45, 27, 105, 0.06)" }
          }
        >
          {m === "pop" ? "🎯 Balon Patlat" : "📖 Balon Oku"}
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: Content validation'ı read modu için güncelle**

Edit sayfasındaki `contentValid` useMemo'sunda:

```typescript
case "balloon-pop":
  if (displayMode === "read") {
    return options.length >= 2 && options.every((o) => o.text.trim() || o.imageUrl);
  }
  return options.length >= 2 && options.every((o) => o.text.trim() || o.imageUrl) && options.some((o) => o.isCorrect);
```

Dependency array'e `displayMode` ekle.

- [ ] **Step 5: Read modunda soru alanı ve isCorrect toggle'larını gizle**

Soru alanı — read modunda label'ı değiştir veya gizle:

```tsx
{/* Title — hide label change for read mode */}
{activityType === "quiz" || (activityType === "balloon-pop" && displayMode !== "read")
  ? "Soru"
  : activityType === "missing-word"
    ? "Cümle (___ ile boşluk belirtin)"
    : activityType === "balloon-pop" && displayMode === "read"
      ? "Etkinlik adı"
      : "Başlık"}
```

Show Feedback toggle — read modunda gizle:

```tsx
{["quiz", "missing-word", "balloon-pop", "match", "group-sort"].includes(activityType) && !(activityType === "balloon-pop" && displayMode === "read") && (
```

isCorrect toggle — read modunda gizle:

```tsx
{(activityType === "quiz" || activityType === "missing-word" || (activityType === "balloon-pop" && displayMode !== "read")) && (
```

- [ ] **Step 6: `handleSave`'de display_mode'u balloon-pop için de gönder**

```typescript
// Eski:
display_mode: activityType === "card" ? displayMode : null,

// Yeni:
display_mode: (activityType === "card" || activityType === "balloon-pop") ? displayMode : null,
```

- [ ] **Step 7: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 8: Commit**

```bash
git add src/app/edit/[id]/page.tsx
git commit -m "feat: edit sayfası — balloon-pop display mode (pop/read) desteği"
```

---

### Task 7: Play Sayfası — DisplayMode Prop İletimi

**Files:**
- Modify: `src/app/play/[id]/page.tsx`

- [ ] **Step 1: BalloonPop bileşenine displayMode prop'unu ilet**

Mevcut balloon-pop render bloğunu güncelle:

```tsx
{/* Eski: */}
{activity.type === "balloon-pop" && (
  <BalloonPop
    options={activity.options}
    title={activity.title}
    theme={theme}
    showFeedback={activity.show_feedback}
    onComplete={handleComplete}
  />
)}

{/* Yeni: */}
{activity.type === "balloon-pop" && (
  <BalloonPop
    options={activity.options}
    title={activity.title}
    theme={theme}
    showFeedback={activity.show_feedback}
    displayMode={(activity.display_mode === "pop" || activity.display_mode === "read") ? activity.display_mode : "pop"}
    onComplete={handleComplete}
  />
)}
```

- [ ] **Step 2: Read modunda ResultsScreen ve Celebration gösterimini engellemek için kontrol ekle**

Read modunda `onComplete` çağrılmayacağı için `gameStats` hiç set edilmez — dolayısıyla ResultsScreen zaten gösterilmez. Ama emin olmak için `handleComplete`'in read modunda çağrılmayacağını doğrula.

BalloonPop bileşeninde read modunda `onComplete` çağrılmıyor (Task 2, Step 6'da ayarlandı). Bu yeterli, play sayfasında ekstra değişiklik gerekmiyor.

- [ ] **Step 3: Build kontrolü**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Hata yok

- [ ] **Step 4: Commit**

```bash
git add src/app/play/[id]/page.tsx
git commit -m "feat: play sayfası — BalloonPop'a displayMode prop iletimi"
```

---

### Task 8: Manuel Test ve Son Kontrol

- [ ] **Step 1: Dev server'ı başlat**

Run: `npm run dev`

- [ ] **Step 2: Create wizard'dan read modunda etkinlik oluştur**

1. `/create` sayfasına git
2. "Balon Patlatma" seç
3. "Balon Oku" modunu seç
4. Bir tema seç
5. Soru alanının gizlendiğini doğrula
6. 3-4 seçenek ekle (sadece metin)
7. isCorrect toggle'larının gizlendiğini doğrula
8. Kaydet

- [ ] **Step 3: Play sayfasında read modunu test et**

1. Oluşturulan etkinliğin play sayfasına yönlendirildiğini doğrula
2. Balonların metin olmadan göründüğünü doğrula
3. Soru başlığının gösterilmediğini doğrula
4. Bir balona tıkla — modal kart açılmalı
5. Karta/overlay'e tıkla — modal kapanmalı
6. Tüm balonları patlat — kutlama ekranı görünmeli
7. "Tekrar Oyna" butonuna bas — balonlar sıfırlanmalı

- [ ] **Step 4: Pop modunun hala çalıştığını doğrula**

1. `/create` sayfasına git
2. "Balon Patlatma" → "Balon Patlat" modunu seç
3. Soru ve isCorrect toggle'larının göründüğünü doğrula
4. Etkinlik oluştur ve oyna — mevcut davranışın bozulmadığını doğrula

- [ ] **Step 5: Edit sayfasını test et**

1. Oluşturulan read modundaki etkinliği düzenle
2. Display mode'un "Balon Oku" olarak seçili olduğunu doğrula
3. Kaydet ve oyna

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test: balloon-pop read modu — manuel test tamamlandı"
```
