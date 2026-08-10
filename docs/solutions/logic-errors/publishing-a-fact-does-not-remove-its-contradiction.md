---
title: 'Publishing a fact does not remove the claim that contradicts it'
date: 2026-08-07
category: logic-errors
problem_type: unretracted_contradictory_claim
component: src/pages/index.astro / services.astro / new-patients.astro / JsonLd.astro / both Chinese locale page sets
severity: high
symptoms:
  - 'a newly published constraint and its exact negation render on the same page'
  - 'the plan says "publish X" and is silent about the copy that already says not-X'
  - 'structured data keeps asserting the old claim after every visible page is corrected'
  - 'typecheck, unit tests, verify-css and verify-build all pass with the contradiction live'
  - 'grepping for the string you just added confirms success and proves nothing'
  - 'the contradicting sentence is well-formed, on-brand, and reads as intentional copy'
stack:
  - Astro 5
  - TypeScript
  - vitest
  - schema.org JSON-LD
  - GitHub Pages
recurrence_risk: 'high — every future constraint (walk-ins, telehealth, age ranges, accepted services) has the same shape, and no test can be written to catch it'
tags:
  - content-integrity
  - i18n
  - structured-data
  - silent-failure
  - untestable-invariant
  - patient-safety
---

# Publishing a fact does not remove the claim that contradicts it

## What happened

The practice owner supplied the patient scope in writing on 2026-08-06: adults
18 and over, seniors 65 and over, **no patients under 18**, no gynaecology or
obstetric care. The implementation plan turned that into a task titled *"Render
patient scope on the services pages"*, with markup, locale keys and a
verification step that greps `dist/` for `under 18`.

Every part of that task was correct, and executing it exactly as written would
have shipped a site that told a parent both of these things:

> We do not see patients under 18.

> Comprehensive family medicine care for patients of all ages, from newborns to
> seniors.

The second sentence was already live, in **seven** places, in all three locales:

| File | Claim |
|---|---|
| `src/components/JsonLd.astro` | `"patients of all ages, from newborns to seniors"` |
| `src/pages/index.astro` | "patients of all ages" |
| `src/pages/services.astro` | "patients of all ages" |
| `src/pages/zh-hant/index.astro` | 為各年齡層患者 |
| `src/pages/zh-hans/index.astro` | 为各年龄层患者 |
| `src/pages/zh-hant/services.astro` | 各年齡層的患者 |
| `src/pages/zh-hans/services.astro` | 各年龄层的患者 |

Two softer forms existed alongside them: `/new-patients/` promised "the same
quality, personalized care to your **family**", and `ServiceIllustration.astro`
carried a comment describing its three figures as "the whole family, **any
age**".

The contradiction was caught before the scope copy was written, by grepping for
`all ages` before starting the task rather than after finishing it.

## Why every existing guard missed it

This repo has real guards, and none of them can see this defect:

- **`tests/data/source-integrity.test.ts`** catches a *fact stored twice*. This
  is not that. "Patients of all ages" and the scope list are different
  sentences making different claims. There is no shared value to compare.
- **`tests/i18n/locale-coverage.test.ts`** catches a key missing from a locale,
  or a Chinese value left byte-identical to English. All seven copies were
  properly translated. The Chinese was *good*, and wrong.
- **`scripts/verify-build.mjs`** performs contradiction checks — sitemap versus
  robots meta, JSON-LD address versus `practice.ts`. Both sides of each of those
  are machine-comparable. "Sees all ages" versus "sees adults only" is a
  semantic contradiction between two prose sentences.
- **`npx tsc --noEmit`** has nothing to say about English.

**There is no invariant to assert here.** Both sentences are individually
well-formed, grammatical, on-brand, and indistinguishable from intentional copy.
A test would have to understand that "all ages" and "18 and over" are mutually
exclusive claims about the same thing. That is not a test; that is a reader.

## Why the JSON-LD copy was the dangerous one

Six of the seven copies were visible page text. The seventh was in
`JsonLd.astro`, a shared component rendered into every page in every locale.

