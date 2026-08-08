import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards shared components against a hardcoded English accessibility label
 * reaching every locale at once.
 *
 * Six of these shipped and rendered on all 12 Chinese pages — three font-size
 * buttons, the font-size live region, the nav toggle and the language switcher.
 * They are the text a screen-reader user actually hears, and four of the six had
 * translations sitting unused in locales.ts the whole time. Fixed in 0a82988 and
 * 40efe52; nothing prevented a seventh until this test.
 *
 * Nothing else could catch them. tests/i18n/locale-coverage.test.ts checks that
 * *translated* strings exist in every locale — it never looks at .astro
 * templates, so a component that hardcodes English is invisible to it. The
 * defect is also invisible to typecheck, to the build, and to a screenshot.
 *
 * Scope is src/components and src/layouts only: those render on all three
 * locales from one template, so a literal there cannot vary by locale. Files
 * under src/pages/zh-hant/ are already locale-forked, where an English literal
 * is either correct (a proper noun) or a different, page-scoped bug.
 *
 * See docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SHARED_DIRS = ['components', 'layouts']
  .map((d) => join(ROOT, 'src', d))
  .filter((d) => existsSync(d));

function astroFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return astroFiles(full);
    return entry.endsWith('.astro') ? [full] : [];
  });
}

/** Strip comments so a note *about* a bad label is not read as the label. */
function template(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const FILES = SHARED_DIRS.flatMap(astroFiles);

/**
 * Matches only literal quoted values — attr="text" — never attr={expr}.
 *
 * That distinction is the whole test. An expression can vary by locale; a
 * literal cannot, structurally. So this flags the defect by construction rather
 * than by trying to detect "English", which would need a dictionary and would
 * miss exactly the strings nobody thought of.
 */
const LABEL_ATTR = /(?:aria-label|title|alt|data-label)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** Two or more letters in a row — excludes alt="" and data-label="x1". */
const LOOKS_LIKE_PROSE = /[A-Za-z]{2,}/;

/**
 * Literal, English, and legitimately so. Each entry needs a reason the value is
 * locale-invariant by nature — not that fixing it is inconvenient.
 *
 * The language switcher's per-link title/aria-label are NOT here: they render
 * each language in its own name ("English", "繁體中文") from locale metadata, so
 * they are expressions and never match.
 */
const EXEMPT = new Map<string, string>([
  // ['Foo.astro: "chart-x"', 'a JS hook, never rendered as text'],
]);

function findings(): string[] {
  return FILES.flatMap((file) => {
    const rel = relative(join(ROOT, 'src'), file);
    return [...template(file).matchAll(LABEL_ATTR)]
      .map((m) => m[1] ?? m[2] ?? '')
      .filter((v) => LOOKS_LIKE_PROSE.test(v))
      .map((v) => `${rel}: "${v}"`)
      .filter((entry) => !EXEMPT.has(entry));
  });
}

describe('shared components never hardcode an English accessibility label', () => {
  it('actually reads files and matches attributes, so it cannot pass vacuously', () => {
    // 15 tests once shipped here asserting labels no page rendered, and "42
    // passing" was quoted as evidence several times before anyone noticed. If
    // the walker or the regex silently stops matching, every assertion below
    // passes against an empty set. Prove both work before trusting the result.
    expect(FILES.length, 'found no .astro files to scan').toBeGreaterThan(5);

    const sample = '<button aria-label="Reset text size" title={t(\'x\')}>';
    const matched = [...sample.matchAll(LABEL_ATTR)].map((m) => m[1] ?? m[2]);
    expect(matched, 'regex must catch literals and ignore expressions').toEqual([
      'Reset text size',
    ]);
  });

  it('has no literal aria-label, title, alt or data-label in src/components or src/layouts', () => {
    expect(
      findings(),
      'A literal here cannot vary by locale, so it renders English on every Chinese page. ' +
        'Route it through getTranslation(), or add it to EXEMPT with a reason it is ' +
        'locale-invariant.',
    ).toEqual([]);
  });
});
