# Owner-supplied practice facts — design

**Date:** 2026-08-06
**Source:** a batch of facts supplied by the practice owner (Dr. Chang, relayed
by the site owner) covering licence, board certification, hours, patient scope,
accepted coverage, social services and biography.
**Status:** design approved, not yet implemented.

## Why this document exists

The batch reverses three decisions made on 2026-08-05, corrects a fact that is
currently wrong on the live site, and adds patient-scope information the site
has never carried. It is large enough that implementing it as one change would
bury the one item a patient could be harmed by. This records what was decided,
by whom, and on what evidence.

## What is wrong on the live site right now

### Office hours are wrong, and stored seven times

The owner states hours are **9:00 AM – 1:00 PM, Monday to Friday**. The site
says 9:00 AM – 12:00 PM.

The same fact is stored in seven places, none of which derives from another:

| Location | Current value |
|---|---|
| `src/data/practice.ts:130` | `Monday–Friday 9:00 AM – 12:00 PM` |
| `src/i18n/locales.ts:64` (en) | `Monday–Friday 9:00 AM – 12:00 PM` |
| `src/i18n/locales.ts:104` (zh-hant) | `週一至週五 上午9:00 – 中午12:00` |
| `src/i18n/locales.ts:144` (zh-hans) | `周一至周五 上午9:00 – 中午12:00` |
| `src/pages/hours.astro:28` | `9:00 AM – 12:00 PM` (bare literal) |
| `src/components/JsonLd.astro:62-63` | `opens: '09:00'`, `closes: '12:00'` (24-hour, MedicalBusiness's `openingHoursSpecification`) |
| `src/components/JsonLd.astro:129-130` | `opens: '09:00'`, `closes: '12:00'` (24-hour, ContactPoint's `hoursAvailable`) |

The original count of five, above, missed both `JsonLd.astro` sites: they
store the hour in 24-hour format with no AM/PM, so they read differently from
the other five copies even though they encode the same fact, and a first pass
looking for `AM`/`PM` literals walked right past them. `JsonLd.astro` is
rendered by `BaseLayout.astro` on every page in every locale, and is the
structured data Google's hours panel, Apple Maps and voice assistants read —
so these two copies reach a patient who never loads the site, and are the ones
most likely to actually mislead someone.

Three of the first five are English. This is the exact failure documented in
`docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md`,
and `tests/data/source-integrity.test.ts` does not catch it — that test guards
the street address and the phone number, not the hours.

Git history shows the scaffold shipped `9:00 AM – 6:00 PM`. It was later
corrected to 9–12. Office hours have therefore been wrong on this site at least
once already, and the duplication is why a correction is easy to apply
incompletely.

### `/hours/` carries two further defects

`/hours/` is linked from `PageNav.astro:12` and from `location.astro:73`. It is
reachable and indexed.

1. **It contradicts the footer on its own page.** The page body says
   *"Saturday — By appointment"* (`hours.astro:31-33`). The footer rendered by
   `BaseLayout.astro:158` on the same page says *"Closed Saturday and Sunday"*,
   from `locales.ts:65`. Both are live, one screen apart. The owner's batch
   names no Saturday availability.
2. **A vestigial instruction from the 9–6 scaffold.** *"After 5:00 PM, please
   leave a message. Calls are returned the next business day."*
   (`hours.astro:36`). The office closes at 1:00 PM.

## Decisions

All decided by the site owner on 2026-08-06 unless noted.

| Item | Decision |
|---|---|
| Hours | **9:00 AM – 1:00 PM** is correct. Fix all copies. |
| Licence A 33409 | **Restore**, number and status only. No expiry date. |
| ABP pathology certification | **Restore.** |
| Alabama pathology residency | **Publish**, correctly labelled as pathology. |
| Insurance | **Publish the plan types**, each qualified with call-to-confirm. |
| Ph.D. | **Leave as-is.** Confirmed 2026-08-05; not retracted. |
| Family details | **Marriage only.** No sons or grandsons. |
| Years in practice | **Publish no year-count** (see below). |
| Arcadia archive photo | **Blocked**, permission request drafted (see below). |

### Corrections applied silently

- **"I 648" → Form N-648.** There is no Form I-648. The citizenship exam waiver
  medical report is N-648, which the site already uses correctly
  (`services.astro:97`, `index.astro:48`).
- **"MediCal (while card)" → Medi-Cal (white card)**, the Medi-Cal BIC card.
- **"Taita" → 台大 / National Taiwan University**, which the owner glosses
  himself in the same message.

### The years-in-practice contradiction, third occurrence

The batch says both *"practicing Family Medicine since 1997 when he moved to LA
area"* and *"practice the Family Medicine for 40 years"*, while also saying he
moved to California in 1979. The site uses **1979**, corroborated by the
California licence issue date of 13 February 1979. 1979 to 2026 is 47 years, not
40, and 1997 contradicts both the move and the council terms.

**Resolution:** keep 1979, publish no duration. Any number contradicts one of
the owner's own statements. This is the third time this contradiction has
surfaced; it is already noted in `CLAUDE.md`.

## Design

### 1. Hours — one fact, one home, and a test

`practice.hours.weekday` becomes `Monday–Friday 9:00 AM – 1:00 PM` and is the
single English source. `locales.ts` English stops restating it and derives from
`practice.ts`. The two Chinese values stay hand-authored — they are translations,
not copies — but a new test asserts that the **digits** in every locale's
`hoursWeekday` match those in `practice.hours.weekday`, so a future correction
cannot reach English and miss Chinese.

Note that `locales.ts` currently has **no imports at all**; this adds
`import { practice } from '@data/practice'`. `practice.ts` imports nothing, so
there is no cycle.

`hours.astro` stops hardcoding, drops the Saturday line, and replaces the
"after 5:00 PM" note with one that matches a 1:00 PM close.

**Files:** `practice.ts`, `locales.ts` (×3), `hours.astro`,
`tests/data/source-integrity.test.ts`.

### 2. Credentials

`practice.ts` regains:

- `medicalLicenseNumber: 'A 33409'` and a current status. **No expiry date** —
  July 31 2028 would go stale silently and nobody will be watching the site that
  day. The issue date stays in the file comment as the evidence for 1979.
- The American Board of Pathology certification: Anatomic Pathology & Clinical
  Pathology, first certified 1973, lifetime certificate, no maintenance
  required.
- `education` gains postgraduate training: University of Chicago (NorthShore)
  transitional-year internship 1969–1970, and University of Alabama Medical
  Center residency in Anatomic and Clinical Pathology 1970–1973.

**Evidence, stated honestly in the file:**

- `A 33409` — in the original scaffold *and* supplied independently by the owner
  on 2026-08-06. Two independent sources; the strongest-sourced item in the
  batch.
- `1973` ABP certification — corroborated indirectly by the Doximity residency
  dates ending 1973.
- **"Anatomic Pathology & Clinical Pathology" as the specialty label comes from
  the original scaffold and is not independently verified.** The scaffold is
  known to contain fabricated content. Flag it in a comment.
- The residency and internship come from Dr. Chang's Doximity profile.

The About page renders a licence card and a second certification card. Existing
markup already iterates `boardCertifications`, so the second card needs no new
template.

**The Chinese pages will leak English unless three lookup tables are extended.**
`practiceLocalized` in `locales.ts` translates board names, specialties and
certification status through per-locale maps that currently hold exactly one
entry each — `'American Board of Family Medicine'`, `'Family Medicine'` and
`'Certified'`. Adding ABP without adding
`'American Board of Pathology'` and
`'Anatomic Pathology & Clinical Pathology'` to both Chinese locales makes
`getPracticeLocalized` fall through to English, putting an English board name in
the middle of a Chinese page. That is the failure recorded in
`docs/solutions/logic-errors/shared-data-module-locale-strings.md`, and
`tests/i18n/locale-coverage.test.ts` is written to catch it.

**Files:** `practice.ts`, `about.astro` (+ `zh-hans`, `zh-hant`), `locales.ts`.

### 3. Patient scope — the highest-value item in the batch

Nothing on the site currently states who the practice does and does not see. A
clearly-marked block on `services.astro` and `new-patients.astro`, in all three
locales:

- Adults 18 and older, and seniors 65 and older.
- **Not** patients under 18.
- **No** gynaecology or obstetrics.
- Specialist referrals when indicated; prior authorisation may be required.
- Accepting new patients (already true in data, not stated this plainly).

Stem cell therapy gains **"by appointment only"**. That is scheduling
information, not a benefit, indication, success-rate or safety claim, so it does
not breach the placeholder rule in `CLAUDE.md`.

**Files:** `services.astro` (×3), `new-patients.astro`, `locales.ts`.

### 4. Insurance

Replace the call-to-confirm-only copy with the owner-supplied plan types:
Original Medicare (red-and-blue card), Medi-Cal (white card), HMO, PPO, private
insurance, and cash — each under a heading stating that the office confirms your
specific plan is contracted before the visit.

**Why the qualifier is not optional:** "HMO" and "PPO" name plan structures, not
networks. A patient whose HMO has no contract with this practice would otherwise
read the page as a yes and be turned away at the desk. That is the same harm the
fabricated carrier list could have caused.

The existing removal comment in `insurance.astro` is **updated, not deleted**,
to record that the plan types were supplied in writing by the owner on
2026-08-06 — so the next person auditing the file does not read this as the
fabricated list creeping back. The prohibition on naming carriers and on "most
major plans" phrasing stands.

**Files:** `insurance.astro` (×3), `locales.ts`.

### 5. Biography

Adds to the About page, all three locales: raised in Tainan, Taiwan; married Min
Mey Chang in 1968; came to the United States in 1969; founding **president** of
the Arcadia Chinese Association, 1982–1990 (the page currently records the 1982
founding but not the presidency term).

Already live and needing no change: Garfield Medical Center (chair of family
practice, chief of staff, governing board), the NTU alumni association
presidencies and the 2001 Disneyland event, *Endless Talk* (2023), the ACA
founding with Min Mey Chang, both council terms, the April–July 2003 rotating
mayoralty, the library renovation, the police headquarters, NTU 1967, and
accepting new patients.

**Not published:** three sons and three grandsons. They have not consented to
appearing on a public, indexed medical practice site.

### 6. Arcadia archive photograph — blocked

The owner asked for
`arcadiahistory.andornot.net/media/Images/1475.jpg` on the About page near
Community & Public Service. **It cannot be embedded**, for two independent
reasons.

**Technical.** Response headers pulled 2026-08-06:

```
cross-origin-resource-policy: same-origin
x-frame-options: SAMEORIGIN
cf-mitigated: challenge            → HTTP/2 403
```

`cross-origin-resource-policy: same-origin` instructs the browser to refuse to
render the image on any other origin. An `<img>` on shengchangmd.com would break
for every visitor. An iframe is ruled out by `x-frame-options`. Direct fetches
are Cloudflare-challenged.

**Licensing.** The Arcadia History Collection prohibits reproducing its items in
any form without written permission. Displaying the image on our page is
reproduction whether the bytes are served from our host or theirs.

**Also unknown:** what photograph `1475` actually is. The URL carries a media id,
not a catalogue record id, so it does not necessarily correspond to
`photographs1475`. No caption should be written for an unseen image.

**Resolution:** a permission request to `ref247@ArcadiaCA.gov` has been drafted
for the owner to send, naming `photographs1491`, `photographs1513` and
`photographs1524`, asking what media `1475` is, and disclosing plainly that the
destination is a commercial practice website. Until permission arrives, the page
continues to deep-link records and display no archive image. The draft is
deliberately **not** committed to this repository, which is public.

The standing rule is unchanged: **link individual permalinks, never the
collection's search results.**

## Sequencing

Four pull requests. Hours ships first and alone.

1. **Hours.** The correction, the de-duplication, the `/hours/` contradictions,
   and the new digit-matching test. Alone, so a patient-facing fix is not buried
   in a content drop.
2. **Credentials.** Licence, ABP, postgraduate training.
3. **Patient scope and insurance.** The scope limits and the coverage types.
4. **Biography.** Tainan, marriage, ACA presidency.

## Verification required before any PR merges

- `npx tsc --noEmit`, then `npm test`, then
  `ALLOW_INDEXING=true npm run build` — plain `npm run build` fails by design.
- Every new brand-coloured utility class checked against the theme-token map in
  `global.css`, **including `hover:`/`focus:` forms**, per `CLAUDE.md`.
- Every new string present in all three locales, with the Chinese values not
  byte-identical to English.
- Hours confirmed rendering as 1:00 PM on `/hours/`, `/location/`, `/contact/`,
  `/services/`, `/insurance/` and the footer, in all three locales.

## Open items this design does not resolve

- The Ph.D.'s institution, field and year remain unknown. The owner's own
  detailed credentials list in this batch names ABFM, ABP and the NTU medical
  degree, and does **not** mention a doctorate. Raised with the site owner on
  2026-08-06; he chose to leave it in place, as confirmed on 2026-08-05.
- Stem cell specifics — product, indications, regulatory basis — still not
  supplied. Copy stays a placeholder.
- Medical-legal report scope still unconfirmed beyond "general".
- Any Wake Forest connection. Still nothing found.
- Whether `A 33409` should be verified against the Medical Board of California
  licence lookup. It is now double-sourced, so this is corroboration rather than
  a blocker.
