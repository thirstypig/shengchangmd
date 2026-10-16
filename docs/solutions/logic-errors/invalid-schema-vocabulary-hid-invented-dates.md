---
title: 'Invalid schema.org terms were hiding two invented credential dates — renaming them would have published both'
date: 2026-10-15
category: logic-errors
problem_type: dormant_fabrication
component: src/components/JsonLd.astro / scripts/verify-build.mjs
severity: high
symptoms:
  - 'JSON-LD that looks complete in source and in the built HTML, and that search engines silently ignore'
  - 'a structured-data value computed from another value (year + 10, year - 4) rather than read from practice.ts'
  - 'a "fix the property names" change that would be correct on its own and would publish a fabricated fact'
stack:
  - Astro 5
  - schema.org JSON-LD
time_to_diagnose: 'minutes, once every emitted type and property was checked against schema.org one by one; the invented values were found only because each renamed property had to be given a value'
recurrence_risk: 'medium — any ignored field is a place a fabrication can sit unnoticed, and fixing the field is what wakes it'
tags:
  - structured-data
  - fabrication
  - silent-failure
  - verification-bias
---

# Invalid schema.org terms were hiding two invented credential dates

## What happened

On 2026-10-15 every JSON-LD type and property the built site emits was checked
against schema.org. Eight terms did not exist, or were not allowed where they
were used, so search engines ignored them: `MedicalService` (on all four
services, I-693 included), `acceptsNewPatients`, `availableLanguage` on an
organization, a free-text `medicalSpecialty`, `educationDetails`,
`educationLevel`, and `validFrom`/`validUntil`/`issuedBy` on a credential.

The obvious fix is to rename each one to its valid equivalent. **For two of
them, that would have published an invented fact.**

| Ignored property | Value | Where the value came from |
|---|---|---|
| `validUntil` on each board certification | `mostRecentCertification + 10` | Nowhere. An expiry date nobody supplied, assuming a ten-year cycle. Introduced in the initial scaffold, `441f55e`, 2026-07-28. |
| `startDate` on the medical-school `EducationEvent` | `education.year - 4` | Nowhere. A medical-school start date nobody supplied, assuming a four-year program. Introduced in `df6bab0`, 2026-07-29. |

Neither number is in `src/data/practice.ts`, and neither was ever supplied by
the owner. Both are *plausible*, which is exactly why they read as data. A
four-year program and a ten-year recertification cycle are American defaults,
assumed, not checked against Dr. Chang's actual school or boards.

Both came from the first two days of the repo, the same scaffold and SEO
session that produced the fabricated map embed, the invented insurance carrier
list, and the void "Lighthouse 100/100/100/100" report
([write-up](../integration-issues/tailwind-v4-astro-silently-uncompiled.md)).
Its other output was corrected months ago. These two survived because nothing
ever read them.

## Why nothing caught it

**An ignored field is invisible to every reader at once.**

- No validator had been run on the site before 2026-10-15. Even one that
  flags an unknown property reports it as a vocabulary problem; it does not
  ask where the value came from.
- A person reviewing the page never sees JSON-LD.
- A person reviewing `JsonLd.astro` sees `validUntil: cert.mostRecentCertification + 10`,
  which reads as a correct computation, not as a fact being invented. The
  arithmetic is right. The premise is not.
- The source-integrity test guards facts *restated* outside `practice.ts`. A
  fact *derived* from one in `practice.ts` passes, because it isn't a copy.

So the fabrication was dormant: present in the HTML, served to every crawler,
and inert only because of a second, unrelated bug. **Fixing the unrelated bug is
what would have made it live.**

## The fix

`#90` (merged 2026-10-15) renamed the properties and **removed both values**
rather than carrying them across:

- Board certifications became `EducationalOccupationalCredential` with
  `recognizedBy` (the board) and `dateCreated` (the first-certified year), both
  read directly from `practice.boardCertifications`. No expiry.
- The degree became a credential of its own, `recognizedBy` a
  `CollegeOrUniversity`, `dateCreated` the graduation year, plus `alumniOf`. No
  start date.

A comment at the top of `hasCredential` in `JsonLd.astro` records why, so the
next person adding "the missing expiry date" knows it was removed on purpose.

`scripts/verify-build.mjs` check 10 now fails the build on any JSON-LD type, or
type-and-property pair, that is not in `SCHEMA_VOCAB`, an allowlist where each
entry was checked against schema.org on 2026-10-15. Mutation-tested by planting
three of the old defects back; each failed the build. **That check stops an
invalid term coming back. It does nothing about an invented value under a valid
one**, and no check here can: `dateCreated: practice.education.year - 4` would
pass it.

## The rule

**When you fix a field that nothing has been reading, audit its value as if you
were publishing it for the first time, because you are.** Renaming a property,
correcting a selector, wiring up a component that was never imported, flipping
a `noindex`: all of them turn inert content into live claims at once, and the
content was never reviewed, because it was never visible.

Concretely, for structured data here:

- Every value in `JsonLd.astro` must be read from `practice.ts` or a locale
  file, not computed from one. Arithmetic on a fact (`+ 10`, `- 4`, "next
  renewal", "years in practice") produces a new fact, and the new fact needs a
  source of its own.
- If the honest value is unknown, omit the property. schema.org properties are
  all optional; a missing `validUntil` claims nothing, and a guessed one claims
  a date.

## Related

- [Publishing a fact does not remove its contradiction](publishing-a-fact-does-not-remove-its-contradiction.md):
  the same file, `JsonLd.astro`, carried "from newborns to seniors" after the
  page said "adults only". Structured data is not a page and does not turn up in
  a page-by-page review.
- [Five green checks, five defects they could not see](green-checks-that-cannot-see-the-defect.md):
  the general pattern. This instance is the inverse: not a check that was
  green, but a bug that was protecting the site from a worse one.
