import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  articles,
  articleBySlug,
  formatDate,
  articlePath,
  articleSchema,
  articlesIndexSchema,
} from '@data/articles';
import { getTranslation } from '@i18n/locales';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
const LOCALES = ['en', 'zh-hant', 'zh-hans'] as const;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe('the article registry', () => {
  it('is not empty', () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it.each(articles.map((a) => [a.slug, a] as const))('%s has sources and valid dates', (_, a) => {
    expect(a.sources.length).toBeGreaterThan(0);
    for (const s of a.sources) {
      expect(s.url, s.title).toMatch(/^https:\/\//);
      expect(s.title.trim()).not.toBe('');
    }
    expect(a.sourcesChecked).toMatch(ISO);
    if (a.lastReviewed !== null) expect(a.lastReviewed).toMatch(ISO);
  });

  it.each(articles.map((a) => [a.slug, a] as const))('%s has a title and summary in every locale', (_, a) => {
    for (const locale of LOCALES) {
      expect(getTranslation(locale, a.titleKey), `${locale} ${a.titleKey}`).not.toBe(a.titleKey);
      expect(getTranslation(locale, a.summaryKey), `${locale} ${a.summaryKey}`).not.toBe(a.summaryKey);
    }
  });

  it('throws on an unknown slug rather than rendering undefined', () => {
    expect(() => articleBySlug('no-such-article')).toThrow();
  });
});

describe('articles.draftLine', () => {
  it('is a real string in every locale and names no reviewer', () => {
    for (const locale of LOCALES) {
      const value = getTranslation(locale, 'articles.draftLine');
      expect(value, locale).not.toBe('articles.draftLine');
      expect(value, locale).not.toContain('Sheng Chang');
      expect(value, locale).not.toContain('張勝雄');
      expect(value, locale).not.toContain('张胜雄');
    }
  });
});

describe('formatDate', () => {
  it('formats per locale', () => {
    expect(formatDate('2026-09-22', 'en')).toBe('September 22, 2026');
    expect(formatDate('2026-09-22', 'zh-hant')).toBe('2026 年 9 月 22 日');
    expect(formatDate('2026-09-22', 'zh-hans')).toBe('2026 年 9 月 22 日');
  });
});

describe('articlePath', () => {
  it('builds locale paths', () => {
    expect(articlePath('what-to-bring-i-693', 'en')).toBe('/articles/what-to-bring-i-693/');
    expect(articlePath('what-to-bring-i-693', 'zh-hans')).toBe(
      '/zh-hans/articles/what-to-bring-i-693/',
    );
  });
});

describe('articleSchema', () => {
  const a = articles[0];
  const url = 'https://shengchangmd.com/articles/x/';
  const s = articleSchema(a, 'en', url) as Record<string, any>;
  it('is a MedicalWebPage citing its sources', () => {
    expect(s['@type']).toBe('MedicalWebPage');
    expect(s.citation.map((c: any) => c.url)).toEqual(a.sources.map((x) => x.url));
  });
  it('carries the localized title as name and headline, and the summary as description', () => {
    for (const locale of LOCALES) {
      const ls = articleSchema(a, locale, url) as Record<string, any>;
      expect(ls.name, locale).toBe(getTranslation(locale, a.titleKey));
      expect(ls.headline, locale).toBe(getTranslation(locale, a.titleKey));
      expect(ls.description, locale).toBe(getTranslation(locale, a.summaryKey));
      expect(ls.name, locale).not.toBe(a.titleKey);
    }
  });
  it('omits reviewedBy and lastReviewed while the article is unreviewed', () => {
    const unreviewed = articleSchema({ ...a, lastReviewed: null }, 'en', url) as Record<string, any>;
    expect('reviewedBy' in unreviewed).toBe(false);
    expect('lastReviewed' in unreviewed).toBe(false);
  });
  it('names the doctor as reviewer, with the date, once reviewed', () => {
    const reviewed = articleSchema({ ...a, lastReviewed: '2026-01-02' }, 'en', url) as Record<string, any>;
    expect(reviewed.reviewedBy['@id']).toBe('https://shengchangmd.com/#doctor');
    expect(reviewed.lastReviewed).toBe('2026-01-02');
  });
});

describe('articlesIndexSchema', () => {
  it('carries the localized index title as name', () => {
    for (const locale of LOCALES) {
      const s = articlesIndexSchema(locale, 'https://shengchangmd.com/articles/') as Record<string, any>;
      expect(s.name, locale).toBe(getTranslation(locale, 'articles.indexTitle'));
      expect(s.name, locale).not.toBe('articles.indexTitle');
    }
  });
});

describe('article pages', () => {
  it.each(articles.map((a) => [a.slug] as const))('%s exists in all three locales', (slug) => {
    for (const dir of ['', 'zh-hant/', 'zh-hans/']) {
      expect(existsSync(`${SRC}/pages/${dir}articles/${slug}.astro`), `${dir}${slug}`).toBe(true);
    }
  });

  // The review gate (verify-build check 7) sees only pages that render
  // ArticleByline, which reads the registry. A page with no registry entry
  // would sit outside it, so every article page must be a registered slug.
  it('has no article page without a registry entry', () => {
    const slugs = new Set(articles.map((a) => a.slug));
    const notArticles = new Set(['index.astro', 'how-we-write.astro']);
    for (const dir of ['', 'zh-hant/', 'zh-hans/']) {
      for (const f of readdirSync(`${SRC}/pages/${dir}articles`)) {
        if (!f.endsWith('.astro') || notArticles.has(f)) continue;
        expect(slugs.has(f.replace(/\.astro$/, '')), `${dir}articles/${f} is not in src/data/articles.ts`).toBe(true);
      }
    }
  });
});
