# Articles Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch `/articles/` in English, 繁體 and 简体, with a "How we write these articles" page and the first article, "What to bring to your I-693 exam". The build refuses to deploy the article until Dr. Chang's review is recorded.

**Architecture:** Articles are ordinary locale-forked `.astro` pages under `src/pages/**/articles/`, which already get correct hreflang and language-guard coverage since PR #69. Each article's facts (review date, sources, related page) live once, in a registry at `src/data/articles.ts`; strings live in `locales.ts`. The I-693 page's "What to bring" list becomes a shared component rendered by both the I-693 page and the article. `verify-build.mjs` fails on any page carrying `data-unreviewed`, and checks that the two "What to bring" lists match.

**Tech Stack:** Astro 5, Tailwind v4 (token-mapped classes only), Vitest 4, Node post-build scripts.

**Spec:** `docs/superpowers/specs/2026-09-22-articles-section-design.md`

## Global Constraints

- **Never invent a fact.** Every regulatory or medical statement in an article is fetched from USCIS or CDC at drafting time, quoted in the task report, and dated.
- **Never publish** the I-693 fee, whether vaccines are given in this office, the number of visits, turnaround, or the lab location (owner decision, 2026-09-21). Where a reader would want these, say to call.
- **An article is live only after Dr. Chang's review.** `lastReviewed` stays `null` until the owner relays his review date. Never set it yourself.
- Byline: "Medically reviewed by", never "by Dr. Chang".
- Every user-facing string exists in `en`, `zh-hant` and `zh-hans` in the same commit.
- Chinese is Taiwan Mandarin in both scripts; 简体 = the same Taiwan wording in simplified characters. Never 医生/信息/联系/普通话/身份/记录/筛查/网络/软件/视频/数据/健保. Full-width punctuation. Form numbers (I-693, I-485) and the tool name "Find a Civil Surgeon" stay as-is.
- No Chinese and no literal user-facing text in a shared component; no literal `aria-label`/`title`/`alt`/`data-label` in a shared component. Strings go through `getTranslation()`.
- Never interpolate `practice.*` English strings into a Chinese page, except the street address and phone/email (locale-neutral, and already rendered that way in the footer).
- Chinese `<title>`, meta description and `og:site_name` contain CJK and never "Sheng Chang" (`verify-build.mjs` enforces this).
- `source-integrity.test.ts` requires every `translations.en` block key to appear literally as `block.key` in some file under `src/`. Write keys out literally; never build them from templates.
- No file outside `practice.ts` may contain the phone number or street address as a literal; interpolate from `practice`.
- American English in all English copy and comments.
- Only Tailwind classes already token-mapped in `src/styles/global.css`, including their `hover:` forms. Links use `text-primary-700 underline underline-offset-2 hover:no-underline` (already mapped and used on the I-693 page).
- Every new test and build check is shown failing before it counts: introduce the mutation, see red, restore.
- Branch → PR. Never commit to `main`. Create the branch as its own step. Never merge without the owner asking in his own message.
- Build locally with `ALLOW_INDEXING=true npm run build`; plain `npm run build` fails locally by design.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/i18n/locales.ts` (modify) | New blocks ×3 locales: `whatToBring` (the list) and `articles` (titles, byline, index, method page, footer label strings); two new `footer` keys |
| `src/components/WhatToBring.astro` (create) | Renders the shared list from `whatToBring.*`, marked `data-what-to-bring` |
| `src/data/articles.ts` (create) | The registry, date formatting, and schema builders |
| `src/components/ArticleByline.astro` (create) | Reviewed line, or the `data-unreviewed` notice |
| `src/components/ArticleSources.astro` (create) | The source list and "sources checked" date |
| `src/pages/{,zh-hant/,zh-hans/}immigration-medical-exam.astro` (modify) | Use `WhatToBring`; add the "Full guide" link (Task 4) |
| `src/pages/{,zh-hant/,zh-hans/}articles/index.astro` (create) | The index |
| `src/pages/{,zh-hant/,zh-hans/}articles/how-we-write.astro` (create) | The method page |
| `src/pages/{,zh-hant/,zh-hans/}articles/what-to-bring-i-693.astro` (create) | The first article |
| `src/layouts/BaseLayout.astro` (modify) | The footer's "Resources" column |
| `scripts/verify-build.mjs` (modify) | Fail on `data-unreviewed`; the two "What to bring" lists must match |
| `tests/data/articles.test.ts` (create) | Registry validity, date formatting, page-file existence, schema shape |

---

### Task 0: Branch

- [ ] **Step 1:**

```bash
git switch main && git pull --ff-only
git switch -c feat/articles-section
git branch --show-current   # must print feat/articles-section
```

---

### Task 1: Shared "What to bring" list

Moves the I-693 page's list into `locales.ts` plus one component. **The rendered text must not change.**

**Files:**
- Modify: `src/i18n/locales.ts` (new `whatToBring` block in each locale, directly after each locale's `immigrationExam` block)
- Create: `src/components/WhatToBring.astro`
- Modify: the `<ul>` inside the "What to bring" section of `src/pages/immigration-medical-exam.astro`, `src/pages/zh-hant/immigration-medical-exam.astro` and `src/pages/zh-hans/immigration-medical-exam.astro`

**Interfaces:**
- Produces: `<WhatToBring locale={locale} />`, rendering `<ul data-what-to-bring class="list-disc pl-6 space-y-2 text-gray-700">…</ul>`

- [ ] **Step 1: Snapshot the current rendered list text**

```bash
ALLOW_INDEXING=true npm run build >/dev/null 2>&1
for p in immigration-medical-exam zh-hant/immigration-medical-exam zh-hans/immigration-medical-exam; do
  node -e "const h=require('fs').readFileSync('dist/$p/index.html','utf8');const i=h.indexOf('<ul',h.search(/What to bring|應攜帶的資料|应携带的资料/));const u=h.slice(i,h.indexOf('</ul>',i));console.log(u.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim())"
