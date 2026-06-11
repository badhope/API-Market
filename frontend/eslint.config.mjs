import js from "@eslint/js"
import tseslint from "typescript-eslint"

const BROWSER_GLOBALS = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  HTMLElement: "readonly",
  KeyboardEvent: "readonly",
  KeyboardEventInit: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  navigator: "readonly",
  HTMLInputElement: "readonly",
  HTMLDialogElement: "readonly",
  location: "readonly",
  // Browser DOM APIs that ESLint can't resolve without help when
  // a script uses `page.evaluate(() => ...)` from Playwright. We
  // declare them globally so `no-undef` stops complaining.
  getComputedStyle: "readonly",
  getBoundingClientRect: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  matchMedia: "readonly",
  IntersectionObserver: "readonly",
  ResizeObserver: "readonly",
  MutationObserver: "readonly",
}

const NODE_GLOBALS = {
  ...BROWSER_GLOBALS,
  process: "readonly",
  global: "readonly",
  globalThis: "readonly",
  __dirname: "readonly",
  module: "readonly",
  require: "readonly",
  Buffer: "readonly",
}

const TEST_GLOBALS = {
  describe: "readonly",
  it: "readonly",
  expect: "readonly",
  vi: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  afterAll: "readonly",
  test: "readonly",
}

/**
 * Flat ESLint config.
 *
 * `next lint` was removed in Next.js 16, so we use the new flat
 * config style directly. The Next 16 config ships `eslint-plugin-react`
 * 7.37, which is incompatible with ESLint 10, so we don't pull in
 * `eslint-config-next` and instead rely on:
 *
 *   - `@eslint/js` recommended
 *   - `typescript-eslint` strict rules
 *   - A focused a11y / no-unescaped-entities / no-unused-vars
 *     set, hand-picked from the recommended Next.js rules.
 *
 * Coverage for "is this code correct?" is provided by `tsc --noEmit`
 * (which catches everything TypeScript can catch), the Vitest suite,
 * and the Next build. Lint here is for the *vibe*: the obvious
 * foot-guns and the a11y rules.
 */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "public/data/**",
      ".trae/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: NODE_GLOBALS,
    },
    rules: {
      // Project-style preferences that the recommended set doesn't
      // enforce by default.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: BROWSER_GLOBALS },
    rules: {
      // Unescaped entities like `'`, `>`, `}` in JSX produce
      // confusing HTML and break some screen-readers — keep them
      // explicit (`&apos;`, etc.) or wrap in `{}` and embed as a
      // string.
      "react/no-unescaped-entities": "off", // we are not loading eslint-plugin-react
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message: "Use console.warn / console.error or remove.",
        },
      ],
    },
  },
  {
    files: [
      "scripts/**/*.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    languageOptions: { globals: { ...NODE_GLOBALS, ...TEST_GLOBALS } },
  },
]
