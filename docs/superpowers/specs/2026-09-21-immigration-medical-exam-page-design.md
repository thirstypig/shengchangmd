# Immigration Medical Exam (Form I-693) page: design

**Date:** 2026-09-21 · **Status:** approved by the owner in conversation, awaiting spec review
**Strategy context:** `todos/010` Workstream A. This is PR 1 of the agreed sequence:

1. **This page**, a flat route with no dependency on todo 005
2. In parallel: fix todo 005, and widen both language guards to `src/content/`
3. The Articles system at `/articles/`, the "How we write these articles" page,
   and the first I-693 article linking here (`todos/011`)

## Goal

The owner's top priority for new patients is I-693 immigration exams. Today
they get one section of `services.astro`. A dedicated page competes on
specifics (price, speed, languages, what to bring), gives the future I-693
articles a page to support, and gives AI assistants a plain factual answer to
quote. English pages are indexed now, so the English page can rank as soon as
it ships. The Chinese pages follow the existing `reviewed` gate.

## Facts: status as of 2026-09-21

| Fact | Status | Source |
|---|---|---|
| USCIS civil surgeon | Confirmed | `practice.civilSurgeon`, USCIS locator (2026-07-29) |
| Appointment only | Confirmed | Owner, 2026-09-21. No contradicting claim in any locale or JSON-LD |
| One flat fee | Confirmed | Owner, 2026-09-21 |
| Fee amount | **Unknown** | Page says to call for the current price |
| Adults only (18+) | Confirmed, existing policy | `patientScope`, live in all three locales |
| Doctor explains results in English or Mandarin | Live on the site now | `services.astro`, all three locales |
| Office languages (five) | Owner, 2026-08-05 | `practice.languages` |
| Vaccines given on site | **Unknown**, but **currently claimed live** | See "Existing claims" below |
| Number of visits | **Unknown**, but "one visit wherever possible" **currently claimed live** | See below |
| Blood draw on site vs. outside lab | Unknown | Not published |
| Turnaround to sealed I-693 | Unknown | Not published |

### Existing claims that are unconfirmed

Both date from the scaffold era (commits `26a8c6c` 2026-07-29 and `4782cb5`
2026-08-05) and cannot be traced to anything the owner supplied:

- "Vaccination record review, with any missing doses given" /
  疫苗紀錄審核，並補接種缺少的疫苗 / 疫苗纪录审核，并补接种缺少的疫苗
- "Exams are carried out in one visit wherever possible" / 盡可能一次看診完成 /
  尽可能一次看诊完成

The family-medicine section also lists 例行預防接種與疫苗 (routine
immunizations and vaccines). **Owner action:** ask the office whether vaccines
are given and how many visits an exam usually takes. This page either states
the confirmed answer, or neither this page nor the services summary states
anything.

## Route

- `/immigration-medical-exam/`
- `/zh-hant/immigration-medical-exam/`
- `/zh-hans/immigration-medical-exam/`

These are flat routes, so hreflang derivation works as-is (todo 005 affects
nested routes only).

## Page structure

1. **Hero:** "Immigration Medical Exam (Form I-693) in San Gabriel", USCIS
   civil surgeon, appointment only, and a call button (`CallButton`).
2. **Quick facts box (`ExamFacts.astro`):** civil surgeon, address, hours,
   appointment only, flat fee (call for price), languages, adults 18 and over.
   Every value is derived; see Data.
3. **What the exam includes:** medical history, physical exam, the required
   blood tests and vaccination record review, per the CDC Technical
   Instructions for Civil Surgeons. Cited. What happens in the office versus
   an outside lab is omitted until confirmed.
4. **What to bring:** photo ID, vaccination records, a medication list, prior
   TB records if any, per the USCIS Form I-693 instructions. Cited.
5. **How it works:** call, then the appointment, then results, then the
   sealed I-693. **USCIS timing rules (when the form must be signed relative
   to filing, and whether it is required at filing) have changed recently.
   Verify on uscis.gov at drafting time, cite, and record the date checked.**
6. **FAQ:** Do I need an appointment? Which languages? What does it cost? Do
   you examine children? (No; the answer points to the USCIS Find a Civil
   Surgeon locator.)
7. **A final call button.**

Every clinical or regulatory statement links to its USCIS or CDC source.

## Data

A new block in `src/data/practice.ts`:

```ts
immigrationExam: {
  appointmentOnly: true,       // owner, 2026-09-21
  flatFee: true,               // owner, 2026-09-21
  feeAmount: null,             // unknown: page says "call for current price"
  vaccinesOnSite: null,        // unknown: line hidden
  typicalVisits: null,         // unknown: line hidden
}
```

**Rule: a `null` fact hides its line.** An unconfirmed fact cannot render.
Supplying the fee later is a one-line change.

Chinese labels for these values live in `practiceLocalized` (never render
`practice.*` directly on a Chinese page).

## Components and files

- **New:** `src/pages/immigration-medical-exam.astro`, plus its `zh-hant` and
  `zh-hans` siblings, following the existing locale-forked page pattern.
- **New:** `src/components/ExamFacts.astro`, which reads `practice.ts` and
  `locales.ts` and contains no literal text (the `shared-component-labels`
  rule, and no Chinese in shared components).
- **FAQ stored once** as data in `locales.ts` (all three locales). The visible
  FAQ **and** the `FAQPage` JSON-LD are both generated from it.
- **Changed:** `services.astro` ×3. The I-693 section becomes a short summary
  and a link. The two unconfirmed lines go unless confirmed first.
- **Changed:** `JsonLd.astro`. The I-693 service entry's `@id` and URL point
  to the new page.
- **Changed:** home ×3 and services ×3 link to the new page.

## Testing

Each new test must be shown to fail before it counts (CLAUDE.md, Tests):

| Test | Catches | Proof it can fail |
|---|---|---|
| A `null` fact hides its line | An unconfirmed fee or visit count rendering | Set `feeAmount` to a placeholder, see red |
| FAQ JSON-LD equals the visible FAQ | Crawlers reading different text from patients | Edit one answer in the JSON-LD path only |
| All three locales exist and cross-link via hreflang | A missing Chinese version | Delete one locale file |

Existing guards that cover the new files automatically (verified by reading
their corpus functions): `american-english`, `taiwan-register` (both read every
`.astro` file in their page directories), `source-integrity` (no restated
address or phone), `shared-component-labels`, `theme-token-coverage`.

Before merging:

- `npx tsc --noEmit`, `npm test`, `ALLOW_INDEXING=true npm run build`
  (`verify-build` checks sitemap/robots agreement: English indexed, Chinese
  `noindex`, and Chinese metadata free of the English name)
- Browser check: three locales × light and dark themes, including hover states
  in both
- Negation search before publishing "appointment only", "adults only" and the
  language wording: every locale plus `JsonLd.astro`

## Out of scope

- The Articles system and the I-693 articles (PR 3, `todos/011`)
- Spanish and Vietnamese pages (need a fluent reviewer)
- Publishing a fee amount, vaccine or turnaround details before the office supplies them
- A Chinese share card (`og-image.png`), tracked separately

## Review

The owner reviews the English. Dr. Chang reviews medical and regulatory
accuracy and the 繁體. Ideally he reads it in the same sitting as the existing
繁體 pages, which also unblocks Chinese indexing.