done > /tmp/wtb-before.txt
cat /tmp/wtb-before.txt   # three lines, one per locale
```

- [ ] **Step 2: Add the `whatToBring` blocks to `locales.ts`**

The strings are the current page text, split so the uscis.gov link stays markup.

`translations.en`:
```ts
    whatToBring: {
      photoId: "A valid government-issued photo ID, such as your unexpired passport or driver's license",
      vaccinationRecords: 'Your vaccination records',
      otherRecords: 'Any other medical records you have',
      formBeforeLink:
        'Form I-693 with Part 1 filled in. Do not sign it yet: you must sign it in front of Dr. Chang. Download the current edition from ',
      formAfterLink: '; USCIS accepts only the edition in use when the doctor signs.',
    },
```

`translations['zh-hant']`:
```ts
    whatToBring: {
      photoId: '政府核發、附照片的有效身分證件，例如未過期的護照或駕照',
      vaccinationRecords: '您的疫苗接種紀錄',
      otherRecords: '您手邊的其他病歷',
      formBeforeLink:
        '已填好第 1 部分（Part 1）的 Form I-693。請先不要簽名：您必須在張醫師面前簽名。請從 ',
      formAfterLink: ' 下載最新版本；美國移民局只接受醫師簽名時現行的版本。',
    },
```

`translations['zh-hans']`:
```ts
    whatToBring: {
      photoId: '政府核发、附照片的有效身分证件，例如未过期的护照或驾照',
      vaccinationRecords: '您的疫苗接种纪录',
      otherRecords: '您手边的其他病历',
      formBeforeLink:
        '已填好第 1 部分（Part 1）的 Form I-693。请先不要签名：您必须在张医师面前签名。请从 ',
      formAfterLink: ' 下载最新版本；美国移民局只接受医师签名时现行的版本。',
    },
```

The link text `uscis.gov/i-693` is deliberately **not** a locale key: it is a locale-neutral identifier (like a form number or the phone), and a key whose Chinese value equals its English value fails `locale-coverage`. The component renders it literally, with a comment saying why.

- [ ] **Step 3: Create `src/components/WhatToBring.astro`**

```astro
---
/*
  The I-693 "What to bring" list, rendered by both the I-693 page and the
  "What to bring" article, so the two can never disagree. verify-build
  compares the built copies. All copy comes from locales.ts; the one literal,
  "uscis.gov/i-693", is a locale-neutral identifier like a form number, and a
  locale key for it would be identical in every locale, which locale-coverage
  rejects.
*/
import { getTranslation } from '@i18n/locales';

interface Props {
  locale: string;
}
const { locale } = Astro.props;
const t = (k: string) => getTranslation(locale, k);
---

<ul data-what-to-bring class="list-disc pl-6 space-y-2 text-gray-700">
  <li>{t('whatToBring.photoId')}</li>
  <li>{t('whatToBring.vaccinationRecords')}</li>
  <li>{t('whatToBring.otherRecords')}</li>
  <li>
    {t('whatToBring.formBeforeLink')}<a
      href="https://www.uscis.gov/i-693"
      rel="noopener"
      class="text-primary-700 underline underline-offset-2 hover:no-underline">uscis.gov/i-693</a
    >{t('whatToBring.formAfterLink')}
  </li>
</ul>
```

- [ ] **Step 4: Replace the `<ul>…</ul>` in each I-693 page** with `<WhatToBring locale={locale} />` and add `import WhatToBring from '@components/WhatToBring.astro';` to each page's frontmatter. Leave the `<h2>` and the "Source:" paragraph as they are.

- [ ] **Step 5: Rebuild and compare the text**

```bash
ALLOW_INDEXING=true npm run build 2>&1 | grep -E "verify-(css|build)\]"
for p in immigration-medical-exam zh-hant/immigration-medical-exam zh-hans/immigration-medical-exam; do
  node -e "const h=require('fs').readFileSync('dist/$p/index.html','utf8');const i=h.indexOf('<ul',h.search(/What to bring|應攜帶的資料|应携带的资料/));const u=h.slice(i,h.indexOf('</ul>',i));console.log(u.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim())"
