# Articles section and first article: design

**Date:** 2026-09-22 · **Status:** approved by the owner in conversation
**Strategy context:** `todos/011` (multilingual blog strategy), PR 3 of the agreed sequence.
PR 1 (#67) shipped the I-693 page; PR 2 (#69) made nested routes and both
language guards work under `src/pages/**` and `src/content/**`.

## Goal

Launch an `/articles/` section, in English, 繁體 and 简体, with its first article,
**"What to bring to your I-693 exam"**, and a "How we write these articles" page.
Articles support the I-693 page (a topic cluster) and give search engines and AI
assistants specific, sourced text to quote.

## Decisions (owner, 2026-09-21/22)

| Decision | Choice |
|---|---|
| First article | "What to bring to your I-693 exam" |
| Publish gate | **An article goes live only after Dr. Chang reviews it.** He reviews from a private preview link |
| Discovery | Linked from the I-693 page and the footer; main nav only once there are 3+ articles |
| Build approach | **Locale-forked `.astro` pages + a registry** (`src/data/articles.ts`), not Markdown collections |
| URL / label | `/articles/`; Articles / 文章專區 / 文章专区 (from todo 011) |
| Drafting | Claude drafts from primary sources; the owner and Dr. Chang review |
| Disclosure | A per-article line plus a "How we write these articles" page |
| Byline | "Medically reviewed by", never "by Dr. Chang" |
| Deliberately unpublished | The exam fee, vaccines in the office, number of visits, turnaround (owner decision 2026-09-21). Articles say to call |

Why `.astro` over Markdown: PR 2 already made subfolder pages get correct
hreflang and made both language guards read subfolders, so `.astro` articles need
no new mechanism. Markdown would need MDX (a new dependency, against the repo's
zero-UI-package convention) to embed the shared list, plus a way for a dynamic
route to declare its locales.

## Routes (each in `en`, `zh-hant`, `zh-hans`: 9 pages)

| Path | Content |
|---|---|
| `/articles/` (`articles/index.astro`) | Index: heading, one sentence, the article list from the registry |
| `/articles/what-to-bring-i-693/` | The first article |
| `/articles/how-we-write/` | The method page |

## Data

### `src/data/articles.ts`: the registry, one entry per article

```ts
export interface ArticleSource { title: string; url: string }
export interface Article {
  slug: string;                  // 'what-to-bring-i-693'
  reviewedBy: 'doctor';          // resolves to practice.doctorNameShort / the JSON-LD #doctor @id
  lastReviewed: string | null;   // ISO date of Dr. Chang's review; null until he has reviewed
  sourcesChecked: string;        // ISO date the sources were last fetched
  sources: ArticleSource[];      // non-empty
  relatedPage: string;           // '/immigration-medical-exam/'
}
```

Titles and one-line summaries live in `locales.ts` (`articles.<slugKey>.title`,
`.summary`) so every existing language guard covers them. The method page is not
an article and is not in the registry.

### The "What to bring" list moves to `locales.ts`, rendered once

The I-693 page's "What to bring" list becomes locale data plus a
`WhatToBring.astro` component, and **both the I-693 page and the article render
that component.** One copy of the facts. The list's single item containing a link
(the form edition, linking uscis.gov/i-693) is stored as text parts so the link
stays markup, not an HTML string.

## Components

- **`WhatToBring.astro`**: the shared list. No literal text.
- **`ArticleByline.astro`**: when `lastReviewed` is set: *"Drafted with AI
  assistance from the official sources listed below. Medically reviewed by
  Sheng Chang, M.D., on {date}."* (Worded generally, not "USCIS and CDC", so it
  stays true for a later article sourced from CMS or DHCS.), with the date formatted per locale from `lastReviewed` and a
  link to the method page. **When `lastReviewed` is null it renders an "Awaiting
  medical review" notice carrying `data-unreviewed`**, which the preview shows and
  the build rejects (see Review gate).
- **`ArticleSources.astro`**: the source list from the registry, plus "Sources
  checked {sourcesChecked}".

## Content: "What to bring to your I-693 exam"

