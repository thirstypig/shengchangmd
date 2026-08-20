import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Every asset a stylesheet points at must actually exist in public/.
 *
 * scripts/verify-build.mjs already checks referenced assets, but it reads the
 * built HTML for `<img src>`, `<script src>` and `<link href>` only. It never
 * looks inside CSS, so a `url()` in a stylesheet — or in an Astro component's
 * scoped <style> block — is outside everything this repo checks.
 *
 * That is not hypothetical. It was demonstrated on 2026-08-19 by deleting
 * public/images/chop-mask.png and running the full pipeline:
 *
 *   npm test        -> 184 passed
 *   npm run build   -> 22 pages built
 *   verify-css      -> OK, all 4 sentinels present
 *   verify-build    -> OK, 58 referenced assets all present
 *
 * All green, with the practice's logo invisible on all 22 pages in both
 * themes. A mask with no image resolves to no coverage, so the element paints
 * nothing at all — it does not fall back, and it does not warn.
 *
 * The failure is silent in the way this repo keeps getting caught by: nothing
 * throws, nothing fails to compile, and the check that sounds like it covers
 * this ("all referenced assets present") is counting a different set of
 * references.
 *
 * Related: docs/solutions/ui-bugs/raster-logo-cannot-serve-two-themes.md
 * and docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC = join(ROOT, 'src');
const PUBLIC = join(ROOT, 'public');

/** Every .astro, .css and .ts file under src/, recursively. */
function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(astro|css|ts)$/.test(entry) ? [full] : [];
  });
}

/**
 * Root-relative asset paths inside url(). Skips data: URIs, which carry their
 * own payload, and absolute URLs, which are not ours to verify.
 */
function urlReferences(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const file of sourceFiles()) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(/url\(\s*['"]?(\/[^'")\s]+)['"]?\s*\)/g)) {
      const path = m[1];
      if (!found.has(path)) found.set(path, new Set());
      found.get(path)!.add(relative(ROOT, file));
    }
  }
  return found;
}

const REFERENCES = urlReferences();

describe('assets referenced from CSS exist in public/', () => {
  it('finds the url() references, so the test cannot pass vacuously', () => {
    // If the scanner stops matching, the assertion below passes against an
    // empty set. This is the guard against that — the same shape the other
    // tests here use, and the reason 15 tests that could never fail shipped
    // on 2026-08-05 before anyone noticed.
    expect(REFERENCES.size).toBeGreaterThan(0);
    expect([...REFERENCES.keys()]).toContain('/images/chop-mask.png');
  });

  it('resolves every referenced path to a file that is actually there', () => {
    const missing = [...REFERENCES.entries()]
      .filter(([path]) => !existsSync(join(PUBLIC, path)))
      .map(([path, files]) => `${path}  (referenced by ${[...files].sort().join(', ')})`);

    expect(
      missing,
      'These paths are referenced from a stylesheet but do not exist in public/. ' +
        'The page will build, every test will pass, and verify-build will report ' +
        '"all referenced assets present" — because it only reads <img src>, ' +
        '<script src> and <link href> out of the built HTML, never CSS.'
    ).toEqual([]);
  });
});

describe('the mask the logo depends on is a real image', () => {
  const mask = join(PUBLIC, 'images/chop-mask.png');

  it('exists and is a PNG', () => {
    expect(existsSync(mask), 'public/images/chop-mask.png is missing').toBe(true);
    // \x89PNG — an empty or truncated file would still satisfy existsSync.
    const header = readFileSync(mask).subarray(0, 8);
    expect([...header]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('carries an alpha channel, which is the whole point of it', () => {
    // PNG colour type is byte 25: 6 = RGBA, 4 = grey+alpha. Without alpha the
    // mask is fully opaque everywhere, so the logo renders as a solid square
    // of --seal rather than as the seal. Re-exporting it flattened is a real
    // way to break this, and it looks like a valid PNG either way.
    const colourType = readFileSync(mask)[25];
    expect([4, 6]).toContain(colourType);
  });
});