done > /tmp/wtb-after.txt
diff /tmp/wtb-before.txt /tmp/wtb-after.txt && echo IDENTICAL
```
Expected: `verify-build OK` and `IDENTICAL`. If whitespace around the link differs (e.g. `from uscis.gov` vs `fromuscis.gov`), fix the component's whitespace until the diff is empty.

- [ ] **Step 6: Tests and commit**

Run: `npx tsc --noEmit && npm test`. Expected: PASS.

```bash
git add src/i18n/locales.ts src/components/WhatToBring.astro src/pages/immigration-medical-exam.astro src/pages/zh-hant/immigration-medical-exam.astro src/pages/zh-hans/immigration-medical-exam.astro
git commit -m "Move the I-693 'What to bring' list into one shared component"
```

---

### Task 2: Registry, byline, sources, and the review gate

**Files:**
- Create: `src/data/articles.ts`
- Create: `src/components/ArticleByline.astro`
- Create: `src/components/ArticleSources.astro`
- Modify: `src/i18n/locales.ts` (new `articles` block ×3, directly after each `whatToBring` block)
- Modify: `scripts/verify-build.mjs` (new check before the final `if (failures.length)` block)
- Test: `tests/data/articles.test.ts`

**Interfaces:**
- Produces:
  - `interface ArticleSource { title: string; url: string }`
  - `interface Article { slug: string; titleKey: string; summaryKey: string; reviewedBy: 'doctor'; lastReviewed: string | null; sourcesChecked: string; sources: ArticleSource[]; relatedPage: string }`
  - `const articles: Article[]`
  - `articleBySlug(slug: string): Article` (throws on an unknown slug)
  - `formatDate(iso: string, locale: string): string`
  - `articlePath(slug: string, locale: string): string` (e.g. `'/zh-hant/articles/what-to-bring-i-693/'`)
  - `articleSchema(article: Article, locale: string, pageUrl: string): Record<string, unknown>`
  - `articlesIndexSchema(locale: string, pageUrl: string): Record<string, unknown>`
  - `<ArticleByline article={article} locale={locale} />` (renders `data-unreviewed` when `lastReviewed` is null)
  - `<ArticleSources article={article} locale={locale} />`

- [ ] **Step 1: Write the failing test** at `tests/data/articles.test.ts`

```ts
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
```

(The page-file existence test is added in Task 4, when the pages exist.)

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/data/articles.test.ts`
Expected: FAIL, because `@data/articles` cannot be resolved.

- [ ] **Step 3: Add the `articles` blocks to `locales.ts`**

`translations.en`:
```ts
    articles: {
      whatToBringTitle: 'What to bring to your I-693 exam',
      whatToBringSummary:
        'The documents to bring to your immigration medical exam, and how to prepare Form I-693 before you arrive.',
      reviewedLine:
        'Drafted with AI assistance from the official sources listed below. Medically reviewed by {doctor}, on {date}.',
      awaitingReview: 'Awaiting medical review by {doctor}. This article is not yet published.',
      howWeWriteLink: 'How we write these articles',
      sourcesHeading: 'Sources',
      sourcesChecked: 'Sources checked {date}.',
    },
```

`translations['zh-hant']`:
```ts
    articles: {
      whatToBringTitle: 'I-693 移民體檢應攜帶的資料',
      whatToBringSummary: '移民體檢當天應攜帶的文件，以及到診前如何準備 Form I-693。',
      reviewedLine: '本文由 AI 協助、依據下列官方資料撰寫，並經{doctor}於 {date} 醫學審閱。',
      awaitingReview: '本文尚待{doctor}醫學審閱，尚未正式發布。',
      howWeWriteLink: '我們如何撰寫這些文章',
      sourcesHeading: '資料來源',
      sourcesChecked: '資料查核日期：{date}。',
    },
```

`translations['zh-hans']`:
```ts
    articles: {
      whatToBringTitle: 'I-693 移民体检应携带的资料',
      whatToBringSummary: '移民体检当天应携带的文件，以及到诊前如何准备 Form I-693。',
      reviewedLine: '本文由 AI 协助、依据下列官方资料撰写，并经{doctor}于 {date} 医学审阅。',
      awaitingReview: '本文尚待{doctor}医学审阅，尚未正式发布。',
      howWeWriteLink: '我们如何撰写这些文章',
      sourcesHeading: '资料来源',
      sourcesChecked: '资料查核日期：{date}。',
    },
```

- [ ] **Step 4: Create `src/data/articles.ts`**

The registry entry's `sources` hold the two sources the I-693 page already cites. Task 4 replaces them with exactly what the article cites, after fetching.

```ts
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
```

- [ ] **Step 5: Create `src/components/ArticleByline.astro`**

