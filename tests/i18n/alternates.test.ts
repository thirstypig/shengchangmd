import { describe, it, expect } from 'vitest';
import {
  pageSlug,
  pageExistsIn,
  hreflangAlternates,
  xDefaultHref,
  ogLocaleAlternates,
} from '@i18n/alternates';

/*
  The hreflang cluster used to be computed inline in BaseLayout.astro, where no
  test could reach it. These cases are the shapes todo 004 and todo 005 found
  latent: a nested route, a canonical without a trailing slash, and an
  x-default built by a second mechanism with no existence check.
*/

const ORIGIN = 'https://shengchangmd.com';
const files = (...paths: string[]) => new Set(paths.map((p) => `/src/pages/${p}`));

const TRILINGUAL_FLAT = files('about.astro', 'zh-hant/about.astro', 'zh-hans/about.astro');
const HOME = files('index.astro', 'zh-hant/index.astro', 'zh-hans/index.astro');
const NESTED = files(
  'guides/index.astro',
  'zh-hant/guides/index.astro',
  'zh-hans/guides/index.astro',
);

describe('pageSlug', () => {
  it.each([
    ['/', 'index'],
    ['/about/', 'about'],
    ['/zh-hant/about/', 'about'],
    ['/zh-hans/', 'index'],
    ['/guides/visa/', 'guides/visa'],
    ['/zh-hant/guides/visa/', 'guides/visa'],
    // Todo 005, case 2: no trailing slash used to leave the locale prefix in
    // the slug, which matched no file and emitted no alternates at all.
    ['/zh-hant', 'index'],
    ['/zh-hant/about', 'about'],
  ])('%s -> %s', (path, slug) => {
    expect(pageSlug(`${ORIGIN}${path}`)).toBe(slug);
  });
});

describe('pageExistsIn', () => {
  it('finds a flat page in each locale', () => {
    for (const code of ['en', 'zh-hant', 'zh-hans']) {
      expect(pageExistsIn(code, 'about', TRILINGUAL_FLAT)).toBe(true);
    }
  });

  it('finds a nested index page (todo 005, case 1)', () => {
    for (const code of ['en', 'zh-hant', 'zh-hans']) {
      expect(pageExistsIn(code, 'guides', NESTED), code).toBe(true);
    }
  });

  it('does not invent a locale that has no file', () => {
    const englishOnly = files('new-patients.astro');
    expect(pageExistsIn('en', 'new-patients', englishOnly)).toBe(true);
    expect(pageExistsIn('zh-hant', 'new-patients', englishOnly)).toBe(false);
  });
});

describe('hreflangAlternates', () => {
  it('lists every locale the page exists in, with correct URLs', () => {
    expect(hreflangAlternates(`${ORIGIN}/zh-hant/about/`, TRILINGUAL_FLAT)).toEqual([
      { lang: 'en-US', href: `${ORIGIN}/about/` },
      { lang: 'zh-Hant', href: `${ORIGIN}/zh-hant/about/` },
      { lang: 'zh-Hans', href: `${ORIGIN}/zh-hans/about/` },
    ]);
  });

  it('handles the home page', () => {
    expect(hreflangAlternates(`${ORIGIN}/zh-hans/`, HOME).map((a) => a.href)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/zh-hant/`,
      `${ORIGIN}/zh-hans/`,
    ]);
  });

  it('emits alternates for a nested page instead of nothing', () => {
    expect(hreflangAlternates(`${ORIGIN}/zh-hant/guides/`, NESTED).map((a) => a.href)).toEqual([
      `${ORIGIN}/guides/`,
      `${ORIGIN}/zh-hant/guides/`,
      `${ORIGIN}/zh-hans/guides/`,
    ]);
  });
});

describe('xDefaultHref', () => {
  it('points at the English URL when the English page exists', () => {
    expect(xDefaultHref(`${ORIGIN}/zh-hant/about/`, TRILINGUAL_FLAT)).toBe(`${ORIGIN}/about/`);
    expect(xDefaultHref(`${ORIGIN}/`, HOME)).toBe(`${ORIGIN}/`);
  });

  it('is omitted when no English page exists (todo 004)', () => {
    const chineseOnly = files('zh-hant/notice.astro');
    expect(xDefaultHref(`${ORIGIN}/zh-hant/notice/`, chineseOnly)).toBeNull();
  });
});

describe('ogLocaleAlternates', () => {
  it('lists the other locales the page exists in, never itself', () => {
    expect(ogLocaleAlternates('zh-hant', `${ORIGIN}/zh-hant/about/`, TRILINGUAL_FLAT)).toEqual([
      'en_US',
      'zh_CN',
    ]);
  });

  it('lists nothing for a page that exists in one locale only', () => {
    expect(ogLocaleAlternates('en', `${ORIGIN}/new-patients/`, files('new-patients.astro'))).toEqual(
      [],
    );
  });
});
