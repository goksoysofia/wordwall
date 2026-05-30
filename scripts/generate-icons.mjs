// PWA ikon üretici: public/icon.svg kaynağından tüm gerekli boyutları üretir.
// Çalıştır: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon.svg"));
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

// Maskable ikon için iç içerik %80 güvenli bölgede kalmalı; kaynak SVG zaten öyle.
const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 }, // iOS ana ekran (şeffaflık yok, köşeyi iOS yuvarlar)
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(join(outDir, t.name));
  console.log(`✓ ${t.name} (${t.size}x${t.size})`);
}

// favicon (32x32 PNG — modern tarayıcılar için yeterli)
await sharp(svg, { density: 384 })
  .resize(32, 32)
  .png()
  .toFile(join(root, "public", "favicon.png"));
console.log("✓ favicon.png (32x32)");

console.log("Tüm ikonlar üretildi.");