```astro
---
/*
  The review line on every article. While `lastReviewed` is null it renders an
  "awaiting review" notice carrying data-unreviewed, and scripts/verify-build.mjs
  fails any build containing that attribute, so an unreviewed article cannot
  deploy. The date always comes from the registry, never typed by hand.
*/
import { getTranslation } from '@i18n/locales';
import { formatDate, type Article } from '@data/articles';

interface Props {
  article: Article;
  locale: string;
}
const { article, locale } = Astro.props;
const t = (k: string) => getTranslation(locale, k);
const doctor = t('header.wordmark');
const methodHref = `${locale === 'en' ? '' : '/' + locale}/articles/how-we-write/`;
---

{
  article.lastReviewed ? (
    <p class="text-sm text-gray-700">
      {t('articles.reviewedLine')
        .replace('{doctor}', doctor)
        .replace('{date}', formatDate(article.lastReviewed, locale))}{' '}
      <a href={methodHref} class="text-primary-700 underline underline-offset-2 hover:no-underline">
        {t('articles.howWeWriteLink')}
      </a>
    </p>
  ) : (
    <p data-unreviewed class="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {t('articles.awaitingReview').replace('{doctor}', doctor)}
    </p>
  )
}
```

- [ ] **Step 6: Create `src/components/ArticleSources.astro`**

```astro
---
/* The article's sources, from the registry. No literal text. */
import { getTranslation } from '@i18n/locales';
import { formatDate, type Article } from '@data/articles';

interface Props {
  article: Article;
  locale: string;
}
const { article, locale } = Astro.props;
const t = (k: string) => getTranslation(locale, k);
---

<div>
  <h2 class="font-serif text-2xl font-bold mb-4 text-gray-900">{t('articles.sourcesHeading')}</h2>
  <ul class="list-disc pl-6 space-y-2 text-gray-700">
    {
      article.sources.map((s) => (
        <li>
          <a href={s.url} rel="noopener" class="text-primary-700 underline underline-offset-2 hover:no-underline">
            {s.title}
          </a>
        </li>
      ))
    }
  </ul>
  <p class="mt-4 text-sm text-gray-700">
    {t('articles.sourcesChecked').replace('{date}', formatDate(article.sourcesChecked, locale))}
  </p>
</div>
```

Check that `font-semibold`, `text-sm` and `rounded-lg` are layout/typography utilities (not colors), and that `bg-gray-50`, `border-gray-200`, `text-gray-900` and `text-gray-700` are on the token map in `global.css`. `theme-token-coverage` fails otherwise.

- [ ] **Step 7: Add the review-gate check to `scripts/verify-build.mjs`**

Directly before `if (failures.length) {`, using the next unused check number:

```js
// 7. An article must not deploy before Dr. Chang's medical review. While an
//    article's registry entry has lastReviewed: null, ArticleByline renders a
//    notice carrying data-unreviewed; no built page may contain it.
for (const page of pages) {
  if (/\sdata-unreviewed[\s>=]/.test(read(page))) {
    fail(`${relative(DIST, page)}: article is awaiting medical review (lastReviewed is null in src/data/articles.ts)`);
  }
}
```

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npx vitest run tests/data/articles.test.ts && npx tsc --noEmit && npm test`
Expected: PASS. Every key added in this task is read by a file created in this task (the registry reads the title/summary keys; the two components read the rest), so `source-integrity`'s key-usage test passes. Keys read only by later pages are added in those tasks, for that reason.

- [ ] **Step 9: Prove the gate can fail**

No page renders `ArticleByline` yet, so prove the check against a temporary page: create `src/pages/zz-gate-probe.astro` containing
```astro
---
import ArticleByline from '@components/ArticleByline.astro';
import { articles } from '@data/articles';
---
<ArticleByline article={articles[0]} locale="en" />
```
Run `ALLOW_INDEXING=true npm run build`. Expected: FAIL with `zz-gate-probe/index.html: article is awaiting medical review`. Delete the probe file, rebuild, and confirm green. Record both outputs in the report.

- [ ] **Step 10: Commit**

```bash
git add src/data/articles.ts src/components/ArticleByline.astro src/components/ArticleSources.astro src/i18n/locales.ts scripts/verify-build.mjs tests/data/articles.test.ts
git commit -m "Article registry, byline and sources; the build refuses unreviewed articles"
```

---

### Task 3: The index, the method page, and the footer link

**Files:**
- Create: `src/pages/articles/index.astro`, `src/pages/zh-hant/articles/index.astro`, `src/pages/zh-hans/articles/index.astro`
- Create: `src/pages/articles/how-we-write.astro`, `src/pages/zh-hant/articles/how-we-write.astro`, `src/pages/zh-hans/articles/how-we-write.astro`
- Modify: `src/i18n/locales.ts` (method-page strings in the `articles` block; `footer.resources` and `footer.articles`)
- Modify: `src/layouts/BaseLayout.astro` (a new footer column between Legal and Connect)

**Interfaces:**
- Consumes: `articles`, `articlePath`, `formatDate`, `articlesIndexSchema` (Task 2); `BaseLayout` props `{ title, description, locale, canonicalUrl, breadcrumbs, pageSchema }`
- Produces: `/articles/` and `/articles/how-we-write/` in all three locales

- [ ] **Step 1: Add the strings**

In the `footer` block of each locale: en `resources: 'Resources'`, `articles: 'Articles'`; zh-hant `resources: '資源'`, `articles: '文章專區'`; zh-hans `resources: '资源'`, `articles: '文章专区'`.

In each `articles` block, add the index keys (en, zh-hant, zh-hans):

```ts
      indexTitle: 'Articles',
      indexIntro:
        'Plain-language guides to immigration medical exams and the paperwork around them, written from official sources and reviewed by Dr. Chang.',
      reviewedOn: 'Reviewed {date}',
      notYetReviewed: 'Awaiting review',
