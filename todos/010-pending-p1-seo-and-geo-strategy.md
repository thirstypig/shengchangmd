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

- ~~**The Chinese pages are not indexed.**~~ They are, since 2026-09-22 (the
  owner's call, ahead of Dr. Chang's read). Everything Chinese added from here
  on is indexed the day it ships, so it has to be right before merging.
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

**The owner handles this offline** (his decision, 2026-09-23): the Google
Business Profile, the listing corrections and the Chinese directories are his
to run, not work tracked here. The research stays in todo 009 for reference —
do not re-raise it as an open task. For the map results ("doctor near me"), the
Google Business Profile outweighs anything on the website.

## Workstream C: GEO / AEO

Ranked by expected value:

1. ~~**Bing Webmaster Tools and IndexNow.**~~ Imported from Search Console
   2026-09-23. ChatGPT search draws heavily on Bing's index.
2. **Consistency of facts across sources** (todo 009). AI assistants combine
   sources; disagreement makes them hedge or leave the practice out.
3. **Direct-answer copy.** The questions patients actually ask ("Which doctors
   in San Gabriel speak Mandarin and do immigration exams?") answered plainly
   in the page's first lines, backed by `knowsLanguage` and
   `MedicalClinic` structured data derived from `practice.ts`.
4. ~~**Wikidata item for Dr. Chang (a maybe).**~~ **Declined by the owner,
   2026-10-16.** He is plausibly notable: first
   Chinese-American mayor of Arcadia, supported by the Arcadia Weekly records.
   Must follow Wikidata's conflict-of-interest norms and cite sources. Never
   cite or link the Arcadia archive's search results (see CLAUDE.md).
5. ~~`llms.txt`~~: **declined by the owner, 2026-10-16.** Little evidence it
   helps, and it would be another place practice facts are restated.

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
- [x] **Bing Webmaster Tools: imported from Search Console 2026-09-23** (8 properties imported by the owner). Matters because ChatGPT's search leans on Bing's index
- [x] **Google Search Console verified 2026-09-23** — URL-prefix property `https://shengchangmd.com/`, HTML-tag method (the tag lives in `BaseLayout.astro` and must never be removed). `sitemap-index.xml` submitted and accepted; indexing requested for the I-693 page, both articles and the 繁體 I-693 page. **No baseline exists**: the property was created after the I-693 page, the Articles section and Chinese indexing all shipped, so the first weeks of data are the starting point, not a before-and-after
- [ ] Each remaining workstream either shipped or explicitly declined here, with the reason

## Work Log

**2026-09-21** — Brainstormed with the owner. Priorities set: I-693 (A), then
any new patient (D). Facts above recorded as the owner stated them.

**2026-10-15** — Workstream C3, structured-data half. A schema.org check of
every type and property the built site emits found eight terms that do not
exist or are not allowed where they were used, so search engines ignored them:
`MedicalService` (all four services, including I-693), `acceptsNewPatients`,
`availableLanguage` on an organization, free-text `medicalSpecialty`,
`educationDetails`, `educationLevel`, and `validFrom`/`validUntil`/`issuedBy`
on a credential. Two of the ignored values were invented (a certification
expiry of last-recertified + 10, a medical-school start of graduation − 4) and
were removed rather than renamed. The practice was also two organization nodes,
with every service naming a third, anonymous one; it is now one `MedicalClinic`
that the services and the doctor reference by `@id`. `verify-build.mjs` check
10 now fails the build on any type or property not on a checked allowlist.

**2026-10-15** — Workstream C3, visible half (separate PR). The home page
hero now answers the search directly in all three locales: family medicine
for adults in San Gabriel; Dr. Chang speaks English and Mandarin; USCIS
civil surgeon for I-693. The "Languages Spoken" / 看診語言 heading over the
five office languages became "Languages Our Office Speaks" /
診所可使用的語言 (the FAQ's existing wording), because 看診語言 — "languages
you can be seen in" — implied Dr. Chang sees patients in all five.
Negation checked: nothing anywhere says he speaks a third language.

Remaining workstreams, with recommendations for the owner:
- C2 (fact consistency across sources) and E (Chinese channels): the owner's,
  offline.
- C4 (Wikidata item): needs the owner to decide; conflict-of-interest norms
  apply. Not started.
- C5 (`llms.txt`): recommend declining for now. Little evidence it helps, and
  it would be another place practice facts are restated.
- D (Arcadia page): recommend waiting for Search Console data, which now
  exists (property verified 2026-09-23), to see whether Arcadia searches
  reach the site at all before writing a page for them.

**2026-10-16** — Owner decisions: C4 (Wikidata) declined, C5 (`llms.txt`)
declined. Do not re-raise either without a new reason.

Search Console, read 2026-10-15 (URL-prefix property `https://shengchangmd.com/`),
changes what D can be decided on. Last 28 days: 12 clicks, 196 impressions,
**all on the home page**, and the only visible queries are his name. Page
indexing: **1 indexed, 0 not indexed**, so Google had never discovered the other
40 sitemap URLs. The submitted `/sitemap-index.xml` read "Success" on 09-26 but
its child `/sitemap-0.xml` showed "Couldn't fetch" with 0 URLs and no retry,
although the live file is a valid 41-URL sitemap served 200 as
`application/xml`. URL Inspection: `/immigration-medical-exam/` and `/zh-hant/`
were "URL is unknown to Google". On 2026-10-16 `/sitemap-0.xml` was submitted
directly and indexing was requested for the pages listed in the next entry.

So **D stays on hold**, and so does any reading of A's results: with only the
home page indexed, no other page could have earned a query. Re-read the
Performance report about two weeks after the pages are indexed.

**2026-10-16** — Done in Search Console, at the owner's instruction:
`/sitemap-0.xml` submitted directly (it still read "Couldn't fetch", type
"Unknown", immediately after; recheck after a few days, and if it persists the
cause is worth finding rather than resubmitting). Indexing requested, each
confirmed by "URL was added to a priority crawl queue": `/immigration-medical-exam/`,
`/zh-hant/`, `/zh-hans/`, `/zh-hant/immigration-medical-exam/`,
`/zh-hans/immigration-medical-exam/`, `/services/`, `/new-patients/`. Every
one inspected as "URL is unknown to Google" first.

Next check, about 2026-10-23: Search Console → Pages (indexed count should be
above 1) and Sitemaps (sitemap-0.xml should list 41 discovered URLs).
