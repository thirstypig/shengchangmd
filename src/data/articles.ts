/**
 * The article registry: each article's facts, stored once. Pages, the
 * /articles/ index and the structured data all read from here. Titles and
 * summaries live in locales.ts, referenced by literal key so the key-usage
 * guard in source-integrity.test.ts can see them.
 *
 * `lastReviewed` is the date of Dr. Chang's medical review, as relayed by the
 * owner. It stays null until then, and a null value renders a data-unreviewed
 * notice that scripts/verify-build.mjs refuses to deploy. Never set it without
 * the owner confirming the review.
 */
export interface ArticleSource {
  title: string;
  url: string;
}

export interface Article {
  slug: string;
  titleKey: string;
  summaryKey: string;
  reviewedBy: 'doctor';
  lastReviewed: string | null;
  sourcesChecked: string;
  sources: ArticleSource[];
  relatedPage: string;
}

export const articles: Article[] = [
  {
    slug: 'what-to-bring-i-693',
    titleKey: 'articles.whatToBringTitle',
    summaryKey: 'articles.whatToBringSummary',
    reviewedBy: 'doctor',
    lastReviewed: null,
    sourcesChecked: '2026-09-22',
    sources: [
      { title: 'USCIS: Form I-693', url: 'https://www.uscis.gov/i-693' },
      {
        title: 'CDC: Technical Instructions for Civil Surgeons',
        url: 'https://www.cdc.gov/immigrant-refugee-health/hcp/civil-surgeons/index.html',
      },
    ],
    relatedPage: '/immigration-medical-exam/',
  },
];

export function articleBySlug(slug: string): Article {
  const a = articles.find((x) => x.slug === slug);
  if (!a) throw new Error(`No article registered with slug "${slug}"`);
  return a;
}

export function formatDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (locale === 'en') {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  }
  return `${y} 年 ${m} 月 ${d} 日`;
}

export function articlePath(slug: string, locale: string): string {
  return `${locale === 'en' ? '' : '/' + locale}/articles/${slug}/`;
}

function inLanguage(locale: string): string {
  return locale === 'en' ? 'en-US' : locale === 'zh-hant' ? 'zh-Hant' : 'zh-Hans';
}

export function articleSchema(
  article: Article,
  locale: string,
  pageUrl: string,
): Record<string, unknown> {
  const origin = new URL(pageUrl).origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${pageUrl}#article`,
    url: pageUrl,
    inLanguage: inLanguage(locale),
    reviewedBy: { '@id': `${origin}/#doctor` },
    ...(article.lastReviewed ? { lastReviewed: article.lastReviewed } : {}),
    about: { '@id': `${origin}${article.relatedPage}#service` },
    citation: article.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })),
  };
}

export function articlesIndexSchema(locale: string, pageUrl: string): Record<string, unknown> {
  const origin = new URL(pageUrl).origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#collection`,
    url: pageUrl,
    inLanguage: inLanguage(locale),
    hasPart: articles.map((a) => ({ '@id': `${origin}${articlePath(a.slug, locale)}#article` })),
  };
}
