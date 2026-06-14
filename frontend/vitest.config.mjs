import { defineConfig } from "vitest/config"
import path from "node:path"

/**
 * Vitest configuration.
 *
 * The frontend is server-component-heavy and ships as a static export,
 * so we don't need a full Vite dev server here. Vitest runs the build
 * script and the Zod schemas in a plain Node environment, with jsdom
 * reserved for the few React Testing Library cases we add for the
 * codex components.
 *
 * `src/scripts/**` is excluded — those are run by `tsx` directly, not
 * through Vitest. They have their own integration test in
 * `src/scripts/__tests__/`.
 */
export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["src/components/**/__tests__/**", "jsdom"],
      ["src/app/**/__tests__/**", "jsdom"],
    ],
    include: [
      "src/**/__tests__/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/__tests__/**/*.{test,spec}.ts",
      "scripts/import/**/__tests__/**/*.{test,spec}.ts",
    ],
    exclude: ["node_modules", ".next", "out", "**/*.d.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: [
        "src/schemas/**/*.ts",
        "src/lib/format.ts",
        "src/lib/code-gen.ts",
        "scripts/build-data.ts",
        "scripts/import/write.ts",
        "scripts/import/score.ts",
      ],
      exclude: ["**/__tests__/**", "**/*.d.ts", "**/*.config.*"],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 75,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Transpile JSX in test files with the *automatic* runtime.
    // esbuild's default `jsx: "transform"` uses the classic runtime
    // and requires `React` to be in scope, which would explode on
    // every `render(<Component />)` call. The automatic runtime
    // imports `jsx` from `react/jsx-runtime` for us. Next.js still
    // uses its own SWC pipeline for the actual app build, so this
    // only affects the test runtime.
    jsx: "automatic",
  },
})
