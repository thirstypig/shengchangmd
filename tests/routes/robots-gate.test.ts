import { describe, it, expect, afterEach } from 'vitest';
import { GET } from '../../src/pages/robots.txt';

/**
 * The indexing gate, exercised in both states.
 *
 * ALLOW_INDEXING drives two things that must agree: the robots meta tag in
 * BaseLayout, and this robots.txt route. The static public/robots.txt this
 * replaced said `Allow: /` unconditionally while every page rendered
 * `noindex` — the file and the pages contradicted each other.
 *
 * scripts/verify-build.mjs cannot cover this: it inspects one build, so it only
 * ever sees whichever state that build was made in. Calling the route directly
 * is the only way to assert both.
 */

const SITE = new URL('https://example.test');
const call = (allow: boolean | undefined) => {
  if (allow === undefined) delete process.env.ALLOW_INDEXING;
  else process.env.ALLOW_INDEXING = String(allow);
  // The route only reads `site`; the rest of the Astro context is unused.
  return (GET as (ctx: { site: URL }) => Response)({ site: SITE });
};

afterEach(() => {
  delete process.env.ALLOW_INDEXING;
});

describe('robots.txt indexing gate', () => {
  it('blocks crawlers when ALLOW_INDEXING is unset', async () => {
    const body = await call(undefined).text();
    expect(body).toMatch(/^\s*User-agent: \*\s*$/m);
    expect(body).toMatch(/^Disallow: \/$/m);
    expect(body).not.toMatch(/^Allow: \/$/m);
  });

  it('blocks crawlers for any value other than the exact string "true"', async () => {
    // Guards a footgun: `ALLOW_INDEXING: "false"` in the workflow would be
    // truthy under a loose check and would silently open the site.
    for (const value of ['false', '1', 'yes', 'TRUE', '']) {
      process.env.ALLOW_INDEXING = value;
      const body = await (GET as (c: { site: URL }) => Response)({ site: SITE }).text();
      expect(body, `ALLOW_INDEXING=${JSON.stringify(value)} must not open the site`).toMatch(
        /^Disallow: \/$/m,
      );
    }
  });

  it('allows crawlers and advertises the sitemap when enabled', async () => {
    const body = await call(true).text();
    expect(body).toMatch(/^Allow: \/$/m);
    expect(body).not.toMatch(/^Disallow: \/$/m);
    expect(body).toContain('Sitemap: https://example.test/sitemap-index.xml');
  });

  it('derives the sitemap host from `site` rather than a hardcoded domain', async () => {
    // The route used to carry `site ?? new URL('https://shengchangmd.com')`,
    // re-introducing the second copy of the domain it exists to remove.
    const body = await call(true).text();
    expect(body).not.toMatch(/shengchangmd\.com/);
  });

  it('throws rather than guessing when `site` is unset', () => {
    process.env.ALLOW_INDEXING = 'true';
    expect(() =>
      (GET as (c: { site?: URL }) => Response)({ site: undefined }),
    ).toThrow(/site/i);
  });

  it('serves text/plain so crawlers do not receive HTML', async () => {
    expect(call(true).headers.get('Content-Type')).toMatch(/^text\/plain/);
  });
});