```
```ts
      indexTitle: '文章專區',
      indexIntro: '以淺顯文字說明移民體檢與相關文件，依據官方資料撰寫，並經張醫師審閱。',
      reviewedOn: '審閱日期：{date}',
      notYetReviewed: '尚待審閱',
```
```ts
      indexTitle: '文章专区',
      indexIntro: '以浅显文字说明移民体检与相关文件，依据官方资料撰写，并经张医师审阅。',
      reviewedOn: '审阅日期：{date}',
      notYetReviewed: '尚待审阅',
```

and the method page (en, zh-hant, zh-hans in that order):

```ts
      methodTitle: 'How we write these articles',
      methodSources:
        'Every article explains a process (an exam, a form, a kind of coverage) using official sources only: U.S. Citizenship and Immigration Services (USCIS), the Centers for Disease Control and Prevention (CDC), the Centers for Medicare & Medicaid Services (CMS), and the California Department of Health Care Services (DHCS). Each article lists its sources and the date we last checked them.',
      methodAi: 'Drafts are written with the help of AI, working from those sources.',
      methodReview:
        'Every article is reviewed twice before it is published. The practice checks that it matches how our office works, and Dr. Chang checks it for medical and regulatory accuracy. The review date on an article is the date of his review.',
      methodNotPublished:
        'We do not publish prices or office scheduling details here, because they change. Please call the office at {phone} and we will answer directly.',
      methodNotAdvice: 'These articles are general information, not medical advice for your situation.',
      methodErrors: 'If you find an error, please call {phone} or email {email}.',
```
```ts
      methodTitle: '我們如何撰寫這些文章',
      methodSources:
        '每篇文章都只依據官方資料說明一項流程（例如一項體檢、一份表格或一種保險）：美國公民及移民服務局（USCIS）、美國疾病管制與預防中心（CDC）、美國聯邦醫療保險與醫療補助服務中心（CMS），以及加州醫療服務部（DHCS）。每篇文章都列出資料來源，以及我們最近一次查核的日期。',
      methodAi: '文章初稿由 AI 協助、依據上述資料撰寫。',
      methodReview:
        '每篇文章發布前都經過兩次審閱：診所確認內容符合本診所的實際作業，張醫師則審閱醫學與法規上的正確性。文章上的審閱日期，即為張醫師審閱的日期。',
      methodNotPublished: '費用與門診排程等資訊時常變動，因此不在此公布。請來電 {phone}，我們會直接為您說明。',
      methodNotAdvice: '這些文章為一般資訊，並非針對您個人情況的醫療建議。',
      methodErrors: '如發現錯誤，請來電 {phone} 或寄電子郵件至 {email}。',
```
```ts
      methodTitle: '我们如何撰写这些文章',
      methodSources:
        '每篇文章都只依据官方资料说明一项流程（例如一项体检、一份表格或一种保险）：美国公民及移民服务局（USCIS）、美国疾病管制与预防中心（CDC）、美国联邦医疗保险与医疗补助服务中心（CMS），以及加州医疗服务部（DHCS）。每篇文章都列出资料来源，以及我们最近一次查核的日期。',
      methodAi: '文章初稿由 AI 协助、依据上述资料撰写。',
      methodReview:
        '每篇文章发布前都经过两次审阅：诊所确认内容符合本诊所的实际作业，张医师则审阅医学与法规上的正确性。文章上的审阅日期，即为张医师审阅的日期。',
      methodNotPublished: '费用与门诊排程等资讯时常变动，因此不在此公布。请来电 {phone}，我们会直接为您说明。',
      methodNotAdvice: '这些文章为一般资讯，并非针对您个人情况的医疗建议。',
      methodErrors: '如发现错误，请来电 {phone} 或寄电子邮件至 {email}。',
```

- [ ] **Step 2: Add the footer column** in `BaseLayout.astro`, between the Legal column's closing `</div>` and `<div class="footer-column footer-connect">`:

```astro
        <div class="footer-column">
          <h3>{t('footer.resources')}</h3>
          <ul>
            <li>
              <a href={`${locale === 'en' ? '' : '/' + locale}/articles/`}>{t('footer.articles')}</a>
            </li>
          </ul>
        </div>
```

- [ ] **Step 3: Create the method page**, `src/pages/articles/how-we-write.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { practice } from '@data/practice';
import { getTranslation } from '@i18n/locales';

const locale = 'en';
const t = (k: string) => getTranslation(locale, k);
const canonicalUrl = new URL('/articles/how-we-write/', Astro.site).href;
const title = `${t('articles.methodTitle')} | ${practice.doctorNameShort}`;
const description = t('articles.methodAi');
const breadcrumbs = [
  { label: t('home'), href: '/' },
  { label: t('articles.indexTitle'), href: '/articles/' },
  { label: t('articles.methodTitle'), href: '/articles/how-we-write/' },
];
const fill = (s: string) => s.replace('{phone}', practice.phone).replace('{email}', practice.email);
---

