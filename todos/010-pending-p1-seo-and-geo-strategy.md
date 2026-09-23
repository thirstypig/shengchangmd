---
status: pending
priority: p1
issue_id: 010
tags: [seo, geo, aeo, content, immigration-exam, strategy]
dependencies: [009]
---

# SEO and GEO (AI answers) strategy

## Problem Statement

The owner wants more new patients from search, and asked on 2026-09-21 for
unconventional ideas including GEO/AEO (showing up in AI assistant answers).
The priority he set is **immigration medical exams (Form I-693) first, and
new patients of any kind second**.

This is a strategy record, not a spec. Each workstream below becomes its own
design and PR. The multilingual blog is separate: todo 011.

## Constraints that shape every workstream

- **The Chinese pages are not indexed.** Both Chinese locales are
  `reviewed: false` until Dr. Chang has read them (owner's decision
  2026-09-14). Two-thirds of the site, and all Chinese content added from here
  on, is invisible to Google until then. This is the largest single SEO lever,
  and it is blocked on a person.
- **Health content is YMYL** ("Your Money or Your Life"). Google holds medical
  pages to a higher bar for expertise and trust. Every clinical claim is made
  under Dr. Chang's name and license. No AI-generated health volume.
- **Never invent a fact** (see CLAUDE.md). Each new page publishes new facts at
  a higher rate than the site has so far; each fact needs a source.
- **Publishing a limit does not remove what contradicts it.** Grep every
  locale and `JsonLd.astro` for the negation before shipping.

## Workstream A: a dedicated I-693 page, in all three locales (highest priority)

Today the I-693 service is one section of `services.astro`. Few doctors are
civil surgeons, fewer speak Mandarin or Cantonese, and people searching for
one intend to book. A dedicated page competes on specifics.

**Facts known (owner, 2026-09-21):**
- Appointment only. The negation was checked (walk-in / same-day / 現場 /
  免預約 in every locale and JSON-LD): nothing contradicts it.
- One flat fee. **The amount is unknown**, so the page says to call for the
  current price. Store the amount in `practice.ts` once supplied.
- Languages: the owner believes all five apply to this exam. The site already
  lists all five (owner, 2026-08-05); reuse `practice.languages` rather than
  restating it. Worth confirming with the front desk.
- **Adults only, by existing site policy.** "We do not see patients under 18"
  is live in all three locales. Do not offer family or child I-693
  appointments unless Dr. Chang makes an explicit exception.

**Facts unknown; leave those sections out until they are supplied:** whether
the blood test (TB IGRA, syphilis) is drawn on site or at an outside lab,
whether vaccines are given on site, the wait for an appointment, and the
turnaround until the sealed I-693 is ready.

**Content that does not wait on the office:** what to bring and how the
process works, sourced from the USCIS civil surgeon instructions and the CDC
technical instructions, and cited on the page.

Structured data: a `MedicalProcedure` or service entry in `JsonLd.astro`
derived from `practice.ts`, plus an FAQ block whose answers mirror the
visible copy exactly.

## Workstream B: listings and consistency (the "any new patient" goal)

See todo 009. For the map results ("doctor near me"), the Google Business
Profile outweighs anything on the website.

## Workstream C: GEO / AEO

Ranked by expected value:

1. **Bing Webmaster Tools and IndexNow.** ChatGPT search draws heavily on
   Bing's index. The site has never been submitted. Cheap.
2. **Consistency of facts across sources** (todo 009). AI assistants combine
   sources; disagreement makes them hedge or leave the practice out.
3. **Direct-answer copy.** The questions patients actually ask ("Which doctors
   in San Gabriel speak Mandarin and do immigration exams?") answered plainly
   in the page's first lines, backed by `availableLanguage` and
   `MedicalClinic` structured data derived from `practice.ts`.
4. **Wikidata item for Dr. Chang (a maybe).** He is plausibly notable: first
   Chinese-American mayor of Arcadia, supported by the Arcadia Weekly records.
   Must follow Wikidata's conflict-of-interest norms and cite sources. Never
   cite or link the Arcadia archive's search results (see CLAUDE.md).
5. `llms.txt`: costs almost nothing, and there is little evidence that it
   helps. Last.

## Workstream D: city pages, with strict rules

Near-duplicate pages that swap the city name ("Family Doctor in Alhambra",
"…in Rosemead") are **doorway pages** under Google's spam policies and can
demote the whole domain. Only build a city page when there is something true
and specific to that city to say.

- **Arcadia qualifies.** He settled there in 1979, served on the City Council
  (1994–1998, 2000–2004), and was mayor in 2003. All of this is already
  published and sourced.
- A single honest "Patients come to us from…" section on the location page
  covers the other San Gabriel Valley cities without doorway risk.

## Workstream E: Chinese channels beyond Google

Chinese-American patients often find doctors through 小红书 (Xiaohongshu),
WeChat groups, LINE, Yelp, and Chinese-language directories (listed in todo
009). One good 小红书 post from the practice may outperform several blog posts.
The owner's channel to run; the site supplies the canonical facts and link.

## Also considered and deliberately deferred

- **Spanish and Vietnamese pages.** The office lists both languages and the
  site has neither. There is little competition for these, but a fluent
  reviewer is required first, the same gate as the Chinese pages.
- **A medical-legal referral page for attorneys.** The scope is deliberately
  general (confirmed 2026-08-09); the specifics would have to come from
  Dr. Chang first.
- **A Chinese share card (`og-image.png`).** Still open from PR #64.

## Open questions for the owner

- ~~The I-693 flat fee amount; labs, vaccines, turnaround~~: **the owner decided
  2026-09-21 to keep these unpublished**; patients call to ask. Workstream A shipped
  2026-09-22 (PR #67).
- ~~The unconfirmed services-page claims~~ ("missing doses given", "one visit")
  were removed in PR #67. Still open: the family-medicine line 例行預防接種與疫苗 /
  "routine immunizations".
- Whether a staff member must be present for the Vietnamese and Spanish exams
- ~~Google Search Console~~ verified 2026-09-23. Still open: Bing Webmaster Tools, and whether to add analytics at all (there is none on this site today — a privacy decision for the owner)

## Acceptance Criteria

- [x] Workstream A shipped as its own spec and PR, in all three locales (PR #67, live 2026-09-22)
- [ ] Site submitted to Bing Webmaster Tools, with IndexNow configured (can now be imported from Search Console in one step)
- [x] **Google Search Console verified 2026-09-23** — URL-prefix property `https://shengchangmd.com/`, HTML-tag method (the tag lives in `BaseLayout.astro` and must never be removed). `sitemap-index.xml` submitted and accepted; indexing requested for the I-693 page, both articles and the 繁體 I-693 page. **No baseline exists**: the property was created after the I-693 page, the Articles section and Chinese indexing all shipped, so the first weeks of data are the starting point, not a before-and-after
- [ ] Each remaining workstream either shipped or explicitly declined here, with the reason

## Work Log

**2026-09-21** — Brainstormed with the owner. Priorities set: I-693 (A), then
any new patient (D). Facts above recorded as the owner stated them.
