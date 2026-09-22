/**
 * The hreflang cluster for a page: which locales it exists in, and their URLs.
 *
 * This used to live inline in BaseLayout.astro, where no test could reach it,
 * and it assumed two things nothing asserted (todo 005): every route was a flat
 * `src/pages/{slug}.astro` file, and every canonical ended in a slash. A nested
 * page or a slashless canonical silently emitted no alternates at all. The
 * x-default link was also built by a second mechanism — a string replacement on
 * the canonical, with no existence check (todo 004) — so the one fact "what is
 * this page's English URL" had two derivations that could drift.
 *
 * `pageFiles` is the set of page files as `import.meta.glob('/src/pages/**\/*.astro')`
 * keys it, e.g. '/src/pages/zh-hant/about.astro'.
 *
 * Limitation, deliberately not solved here: a dynamic route such as
 * `src/pages/articles/[slug].astro` has no file named after each page, so the
 * filesystem cannot say which locales a given article exists in. Such a page
 * will need to declare its locales explicitly. Until it does, verify-build's
 * self-referential-alternate check fails the build rather than letting it ship
 * without alternates.
 */
import { locales } from './locales';

const LOCALE_PREFIX = /^\/(zh-hant|zh-hans)(?=\/|$)/;

/** The path with any locale prefix removed: '/zh-hant/about/' -> 'about', '/' -> 'index'. */
export function pageSlug(canonicalUrl: string): string {
  const path = new URL(canonicalUrl).pathname;
  return path.replace(LOCALE_PREFIX, '').replace(/^\/+|\/+$/g, '') || 'index';
}

export function pageExistsIn(code: string, slug: string, pageFiles: Set<string>): boolean {
  const base = code === 'en' ? '/src/pages/' : `/src/pages/${code}/`;
  return pageFiles.has(`${base}${slug}.astro`) || pageFiles.has(`${base}${slug}/index.astro`);
}

function localeUrl(origin: string, code: string, slug: string): string {
  return `${origin}/${code === 'en' ? '' : code + '/'}${slug === 'index' ? '' : slug + '/'}`;
}

export interface Alternate {
  lang: string;
  href: string;
}

export function hreflangAlternates(canonicalUrl: string, pageFiles: Set<string>): Alternate[] {
  const origin = new URL(canonicalUrl).origin;
  const slug = pageSlug(canonicalUrl);
  return Object.entries(locales)
    .filter(([code]) => pageExistsIn(code, slug, pageFiles))
    .map(([code, metadata]) => ({ lang: metadata.code, href: localeUrl(origin, code, slug) }));
}

/** The English URL, or null when this page has no English version to point at. */
export function xDefaultHref(canonicalUrl: string, pageFiles: Set<string>): string | null {
  const slug = pageSlug(canonicalUrl);
  if (!pageExistsIn('en', slug, pageFiles)) return null;
  return localeUrl(new URL(canonicalUrl).origin, 'en', slug);
}

/** og:locale:alternate values: the other locales this page exists in. */
export function ogLocaleAlternates(
  locale: string,
  canonicalUrl: string,
  pageFiles: Set<string>,
): string[] {
  const slug = pageSlug(canonicalUrl);
  return Object.entries(locales)
    .filter(([code]) => code !== locale && pageExistsIn(code, slug, pageFiles))
    .map(([, metadata]) => metadata.ogLocale);
}
