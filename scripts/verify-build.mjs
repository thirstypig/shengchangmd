/**
 * Assertions against the built site, run from `postbuild` alongside
 * verify-css.mjs.
 *
 * Every check here is a defect that actually shipped on this site and that a
 * typecheck, a unit test and a successful build all failed to notice. They are
 * only visible in the output, which is why they live here rather than in
 * tests/ — vitest runs before the build in CI, so it has no dist to look at.
 *
 * Found live on 2026-08-05, all four:
 *  - /og-image.png and /logo.svg were referenced by every page and returned
 *    404, so every link preview was broken
 *  - the sitemap listed only the noindex Chinese pages and omitted every
 *    English subpage — exactly inverted
 *  - the office address was hardcoded into JSON-LD separately from
 *    practice.ts, free to drift from the address patients actually read
 *  - a dead domain was stamped into canonical URLs after the migration
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const failures = [];
const fail = (msg) => failures.push(msg);

function htmlFiles(dir = DIST) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory()
      ? htmlFiles(full)
      : full.endsWith('.html')
        ? [full]
        : [];
  });
}

const pages = htmlFiles();
if (pages.length === 0) fail('no HTML pages in dist — did the build run?');

const read = (f) => readFileSync(f, 'utf8');
const attr = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

// 1. Every same-origin asset a page references must exist in the build.
const siteOrigin = (() => {
  const m = read(pages[0]).match(/rel="canonical" href="(https?:\/\/[^/"]+)/);
  return m ? m[1] : null;
})();
if (!siteOrigin) fail('could not determine the site origin from a canonical URL');

const referenced = new Set();
for (const page of pages) {
  const html = read(page);
  for (const url of [
    ...attr(html, /<(?:img|script)[^>]+src="([^"]+)"/g),
    ...attr(html, /<link[^>]+href="([^"]+)"/g),
    ...attr(html, /property="og:image" content="([^"]+)"/g),
    ...attr(html, /"logo":"([^"]+)"/g),
  ]) {
    if (siteOrigin && url.startsWith(siteOrigin)) referenced.add(url.slice(siteOrigin.length));
    else if (url.startsWith('/')) referenced.add(url);
  }
}
for (const path of referenced) {
  const clean = path.split(/[?#]/)[0];
  if (clean.endsWith('/')) continue;
  if (!existsSync(join(DIST, clean))) fail(`referenced asset missing from build: ${clean}`);
}

// 2. A sitemap must list indexable pages, and only indexable pages. Listing a
//    noindex URL asks a crawler to fetch a page it is then told not to index.
const sitemapFile = join(DIST, 'sitemap-0.xml');
if (existsSync(sitemapFile)) {
  const locs = attr(read(sitemapFile), /<loc>([^<]+)<\/loc>/g);
  if (locs.length === 0) fail('sitemap contains no URLs');

  const pathOf = (u) => new URL(u).pathname;
  const listed = new Set(locs.map(pathOf));

  for (const page of pages) {
    const html = read(page);
    const noindex = /name="robots" content="noindex/.test(html);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical) continue;
    const path = pathOf(canonical);

    if (noindex && listed.has(path)) fail(`sitemap lists a noindex page: ${path}`);
    if (!noindex && !listed.has(path) && !path.startsWith('/404')) {
      fail(`indexable page missing from sitemap: ${path}`);
    }
  }
}

// 3. The address in JSON-LD must be the address in practice.ts. Three copies of
//    it used to exist; a stale one in structured data misdirects patients.
const practice = read('src/data/practice.ts');
const street = practice.match(/street:\s*'([^']+)'/)?.[1];
if (!street) fail('could not read addressParts.street from practice.ts');
else {
  for (const page of pages) {
    const html = read(page);
    const streets = attr(html, /"streetAddress":"([^"]+)"/g);
    for (const s of streets) {
      if (s !== street) fail(`${relative(DIST, page)}: JSON-LD streetAddress "${s}" != practice.ts "${street}"`);
    }
  }
}

// 5. Every hreflang alternate must resolve to a page that was actually built.
//    Check 1 collects these — they are <link href> — and then drops them on the
//    `endsWith('/')` guard, which exists so directory URLs are not treated as
//    asset files. So the alternates were read and silently discarded.
//
//    BaseLayout emitted one alternate per locale unconditionally, with no idea
//    which locales a given page exists in. Four English-only pages
//    (new-patients, hours, privacy, accessibility) therefore advertised zh-Hant
//    and zh-Hans versions that returned 404 on the live site. An alternate
//    pointing at a 404 is worse than no alternate: it is the tag that tells a
//    crawler a translation exists, and it steers the Chinese-language searcher
//    the practice most wants to reach into a dead end.
//
//    TWO assertions, and the second exists because the first cannot fail on an
//    empty page. Validating "every alternate resolves" says nothing when there
//    are no alternates: deleting the emission from BaseLayout entirely left this
//    reporting "OK — 26 pages". A guard that passes when the thing it guards is
//    removed is the defect class this file's header is about, so the second
//    assertion pins the shape instead of the instances — every page must name
//    ITSELF among its alternates, which is what makes an hreflang cluster a
//    cluster, and is untrue the moment the emission stops.
//
//    x-default is deliberately excluded from that count. It always points at
//    the English URL, so on an English page it equals the canonical and would
//    satisfy the check on its own while every locale alternate was missing.
for (const page of pages) {
  const html = read(page);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const selfReferencing = [];

  for (const tag of html.match(/<link rel="alternate"[^>]*>/g) ?? []) {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    const lang = tag.match(/hreflang="([^"]+)"/i)?.[1];
    if (!href) continue;

    let path = href;
    if (siteOrigin && path.startsWith(siteOrigin)) path = path.slice(siteOrigin.length);
    if (path.startsWith('/')) {
      const target = join(DIST, path.split(/[?#]/)[0], 'index.html');
      if (!existsSync(target)) {
        fail(`${relative(DIST, page)}: hreflang alternate points at a page that was not built: ${path}`);
      }
    }

    if (lang && lang.toLowerCase() !== 'x-default' && href === canonical) selfReferencing.push(lang);
  }

  if (canonical && selfReferencing.length === 0) {
    fail(
      `${relative(DIST, page)}: no hreflang alternate points at this page's own canonical ` +
        `(${canonical}). A page must name itself in its own hreflang cluster; none doing so ` +
        `means the alternates are missing or point somewhere else entirely.`,
    );
  }
}

// 4. No page may reference a host other than the one it declares as canonical.
if (siteOrigin) {
  const stale = /https?:\/\/shengchangmd\.bahtzang\.com/;
  for (const page of pages) {
    if (stale.test(read(page))) fail(`${relative(DIST, page)}: references the retired bahtzang.com host`);
  }
}

if (failures.length) {
  console.error('[verify-build] FAILED');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(
  `[verify-build] OK — ${pages.length} pages, ${referenced.size} referenced assets all present, sitemap consistent with robots meta.`,
);
