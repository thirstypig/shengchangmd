import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Guards the personal photo gallery's must-stay-unlinked invariant.
 *
 * This page (src/pages/family-photos-2026.astro) exists specifically to be
 * reachable only by direct URL: no nav/footer link, forced noindex
 * regardless of the ALLOW_INDEXING build flag, and excluded from the
 * sitemap. All three of those held for a while during development and then
 * broke — Task 4's own build correctly rendered noindex, but the page still
 * showed up in dist/sitemap-0.xml, because Astro's sitemap integration
 * auto-discovers every route unless told otherwise. That one slipped past
 * every test in this suite (none of them inspect the sitemap or this page's
 * source) and was only caught by a human-directed review reading the built
 * sitemap file directly.
 *
 * These are source-level checks — cheap, fast, no build required — for the
 * two properties a future edit could silently regress:
 *
 *  1. The page must never import BaseLayout or any of its medical-practice
 *     chrome (Header nav, StickyCallBar, WeChatQR, CallButton) — those
 *     would make this look like part of the practice site rather than a
 *     private album, and BaseLayout's noIndex logic is dynamic (computed
 *     from ALLOW_INDEXING and locale review status), which would make this
 *     page indexable in a production build once English is reviewed.
 *  2. astro.config.mjs's sitemap filter must explicitly exclude this
 *     page's path, since the sitemap integration's default behavior is to
 *     include everything it discovers.
 *
 * scripts/verify-build.mjs complements this at the build-output level (it
 * asserts the built sitemap and robots meta agree), but its sitemap check
 * only evaluates pages carrying a <link rel="canonical"> tag — this
 * hand-rolled page has none, so verify-build.mjs cannot see a regression
 * here either. These source-level checks are the only guard for this page.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (relPath: string) => readFileSync(`${ROOT}/${relPath}`, 'utf8');

describe('the personal gallery page stays unlinked and unindexed', () => {
  const pageSource = read('src/pages/family-photos-2026.astro');
  // Strip the explanatory frontmatter comment, which deliberately names
  // these components to say why the page doesn't use them — a bare word
  // match would false-positive on that comment.
  const pageCode = pageSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not import or render BaseLayout or any medical-practice chrome component', () => {
    for (const name of ['BaseLayout', 'Header', 'StickyCallBar', 'WeChatQR', 'CallButton', 'Footer']) {
      expect(pageCode, `family-photos-2026.astro references ${name} outside a comment`).not.toMatch(
        new RegExp(`\\b${name}\\b`),
      );
    }
  });

  it('hardcodes a noindex robots meta tag rather than computing one', () => {
    // Must be a literal string, not an expression — BaseLayout's noIndex is
    // computed from ALLOW_INDEXING and locale review status, and this page
    // must stay noindex regardless of both.
    expect(pageSource).toMatch(/<meta\s+name="robots"\s+content="noindex,\s*nofollow"\s*\/?>/);
  });

  it('is excluded from the sitemap in astro.config.mjs', () => {
    const config = read('astro.config.mjs');
    expect(config).toMatch(/family-photos-2026/);
    // Must be inside the sitemap filter function, not just mentioned anywhere.
    const filterBody = config.match(/filter:\s*\(page\)\s*=>\s*{([\s\S]*?)},\s*}\)/)?.[1] ?? '';
    expect(filterBody, 'family-photos-2026 exclusion not found inside the sitemap filter').toMatch(
      /family-photos-2026/,
    );
  });
});

describe('the asset-prep script cannot resurrect a privacy-cut photo', () => {
  const script = read('scripts/prepare-photo-assets.sh');

  it('names every currently-blocked source file, not just the Arcadia archive photos', () => {
    // The 3 Arcadia Public Library archive photos (no reproduction
    // permission) plus the 4 photos a final review found carrying the
    // owner's home address and third-party private correspondence. If this
    // script is ever re-run without all 7 names present, it silently
    // regenerates whichever ones are missing.
    for (const name of [
      '1475.jpg',
      '1497.jpg',
      '1508.jpg',
      'IMG_1171.HEIC',
      'IMG_1223 copy.HEIC',
      'IMG_1230.HEIC',
      'IMG_1232 copy.HEIC',
    ]) {
      expect(script, `BLOCKED list is missing "${name}"`).toContain(name);
    }
  });
});