Structured data is what Google's rich results, Apple Maps and voice assistants
read. A parent asking an assistant "does Dr. Chang see children" gets an answer
sourced from `"from newborns to seniors"` **without ever loading the site**. No
amount of careful page copy compensates for that, and no visual review of any
page will show it, because it renders inside a `<script type="application/ld+json">`.

This is the second time structured data has survived a correction that fixed
every visible page. The first was the office hours on 2026-08-06, where
`JsonLd.astro` held `opens: '09:00'` / `closes: '12:00'` as 24-hour literals
that an AM/PM-shaped guard could not match — leaving the site telling patients
1:00 PM and Google noon. See
[`green-checks-that-cannot-see-the-defect.md`](green-checks-that-cannot-see-the-defect.md).

**`JsonLd.astro` is not a page. It will not appear in a page-by-page review.
Check it explicitly, every time.**

## The rule

**Before publishing any constraint, write down its negation and grep for that,
in all three locales and in the structured data.**

Not the thing you are adding — the thing it contradicts. Grepping for `under 18`
after the edit confirms only that the edit landed. It is the same failure this
repo already recorded as *"verify against the invariant, not against your
diff"*, one level up: here even the invariant is unavailable, so the search
term has to come from imagining what the site might already say.

For the scope limits, the negation terms were: `all ages`, `any age`,
`newborn`, `children`, `family`, 各年齡層, 各年龄层.

Worked examples of constraints with the same shape, each with the copy that
would need retracting first:

| If the site gains | First grep for |
|---|---|
| "we do not accept walk-ins" | "walk in", "no appointment needed", 免預約 |
| "we do not offer telehealth" | "virtual", "video visit", "from home", 視訊 |
| "we do not accept new patients" | the `acceptingNewPatients` badge, "Accepting New Patients" |
| "cash only for X" | "we bill your insurance", "we accept most…" |

## What was actually done

1. All seven "all ages" claims removed, and the JSON-LD description rewritten to
   "Comprehensive family medicine care for adults", with the old text preserved
   in a code comment above it stating why it changed.
2. `/new-patients/` reworded away from "care to your family".
3. The illustration comment corrected. The artwork itself — three unlabelled
   figures of descending height — was left alone and flagged in-file, since it
   reads as adults of differing height, but should change if it reads as a child
   to anyone.
4. **Only then** was the scope copy added.
5. A day later, the summary was added to the homepage as well, directly beneath
   the "Accepting New Patients" badge. The limit belongs next to the invitation:
   a visitor who reads "Family Medicine" and "Accepting New Patients" has
   already decided to call, and `/services/` is one click too late.

## What could not be fixed with a test, and what could

No test guards the contradiction itself. One adjacent gap *was* closeable and
was closed in the same PR.

`tests/data/source-integrity.test.ts` asserted that every `serviceCards` key was
read by some page — a rule added after fifteen tests once asserted labels no
page rendered. But it named `serviceCards` **literally**, so the new
`patientScope` and `coverage` blocks were structurally outside what it could
see, exactly as the emptiness check in `locale-coverage.test.ts` had once
iterated only the two Chinese locales and left `en` invisible.

It now derives the block list from `translations.en` itself:

```ts
const NESTED_BLOCKS = Object.entries(translations.en)
  .filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v))
  .map(([name]) => name);
```

plus an assertion that the derivation itself found the expected blocks, so a
refactor that flattens `translations` cannot silently reduce the loop to nothing
while still passing.

Both mutations were run and confirmed red before restoring:

- adding an unread `coverage.neverRendered` key → RED, names the key
- deleting the markup that reads `coverage.ppo` → RED, names `ppo`

The second mutation then caught a live regression: a `git checkout --` intended
to revert it also discarded uncommitted coverage markup on both Chinese
insurance pages. The guard went red immediately rather than letting a silently
empty coverage section ship.

## The general lesson

A specification that says "publish X" is describing half a change. The other
half — retracting whatever the system currently says instead of X — is invisible
in the spec, invisible to the type system, invisible to the test suite, and
invisible in a diff, because **the contradicting line is not in the diff**.

On a site where the constraint is *who a doctor will treat*, the half that is
missing from the spec is the half that hurts someone.