<BaseLayout title={title} description={description} locale={locale} canonicalUrl={canonicalUrl} breadcrumbs={breadcrumbs}>
  <section class="py-12 md:py-16">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="max-w-3xl mx-auto space-y-6 text-gray-700">
        <h1 class="font-serif text-3xl md:text-4xl font-bold text-gray-900">{t('articles.methodTitle')}</h1>
        <p>{t('articles.methodSources')}</p>
        <p>{t('articles.methodAi')}</p>
        <p>{t('articles.methodReview')}</p>
        <p>{fill(t('articles.methodNotPublished'))}</p>
        <p>{t('articles.methodNotAdvice')}</p>
        <p>{fill(t('articles.methodErrors'))}</p>
      </div>
    </div>
  </section>
</BaseLayout>
```

The zh-hant and zh-hans files are identical except for `locale`, the canonical path (`/zh-hant/articles/how-we-write/`), the breadcrumb hrefs (`/zh-hant/`, `/zh-hant/articles/`, …), and the title, which must not contain the English name:
`const title = \`${t('articles.methodTitle')}｜${t('header.wordmark')}\`;` (same line for zh-hans). **Do not interpolate `practice.doctorNameShort` on a Chinese page.**

- [ ] **Step 4: Create the index**, `src/pages/articles/index.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { practice } from '@data/practice';
import { getTranslation } from '@i18n/locales';
import { articles, articlePath, formatDate, articlesIndexSchema } from '@data/articles';

const locale = 'en';
const t = (k: string) => getTranslation(locale, k);
const canonicalUrl = new URL('/articles/', Astro.site).href;
const title = `${t('articles.indexTitle')} | ${practice.doctorNameShort}`;
const description = t('articles.indexIntro');
const breadcrumbs = [
  { label: t('home'), href: '/' },
  { label: t('articles.indexTitle'), href: '/articles/' },
];
---

<BaseLayout
  title={title}
  description={description}
  locale={locale}
  canonicalUrl={canonicalUrl}
  breadcrumbs={breadcrumbs}
  pageSchema={articlesIndexSchema(locale, canonicalUrl)}
>
  <section class="py-12 md:py-16">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('articles.indexTitle')}</h1>
          <p class="text-gray-700">{t('articles.indexIntro')}</p>
        </div>
        <ul class="space-y-6">
          {
            articles.map((a) => (
              <li>
                <a href={articlePath(a.slug, locale)} class="font-serif text-xl font-bold text-primary-700 underline underline-offset-2 hover:no-underline">
                  {t(a.titleKey)}
                </a>
                <p class="mt-1 text-gray-700">{t(a.summaryKey)}</p>
                <p class="mt-1 text-sm text-gray-700">
                  {a.lastReviewed
                    ? t('articles.reviewedOn').replace('{date}', formatDate(a.lastReviewed, locale))
                    : t('articles.notYetReviewed')}
                </p>
              </li>
            ))
          }
        </ul>
        <p>
          <a href="/articles/how-we-write/" class="text-primary-700 underline underline-offset-2 hover:no-underline">
            {t('articles.howWeWriteLink')}
          </a>
        </p>
      </div>
    </div>
  </section>
</BaseLayout>
```

The zh files differ only in `locale`, the canonical and breadcrumb paths, the method-page href (`/zh-hant/articles/how-we-write/`), and the title line `const title = \`${t('articles.indexTitle')}｜${t('header.wordmark')}\`;`.

Note: the index lists the article while it is unreviewed. Until Task 4 creates the article page, its link points at a page that does not exist; that is expected mid-branch and is resolved in Task 4.

- [ ] **Step 5: Test and build**

