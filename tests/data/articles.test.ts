import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  articles,
  articleBySlug,
  formatDate,
  articlePath,
  articleSchema,
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
  const s = articleSchema(a, 'en', 'https://shengchangmd.com/articles/x/') as Record<string, any>;
  it('is a MedicalWebPage reviewed by the doctor, citing its sources', () => {
    expect(s['@type']).toBe('MedicalWebPage');
    expect(s.reviewedBy['@id']).toBe('https://shengchangmd.com/#doctor');
    expect(s.citation.map((c: any) => c.url)).toEqual(a.sources.map((x) => x.url));
  });
  it('omits lastReviewed while the article is unreviewed', () => {
    expect('lastReviewed' in s).toBe(a.lastReviewed !== null);
  });
});
