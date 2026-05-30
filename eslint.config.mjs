import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "ios/**",
      "android/**",
      "out/**",
      "next-env.d.ts",
      "src/test-email.js",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    // React Compiler henüz etkin değil (next.config.ts'de yok). React 19'un
    // compiler-farkındalıklı kuralları, çalışma zamanında doğru olan ve yaygın
    // kullanılan kalıpları (lazy useState/useRef başlatıcıları, reset effect'leri,
    // ref-callback kalıbı) hata olarak işaretliyor. Çalışan kodu riskli şekilde
    // refactor etmemek için bunları uyarıya indiriyoruz; compiler hazırlığı için
    // görünür kalırlar. Compiler etkinleştirildiğinde tekrar error'a çekilmeli.
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
];

export default eslintConfig;