Run: `npx tsc --noEmit && npm test && ALLOW_INDEXING=true npm run build`
Expected: tests PASS. The build passes `verify-build`: the new English pages are in the sitemap, the Chinese ones are `noindex`, Chinese titles have no English name, and every page names itself in its hreflang cluster. If `verify-build` flags the index's link to the not-yet-built article as a missing asset, record it and continue; Task 4 resolves it.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales.ts src/layouts/BaseLayout.astro src/pages/articles src/pages/zh-hant/articles src/pages/zh-hans/articles
git commit -m "Articles index and 'How we write these articles', in three locales; footer link"
```

---

### Task 4: The first article (sourced), its cross-links, and the parity checks

**Files:**
- Create: `src/pages/articles/what-to-bring-i-693.astro`, `src/pages/zh-hant/articles/what-to-bring-i-693.astro`, `src/pages/zh-hans/articles/what-to-bring-i-693.astro`
- Modify: `src/data/articles.ts` (the registry entry's `sources` and `sourcesChecked`, to match what the article cites)
- Modify: the three I-693 pages (add the "Full guide" link)
- Modify: `scripts/verify-build.mjs` (the list-parity check)
- Modify: `tests/data/articles.test.ts` (the page-file existence test)

**Sources: fetch each at execution time and quote from it; do not write from memory:**
- USCIS Form I-693 page and its instructions PDF: https://www.uscis.gov/i-693
- CDC Technical Instructions for Civil Surgeons, including the Vaccination and Tuberculosis sections: https://www.cdc.gov/immigrant-refugee-health/hcp/civil-surgeons/index.html
- USCIS Policy Manual Vol. 8 Part B (civil surgeons): https://www.uscis.gov/policy-manual/volume-8-part-b

- [ ] **Step 1: Write the failing existence test.** Append to `tests/data/articles.test.ts`:

```ts
describe('article pages', () => {
  it.each(articles.map((a) => [a.slug] as const))('%s exists in all three locales', (slug) => {
    for (const dir of ['', 'zh-hant/', 'zh-hans/']) {
      expect(existsSync(`${SRC}/pages/${dir}articles/${slug}.astro`), `${dir}${slug}`).toBe(true);
    }
  });
});
```
Run: `npx vitest run tests/data/articles.test.ts`. Expected: FAIL (the pages do not exist yet).

- [ ] **Step 2: Fetch the sources and record the facts.** In the task report, record for each fact: the URL, the date checked, and the exact sentence relied on. Establish:
  1. What counts as a vaccination record for the civil surgeon (CDC Vaccination technical instructions), and what the CDC rules say happens when an applicant has no records.
  2. Whether USCIS or CDC states a requirement for translating medical or vaccination records not in English **for the exam**. If no source says so, the article says nothing about translation.
  3. What documentation of a past TB diagnosis or treatment the applicant should bring (CDC Tuberculosis technical instructions).
  4. The Part 1 instructions (fill in, do not sign until told to by the civil surgeon) and the current-edition rule (uscis.gov/i-693).

- [ ] **Step 3: Write the English article**, `src/pages/articles/what-to-bring-i-693.astro`, 600–900 words, with this structure (headings `h2`, body `text-gray-700`, links with the global link classes and `rel="noopener"`):

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import CallButton from '@components/CallButton.astro';
import WhatToBring from '@components/WhatToBring.astro';
import ArticleByline from '@components/ArticleByline.astro';
import ArticleSources from '@components/ArticleSources.astro';
import { practice } from '@data/practice';
import { getTranslation } from '@i18n/locales';
import { articleBySlug, articleSchema } from '@data/articles';

const locale = 'en';
const t = (k: string) => getTranslation(locale, k);
const article = articleBySlug('what-to-bring-i-693');
const canonicalUrl = new URL('/articles/what-to-bring-i-693/', Astro.site).href;
const title = `${t(article.titleKey)} | ${practice.doctorNameShort}`;
const description = t(article.summaryKey);
const breadcrumbs = [
  { label: t('home'), href: '/' },
  { label: t('articles.indexTitle'), href: '/articles/' },
  { label: t(article.titleKey), href: '/articles/what-to-bring-i-693/' },
];
---

<BaseLayout
  title={title}
  description={description}
  locale={locale}
  canonicalUrl={canonicalUrl}
  breadcrumbs={breadcrumbs}
  pageSchema={articleSchema(article, locale, canonicalUrl)}
>
  <article class="py-12 md:py-16">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="max-w-3xl mx-auto space-y-10">
        <header class="space-y-4">
          <h1 class="font-serif text-3xl md:text-4xl font-bold text-gray-900">{t(article.titleKey)}</h1>
          <ArticleByline article={article} locale={locale} />
        </header>
        <!-- Sections 1–7 per the spec, content from Step 2's sources:
             1 who it's for (appointment only; call) · 2 <WhatToBring locale={locale} />
             3 vaccination records (CDC rules; "call to ask how this works here")
             4 records not in English (only if sourced) · 5 past TB documentation
             6 Part 1 and the current edition · 7 after the exam: one line + link to
             /immigration-medical-exam/ -->
        <ArticleSources article={article} locale={locale} />
        <div class="text-center"><CallButton text="Call the office" size="lg" variant="filled" /></div>
      </div>
    </div>
  </article>
</BaseLayout>
```

Replace the HTML comment with the seven sections. Never state the fee, vaccines given in this office, the number of visits, turnaround or the lab location. Section 3 phrases everything as "the CDC's rules say…" and ends with a sentence telling the reader to call the office to ask how it works here.

- [ ] **Step 4: Update the registry entry** so `sources` lists exactly the pages the article links (title + URL) and `sourcesChecked` is the fetch date. Leave `lastReviewed: null`.

- [ ] **Step 5: Translate into zh-hant, then zh-hans.** Read `.claude/skills/trilingual-content/SKILL.md` first. Same structure; the title line is `const title = \`${t(article.titleKey)}｜${t('header.wordmark')}\`;`; breadcrumb and canonical paths use the locale prefix; the call button text is `來電洽詢` / `来电洽询`; the link to the I-693 page is `/zh-hant/immigration-medical-exam/` and `/zh-hans/immigration-medical-exam/`. zh-hans is the character-level twin of zh-hant. Keep 「（英文）」 after links to English-only sources, as the I-693 pages do.

