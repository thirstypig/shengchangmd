import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Every internal link the built site emits must point at a path the build
 * actually produced.
 *
 * This is the guard `src/components/LanguageSwitcher.astro` was missing: it
 * built each locale's URL by string substitution on the current path, with
 * no check that a translated version of the page exists. On /privacy/ and
 * /accessibility/ — English-only pages — it offered 繁體/简体 links to
 * /zh-hant/privacy/ and /zh-hans/privacy/ (and the accessibility
 * equivalents), all four of which 404 on the live site.
 *
 * `scripts/verify-build.mjs` sounds like it should have caught this, and
 * does not: it only reads `<img src>`, `<script src>` and `<link href>` out
 * of the built HTML, never `<a href>`. This test reads every `<a href="/...">`
 * in dist/ and checks the target was actually built.
 *
 * Requires a build first: `ALLOW_INDEXING=true npm run build`. Unlike the
 * other tests in this directory, this one cannot be a source-level check —
 * "does this page exist in this locale" is exactly the filesystem fact the
 * defect got wrong, so the assertion has to run against the real output.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? htmlFiles(full) : full.endsWith('.html') ? [full] : [];
  });
}

/** Does `dist/` contain a page that would be served at this root-relative path? */
function pathExistsInDist(path: string): boolean {
  // Strip query/hash; both are irrelevant to which file gets served.
  const clean = path.split(/[?#]/)[0];
  const rel = clean.replace(/^\/+/, '');
  if (rel === '') return existsSync(join(DIST, 'index.html'));
  const candidates = [
    join(DIST, rel), // an asset served at its literal path
    join(DIST, rel, 'index.html'), // a route directory ('/privacy/' -> privacy/index.html)
    join(DIST, `${rel}.html`), // a route file without trailing slash
  ];
  return candidates.some((c) => existsSync(c));
}

describe('internal links point at pages the build actually produced', () => {
  if (!existsSync(DIST)) {
    it.skip('dist/ not found — run `ALLOW_INDEXING=true npm run build` first', () => {});
    return;
  }

  const pages = htmlFiles(DIST);
  const hrefPattern = /<a\b[^>]*\shref="([^"]+)"/g;

  it('found at least one built page to scan', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it('every internal <a href="/..."> resolves to a built path', () => {
    const broken: string[] = [];
    for (const page of pages) {
      const html = readFileSync(page, 'utf8');
      for (const match of html.matchAll(hrefPattern)) {
        const href = match[1];
        // Internal, root-relative links only. External links, mailto:, tel:,
        // and hash-only anchors are out of scope for "did the build produce
        // this page".
        if (!href.startsWith('/')) continue;
        if (!pathExistsInDist(href)) {
          broken.push(`${page.replace(DIST, 'dist')} -> ${href}`);
        }
      }
    }
    expect(broken, `broken internal links:\n${broken.join('\n')}`).toEqual([]);
  });
});
