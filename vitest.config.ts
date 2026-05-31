import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 *
 * - `jsdom` provides a DOM so React hooks/components can be exercised with
 *   `@testing-library/react`.
 * - The `@/*` alias mirrors `tsconfig.json` so test imports match app imports.
 * - Only `*.test.*` / `*.spec.*` files are collected; production code lives
 *   beside its tests but is never picked up as a suite.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