- [ ] **Step 6: Add the "Full guide" link to the three I-693 pages.** First add the key to each `articles` block: en `fullGuideLink: 'Full guide: what to bring to your I-693 exam',`; zh-hant `fullGuideLink: '完整說明：I-693 移民體檢應攜帶的資料',`; zh-hans `fullGuideLink: '完整说明：I-693 移民体检应携带的资料',`. Then add the link directly after the "Source:" paragraph of the "What to bring" section:

```astro
        <p class="mt-4">
          <a href="/articles/what-to-bring-i-693/" class="font-semibold text-primary-700 underline underline-offset-2 hover:no-underline">
            {getTranslation(locale, 'articles.fullGuideLink')}
          </a>
        </p>
```
(with `/zh-hant/articles/what-to-bring-i-693/` and `/zh-hans/…` on the Chinese pages; import `getTranslation` if the page does not already).

- [ ] **Step 7: Add the list-parity check to `scripts/verify-build.mjs`**, directly before `if (failures.length) {`, with the next unused check number:

```js
// 8. The I-693 page and the "What to bring" article render the same list from
//    one component. Compare the built lists, so a hand edit to either copy fails.
const listText = (html) => {
  const m = html.match(/<ul data-what-to-bring[^>]*>([\s\S]*?)<\/ul>/);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
};
for (const prefix of ['', 'zh-hant/', 'zh-hans/']) {
  const examFile = join(DIST, `${prefix}immigration-medical-exam/index.html`);
  const articleFile = join(DIST, `${prefix}articles/what-to-bring-i-693/index.html`);
  if (!existsSync(examFile) || !existsSync(articleFile)) {
    fail(`${prefix || 'en/'}: I-693 page or "What to bring" article not built`);
    continue;
  }
  const a = listText(read(examFile));
  const b = listText(read(articleFile));
  if (!a || !b) fail(`${prefix || 'en/'}: "What to bring" list missing from the I-693 page or the article`);
  else if (a !== b) fail(`${prefix || 'en/'}: "What to bring" lists differ between the I-693 page and the article`);
}
```

- [ ] **Step 8: Run everything.**

Run: `npx tsc --noEmit && npm test`. Expected: PASS, including the existence test.
Run: `ALLOW_INDEXING=true npm run build`. **Expected: FAIL, with exactly three failures**, one "awaiting medical review" per article locale page, **and nothing else.** That failure is the review gate working. Any other failure is a real defect: fix it.

Then prove the parity check can fail: temporarily replace `<WhatToBring locale={locale} />` in the zh-hans article with a hand-written `<ul data-what-to-bring><li>x</li></ul>`, rebuild, confirm the "lists differ" failure appears for `zh-hans/`, and restore.

To confirm the rest of the build is green, temporarily set `lastReviewed: '2026-01-01'` in the registry, rebuild (expect `verify-build OK`), then **restore `null`** and confirm `git diff src/data/articles.ts` shows no `lastReviewed` change.

- [ ] **Step 9: Commit**

```bash
git add src/i18n/locales.ts src/pages/articles src/pages/zh-hant/articles src/pages/zh-hans/articles src/data/articles.ts src/pages/immigration-medical-exam.astro src/pages/zh-hant/immigration-medical-exam.astro src/pages/zh-hans/immigration-medical-exam.astro scripts/verify-build.mjs tests/data/articles.test.ts
git commit -m "First article: what to bring to your I-693 exam (sourced), in three locales"
```

---

### Task 5: Verification, preview, and PR

- [ ] **Step 1: Checks.** `npx tsc --noEmit && npm test` (PASS). `ALLOW_INDEXING=true npm run build` (FAIL, exactly the three review-gate failures, nothing else).

- [ ] **Step 2: Negation search** for every limit the article states (appointment only, adults only, "call the office"), in every locale plus `JsonLd.astro`:
```bash
grep -rn -i -E "walk-in|walk in|same-day|same day|現場|现场|免預約|免预约|all ages|newborn" src
```
Expected: only code comments. Also grep the three article files for anything about fees, vaccines given here, visits, turnaround or labs: `grep -n -i -E "fee|\\$|price|visit|turnaround|lab" src/pages/*articles/what-to-bring-i-693.astro src/pages/zh-han*/articles/what-to-bring-i-693.astro`, and read every hit.

- [ ] **Step 3: Browser check.** With `lastReviewed` temporarily set so the build completes, serve `dist/` (`npx astro preview --port 3121`) and check `/articles/`, `/articles/how-we-write/`, `/articles/what-to-bring-i-693/` and the 繁體 article, in light and dark themes, with the footer link and one article link hovered in both. Restore `lastReviewed: null` afterwards and confirm with `git diff`.

- [ ] **Step 4: The private preview for Dr. Chang.** Build a single self-contained HTML file that shows the rendered English and 繁體 article with the "awaiting review" notice, and publish it as a private Artifact. It must be clearly titled as a review draft.

- [ ] **Step 5: Push and open the PR.** The body lists: the sources with dates and quoted sentences (from Task 4's report); what was deliberately left out; the preview link; **that the build fails by design until `lastReviewed` is set**; and that the owner relays Dr. Chang's review date and corrections, after which `lastReviewed` is set and the PR is merged on the owner's request.
