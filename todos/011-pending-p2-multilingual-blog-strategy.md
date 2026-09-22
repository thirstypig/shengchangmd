---
status: pending
priority: p2
issue_id: 011
tags: [seo, geo, content, blog, i18n, strategy]
dependencies: [005, 010]
---

# Multilingual blog strategy

## Problem Statement

The owner wants a trilingual blog (English, 繁體, 简体) of SEO-optimized
articles. Done badly on a medical site, a blog is a liability: it adds a
YMYL claim under Dr. Chang's license with every post, it goes stale, and it
publishes facts faster than anyone can check them. Done well, it gives the
I-693 work in todo 010 supporting pages, and gives AI assistants something
specific to quote.

This is a strategy record. The build gets its own spec.

## Principles

1. **Few posts, each one Dr. Chang stands behind.** Cadence (agreed
   2026-09-21): **one post every two weeks for the first 2–3 months** to build
   the I-693 cluster (about five posts), **then one a month**, plus a yearly
   re-review of every post. Google's documentation gives no frequency signal;
   it flags "producing lots of content on many different topics in hopes that
   some of it might perform well" as a warning sign. A stale or wrong post
   costs more than a missing one.
2. **All three locales publish together.** The CLAUDE.md rule for page copy
   applies to posts too. A post that exists only in English is a sitewide
   defect.
3. **Topics come from real questions,** the ones the front desk is asked on
   the phone, not from a keyword tool's list. Real questions are also the
   phrasing people type into AI assistants.
4. **Mostly "how it works", not medical advice.** Explaining paperwork and
   processes is lower-risk than health content and is poorly covered in
   Chinese. Clinical topics need Dr. Chang's review line by line.
5. **Every factual claim is cited.** For I-693 and coverage topics, the
   sources are USCIS, CDC, CMS and DHCS pages, linked from the post.

## Topic clusters

**1. Immigration medical exam (the priority, supporting todo 010 Workstream A)**
- What to bring to an I-693 exam
- Vaccination records for I-693: what counts and what happens if records are missing
- The TB blood test (IGRA) in the I-693 exam, explained
- How long an I-693 remains valid and when to schedule relative to your
  filing. **USCIS policy here has changed more than once; confirm current
  policy at writing time, record the date, and re-review.**
- Civil surgeon vs. panel physician: why the exam in the US differs from the one abroad

**2. Coverage, explained for immigrant families.** Built only from facts
already published on the insurance pages.
- The white Medi-Cal card vs. the red, white and blue Medicare card
- HMO vs. PPO: what a referral is and why the office confirms your plan
- (Each post keeps the load-bearing qualifier: the office confirms whether
  *your* plan is contracted.)

**3. Citizenship and forms**
- Form N-648, the medical disability exception for the naturalization test.
  Form numbers stay as-is in every locale (`locales.ts`).

**4. The practice and its history (E-E-A-T, lowest risk)**
- Dr. Chang's 47 years in the San Gabriel Valley, the Arcadia civic record.
  Sourced only from what is already published. Link individual archive
  permalinks, **never the Arcadia archive search**.

**Out of scope unless Dr. Chang supplies the content:** stem cell therapy (the
section may not be expanded; see CLAUDE.md), medical-legal specifics,
anything pediatric (the practice sees adults only), and seasonal clinical
topics such as flu shots (whether the office gives them is unknown).

## Technical design notes (for the spec)

- **Astro content collections**, one entry per post per locale under
  `src/content/blog/{en,zh-hant,zh-hans}/`, sharing a `translationKey` so the
  three are linked for hreflang.
- **Frontmatter:** `title`, `description`, `translationKey`, `published`,
  `lastReviewed`, `reviewedBy` (Dr. Chang), `sources` (non-empty), and a
  per-post `reviewed` flag.
- **Indexing gate:** a post is indexed only if its locale is `reviewed: true`
  **and** the post is `reviewed: true`, and sitemap membership follows the
  same rule so the two can never disagree, the same invariant
  `verify-build.mjs` already enforces for pages.
- **Structured data:** `BlogPosting` / `MedicalWebPage` with `author`,
  `reviewedBy` and `lastReviewed`, derived from `practice.ts` rather than
  restated.
- **Staleness:** a build warning when `lastReviewed` is more than 12 months
  old, sooner for I-693 policy posts.

## Existing guards the blog would sit outside (fix these first)

Found 2026-09-21 by reading the code. These are the same green-checks-that-
cannot-see-the-defect shape recorded in
`docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md`:

- **`tests/i18n/taiwan-register.test.ts`** builds its corpus from the locale
  page files and `locales.ts`. A Markdown post in `src/content/` is not in it,
  so a post saying 医生 or 信息 would pass. The corpus must include the blog.
- **`tests/i18n/american-english.test.ts`** reads `src/pages` only. Same gap,
  same fix.
- **Todo 005, hreflang on nested routes:** `/blog/<slug>/` is exactly the
  nested-route case that todo describes, which today would emit **no
  alternates at all**, silently. It becomes live the moment the first post
  ships. Hence the dependency.
- New tests needed: every `translationKey` exists in all three locales, and
  `sources` is non-empty.

Every new guard must be shown to fail before it counts (CLAUDE.md, Tests).

## Workflow per post

1. Pick a question from the front desk's list.
2. Draft the English version with sources, then 繁體 (Taiwan Mandarin), then
   简体 (the same Taiwan wording in simplified characters, not mainland
   wording).
3. **The owner reviews** the English: whether it reads well, whether it matches
   what the office actually does, and whether any practice fact is new and
   needs confirming.
4. **Dr. Chang reviews** medical and regulatory accuracy, and reads the 繁體
   as a native Taiwanese reader. Only his review sets `reviewedBy` and
   `lastReviewed`; the byline must name whoever actually reviewed.
5. One PR carrying all three locales.

Both reviewers confirmed available (owner, 2026-09-21).

## Open questions for the owner

- Who drafts: Claude from sources, the owner, or Dr. Chang?
- Byline: "by Dr. Chang" or "medically reviewed by Dr. Chang"? Only the
  accurate one may be used.
- Section name in Chinese (e.g. 健康專欄 or 衛教文章) and the English name.
- Could the front desk keep a simple list of the questions patients ask?

## Acceptance Criteria

- [ ] Open questions above answered
- [ ] Todo 005 fixed, and both language guards cover `src/content/`
- [ ] Spec written for the collection, the gates and the structured data
- [ ] First post (an I-693 cluster topic) published in all three locales, reviewed by Dr. Chang

## Work Log

**2026-09-21** — Strategy drafted with the owner. The gaps in the existing
guards were found by reading the corpus functions of both language tests and
the route assumption in todo 005.
