/**
 * Fails the build if the compiled CSS does not contain real Tailwind output.
 *
 * `astro build` exits 0 whether or not Tailwind is wired in, because
 * `@import 'tailwindcss'` is valid CSS that simply resolves to nothing when the
 * @tailwindcss/vite plugin is absent. This asserts on the artifact instead of
 * the exit code. See docs/solutions/integration-issues/.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CSS_DIR = 'dist/_astro';

// Each sentinel catches a different failure mode.
//
// IMPORTANT: a sentinel is only trustworthy if the class name appears NOWHERE in
// hand-written CSS. global.css contains remap rules like `.bg-primary-600 {}` and
// `--tw-gradient-from`, so those two strings survive even with the plugin removed
// and cannot detect the failure on their own. Verified by deleting the plugin and
// re-running: only `md\:flex` and `max-w-container` flipped to missing.
const SENTINELS = [
  { pattern: '--tw-', why: 'Tailwind emitted no utility layer at all (plugin missing?)' },
  { pattern: 'md\\:flex', why: 'responsive variants did not compile' },
  { pattern: 'max-w-container', why: "tailwind.config.ts tokens absent (@config not loading?)" },
  { pattern: 'bg-primary-600', why: 'the brand palette from tailwind.config.ts is absent' },
];

let files;
try {
  files = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
} catch {
  console.error(`[verify-css] No ${CSS_DIR}/ directory. Did astro build run?`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`[verify-css] ${CSS_DIR}/ contains no .css files.`);
  process.exit(1);
}

const css = files.map((f) => readFileSync(join(CSS_DIR, f), 'utf8')).join('\n');
const missing = SENTINELS.filter((s) => !css.includes(s.pattern));

if (missing.length > 0) {
  console.error('[verify-css] FAIL — compiled CSS is missing expected Tailwind output:');
  for (const m of missing) console.error(`  - ${m.pattern}: ${m.why}`);
  console.error('\nThe build produced CSS, but not the CSS this site needs.');
  console.error('Check vite.plugins in astro.config.mjs and the @import/@config in src/styles/global.css.');
  process.exit(1);
}

console.log(`[verify-css] OK — ${files.length} CSS file(s), all ${SENTINELS.length} sentinels present.`);
