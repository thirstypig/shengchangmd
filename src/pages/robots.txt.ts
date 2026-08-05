import type { APIRoute } from 'astro';

/**
 * robots.txt, generated rather than static.
 *
 * This replaces `public/robots.txt`, which had three problems:
 *
 *  - It hardcoded the sitemap host. Every other URL on this site is derived
 *    from `Astro.site` precisely so the domain lives in one place; a static
 *    file cannot follow a domain migration, and this one silently pointed at
 *    the wrong host for the entire time the site lived on the old subdomain.
 *  - It said `Allow: /` unconditionally, even while every page was rendering
 *    `noindex`. Harmless, because the meta tag wins, but it meant robots.txt
 *    and the pages contradicted each other.
 *  - It disallowed `/private/` and `/admin/`, neither of which exists here.
 *
 * The ALLOW_INDEXING gate is the same one BaseLayout reads for the robots meta
 * tag, so the two can no longer disagree.
 *
 * Note on the two together: `Disallow: /` asks crawlers not to fetch, while
 * `noindex` asks them not to list. Belt and braces while the site is gated, but
 * once indexing is on, the pages must be fetchable for the meta tag to be read
 * at all — which is why this flips wholesale rather than blocking a subset.
 */
export const GET: APIRoute = ({ site }) => {
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';
  const base = site ?? new URL('https://shengchangmd.com');
  const sitemap = new URL('/sitemap-index.xml', base).href;

  const body = allowIndexing
    ? `# Indexing is enabled for this build.
User-agent: *
Allow: /

Sitemap: ${sitemap}
`
    : `# Indexing is disabled for this build (ALLOW_INDEXING is not "true").
# Every page also carries <meta name="robots" content="noindex, nofollow">.
User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