About 600–900 English words. **Every fact is fetched from USCIS or CDC at
drafting time, quoted in the PR, and dated.**

1. Who it's for: applicants adjusting status in the US who need a civil
   surgeon's exam. Appointment only; call the office.
2. The checklist: `WhatToBring`.
3. Vaccination records in depth: what counts as a record, and what the **CDC
   rules** say happens when records are missing. Stated as CDC rules, never as
   this office's practice; ends by telling the reader to call and ask how it
   works here.
4. Records not in English: **only if** a USCIS or CDC source states a translation
   requirement for the exam. Otherwise omitted.
5. Past TB diagnosis or treatment: what documentation to bring, per the CDC TB
   technical instructions.
6. Filling in Part 1 of Form I-693: don't sign until in front of the civil
   surgeon; use the current edition from uscis.gov/i-693 (no hardcoded edition
   date).
7. After the exam: one line and a link to the I-693 page's "How it works"
   section. Not restated.

Never stated: the fee, vaccines given in this office, the number of visits,
turnaround, or the lab location.

## Content: "How we write these articles"

Short. Sources are official agencies only (USCIS, CDC, CMS, DHCS), linked and
dated; drafts are written with AI assistance; two reviews (the owner checks the
article against how the office works, and Dr. Chang checks medical and regulatory
accuracy); what the review date means; what we don't publish (prices, office
logistics) and to call instead; how to report an error (phone and email from
`practice.ts`).

## Structured data

- Each article: `MedicalWebPage` with `reviewedBy` → the existing `/#doctor`
  `@id`, `lastReviewed`, `citation` (the sources), `inLanguage`, and `about` →
  the I-693 `MedicalService` `@id`. All derived from the registry via
  `pageSchema`.
- The index: `CollectionPage` listing the articles.

## Links

- The I-693 page (×3): a "Full guide: what to bring" link to the article,
  directly under its "What to bring" section.
- The footer (all pages): a new "Resources / 資源 / 资源" column holding an
  "Articles / 文章專區 / 文章专区" link to the locale's `/articles/`. (The
  existing columns are Office Information, Legal and Connect; an articles link
  fits none of them, and the footer grid reflows on its own.)
- The article: links to the I-693 page (related) and to the method page (byline).

## Review gate, enforced by the build

1. The PR is built with `lastReviewed: null`, so the byline renders the
   "Awaiting medical review" notice with `data-unreviewed`.
2. **`verify-build.mjs` fails the build if any built page contains
   `data-unreviewed`.** CI runs the build before deploying, so an unreviewed
   article cannot deploy even if merged by mistake.
3. Claude publishes a **private preview** (the rendered English and 繁體 article)
   for the owner to forward to Dr. Chang.
4. His corrections land; `lastReviewed` is set to his review date; the build
   passes; the owner asks for the merge.

Recommended alongside: Dr. Chang reads the existing 繁體 pages in the same
sitting, which is what unblocks indexing the Chinese locales.

## Testing

Each new test is shown failing before it counts.

| Test | Catches |
|---|---|
| Every registry article has all three locale page files | A missing translation |
| Every registry article has non-empty `sources`, valid ISO dates, `https:` URLs | An unsourced or malformed entry |
| Every registry article has title and summary keys in all three locales | An untitled article |
| verify-build: no built page contains `data-unreviewed` | An unreviewed article deploying |
| The I-693 page and the article render the same "What to bring" list (verify-build compares the built lists) | The two copies drifting |

Existing guards that cover the new pages with no change: both language guards
(recursive since PR 2), `source-integrity` (key usage, no restated phone or
address), `shared-component-labels`, `theme-token-coverage`, the hreflang
self-reference and resolution checks, and the sitemap/robots agreement.

Before merge: `npx tsc --noEmit`, `npm test`, `ALLOW_INDEXING=true npm run build`,
a browser check (light and dark, hover in both), and a negation search for
anything the article asserts, in every locale plus `JsonLd.astro`.

## Out of scope

- Articles beyond the first; the main-nav link (at 3+ articles)
- A Markdown or MDX pipeline
- Spanish and Vietnamese
- Changing what the I-693 page says (it only gains the shared list component and
  one link)
