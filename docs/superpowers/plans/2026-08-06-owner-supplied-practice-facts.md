# Owner-Supplied Practice Facts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the practice facts supplied by the owner on 2026-08-06 — corrected office hours, restored licence and pathology credentials, patient scope limits, accepted coverage types, and biography additions — across all three locales, while removing the fact duplication that makes such corrections propagate incompletely.

**Architecture:** `src/data/practice.ts` stays the single source of truth for facts; `src/i18n/locales.ts` holds only translations of those facts, never restatements. Each phase is one pull request, merged before the next begins. Phase 1 ships alone because it corrects information a patient acts on.

**Tech Stack:** Astro 5 (static), TypeScript, Tailwind v4 via `@tailwindcss/vite`, Vitest.

## Status as of 2026-08-07

| Phase | State |
|---|---|
| 1 — Office hours | **Shipped and live.** PR #16. Verified on production: `/hours/` reads 9:00 AM – 1:00 PM, homepage JSON-LD carries `"closes":"13:00"`, both Chinese location pages read 下午1:00. |
| 2 — Credentials | **Not started.** Licence `A 33409`, ABP certification, Alabama pathology residency. |
| 3 — Patient scope and insurance | **Not started.** The highest-value item in the batch: the site still says nothing about adults only, no patients under 18, no gynaecology or obstetrics. |
| 4 — Biography | **Not started.** Tainan, the 1968 marriage, arrival in the USA in 1969, ACA founding presidency 1982–1990. |

Phase 1 cost ten commits for one number, three of them fixing guards written
during the correction. The hours turned out to be stored in **seven** places,
not the five this plan originally counted — the two extra were 24-hour literals
in `JsonLd.astro`, invisible to an AM/PM-shaped guard and read by Google rather
than by patients. Full write-up:
[`docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md`](../../solutions/logic-errors/green-checks-that-cannot-see-the-defect.md).

Two things landed that this plan did not anticipate, both merged: six English
accessibility labels were translated across all 12 Chinese pages (PR #17), and
`getTranslation`'s `||` fallback was fixed so an empty locale value no longer
renders as its own key (PR #22). The test count is now **70**, not the 61 this
plan assumed; adjust the expected numbers in Phases 2–4 accordingly.

## Global Constraints

Copied verbatim from `docs/superpowers/specs/2026-08-06-owner-supplied-practice-facts-design.md` and `CLAUDE.md`. Every task's requirements include this section.

- **Office hours are `Monday–Friday 9:00 AM – 1:00 PM`.** Not 12:00 PM, not 6:00 PM.
- **Never interpolate `practice.*` directly into a `zh-hans`/`zh-hant` page or a shared component.** Route through `getPracticeLocalized()` or `getTranslation()`. Those fields are English strings.
- **Never hardcode `black`, `white`, `#000`, `#fff`, or a Tailwind palette colour class** on a branded surface. Before using a brand-coloured utility, confirm it is on the map in `src/styles/global.css`, **including its `hover:`/`focus:` forms**.
- **`npm run build` fails locally by design.** Always run `ALLOW_INDEXING=true npm run build`.
- **Never invent factual content.** Where a fact is unverified, say so in a code comment rather than presenting it as sourced.
- **Do not name insurance carriers, and do not use "most major plans" phrasing.** Plan *types* only.
- **Do not expand the stem cell copy** beyond scheduling information. No benefit, indication, success-rate or safety claim.
- **Link Arcadia History Collection individual permalinks only, never the search results.** Do not copy its images into `public/`.
- **Chinese locale values must not be byte-identical to their English counterparts** — `tests/i18n/locale-coverage.test.ts` fails on that.
- Commit message trailers, on every commit:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RY69z81XjvGdp2us3hWzdg
  ```

---

## File Structure

| File | Responsibility | Phases |
|---|---|---|
| `src/data/practice.ts` | Single source of truth for every practice fact | 1, 2, 3 |
| `src/i18n/locales.ts` | UI strings + Chinese translations of `practice.ts` values. Never restates an English fact. | 1, 2, 3, 4 |
| `src/pages/hours.astro` | `/hours/` page. Currently holds three defects. | 1 |
| `src/pages/insurance.astro` | English insurance page | 1, 3 |
| `src/pages/{zh-hans,zh-hant}/insurance.astro` | Chinese insurance pages | 3 |
| `src/pages/services.astro` + both Chinese copies | Service descriptions and patient scope | 3 |
| `src/pages/new-patients.astro` | English-only new-patient page | 3 |
| `src/pages/about.astro` + both Chinese copies | Biography, credentials, board certifications | 2, 4 |
| `tests/data/source-integrity.test.ts` | Guards against facts stored twice | 1 |

---

# PHASE 1 — Office hours (PR 1, ships alone)

Branch: `fix-office-hours`

Corrects the hours, collapses five copies of the fact to one English source plus two translations, fixes the `/hours/` self-contradiction, and adds a test so the next correction cannot land partially.

### Task 1: Guard the hours against duplication and locale drift

**Files:**
- Modify: `tests/data/source-integrity.test.ts` (append a new `describe` block after the block ending at line 79)

**Interfaces:**
- Consumes: `practice.hours.weekday` from `@data/practice`; `translations` from `@i18n/locales`; the existing `FILES`, `rel`, `code` helpers already defined at lines 31–41 of the test file.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Append to `tests/data/source-integrity.test.ts`:

```typescript
describe('office hours are stored once and translated, never restated', () => {
  const DATA_FILE = 'data/practice.ts';

  /** Every run of digits, in order: '9:00 AM – 1:00 PM' -> ['9','00','1','00'] */
  const clockDigits = (s: string) => s.match(/\d+/g) ?? [];

  it('no file other than practice.ts hardcodes the opening times', () => {
    // Shipped: the same weekday hours lived in practice.ts, in locales.ts (en),
    // and as a bare literal in hours.astro. Three English copies of one fact.
    // The scaffold said 9:00 AM - 6:00 PM, it was corrected to 12:00 PM, and the
    // owner then confirmed the real hours are 1:00 PM. Each correction had to
    // find every copy, and the /hours/ page was missed.
    const times = clockDigits(practice.hours.weekday).join(':');
    const offenders = FILES.filter((f) => {
      if (rel(f) === DATA_FILE) return false;
      const c = code(f);
      // Only flag Latin-script clock times; Chinese locale strings are
      // translations of this fact and are checked separately below.
      return /\d{1,2}:\d{2}\s*(AM|PM)/i.test(c) && clockDigits(c).join(':').includes(times);
    });
    expect(offenders.map(rel), 'hardcodes the weekday hours').toEqual([]);
  });

  it('every locale states the same clock times as practice.ts', () => {
    // A Chinese translation is not a duplicate fact, but it can still drift.
    // Comparing digits rather than text lets the wording differ while the times
    // cannot: '上午9:00 – 下午1:00' and 'Monday–Friday 9:00 AM – 1:00 PM' both
    // yield ['9','00','1','00'].
    const expected = clockDigits(practice.hours.weekday);
    expect(expected.length, 'practice.hours.weekday states no times').toBeGreaterThan(0);

    for (const [locale, t] of Object.entries(translations)) {
      expect(clockDigits((t as { hoursWeekday: string }).hoursWeekday), `${locale}.hoursWeekday`)
        .toEqual(expected);
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails for the right reason**

Run: `npx vitest run tests/data/source-integrity.test.ts -t "office hours"`

Expected: **both** tests FAIL.
- "no file other than practice.ts hardcodes the opening times" fails listing `pages/hours.astro` and `i18n/locales.ts`.
- "every locale states the same clock times" — this one may PASS right now, because all five copies currently agree on 12:00. That is expected and is why Task 2 comes next: it is the test that will catch a *partial* fix.

If the first test does not list both files, stop — the helper is not matching and the test is worthless.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/data/source-integrity.test.ts
git commit -m "test: guard office hours against duplication and locale drift

Fails today: hours.astro and locales.ts both restate the weekday opening
times that practice.ts already owns."
```

### Task 2: Make `practice.ts` the only English source of the hours

**Files:**
- Modify: `src/data/practice.ts:130`
- Modify: `src/i18n/locales.ts` — add an import at the top of the file, change line 64
- Test: `tests/data/source-integrity.test.ts` (from Task 1)

**Interfaces:**
- Consumes: `practice.hours.weekday`.
- Produces: `translations.en.hoursWeekday` becomes a derived value, not a literal. Every later phase reads it through `getTranslation`, unchanged.

- [ ] **Step 1: Correct the fact in `practice.ts`**

At `src/data/practice.ts:130`, change:

```typescript
    weekday: 'Monday–Friday 9:00 AM – 12:00 PM',
```

to:

```typescript
    // 9:00 AM – 1:00 PM confirmed by the practice owner 2026-08-06. This is the
    // only English copy: locales.ts derives its `en` value from here, and
    // tests/data/source-integrity.test.ts fails if any other file states it.
    weekday: 'Monday–Friday 9:00 AM – 1:00 PM',
```

- [ ] **Step 2: Derive the English locale value**

`src/i18n/locales.ts` currently has **no imports**. Add one as the first line of the file:

```typescript
import { practice } from '@data/practice';
```

`practice.ts` imports nothing, so this introduces no cycle.

Then change line 64 from:

```typescript
    hoursWeekday: 'Monday–Friday 9:00 AM – 12:00 PM',
```

to:

```typescript
    hoursWeekday: practice.hours.weekday,
```

- [ ] **Step 3: Translate, do not copy, for both Chinese locales**

At `src/i18n/locales.ts:104` (zh-hant), change:

```typescript
    hoursWeekday: '週一至週五 上午9:00 – 中午12:00',
```

to:

```typescript
    hoursWeekday: '週一至週五 上午9:00 – 下午1:00',
```

At `src/i18n/locales.ts:144` (zh-hans), change:

```typescript
    hoursWeekday: '周一至周五 上午9:00 – 中午12:00',
```

to:

```typescript
    hoursWeekday: '周一至周五 上午9:00 – 下午1:00',
```

Note the word change: 中午 ("noon") is wrong for 1:00 PM. 下午 ("afternoon") is correct.

- [ ] **Step 4: Run the locale test**

Run: `npx vitest run tests/data/source-integrity.test.ts -t "every locale states"`
Expected: PASS. If a Chinese value was missed, it fails naming that locale.

- [ ] **Step 5: Commit**

```bash
git add src/data/practice.ts src/i18n/locales.ts
git commit -m "fix: office hours are 9-1, and English states them once

The owner confirmed 9:00 AM - 1:00 PM on 2026-08-06; the site said 12:00 PM.
locales.ts now derives its English value from practice.ts instead of restating
it. Both Chinese values corrected, including 中午 (noon) -> 下午 (afternoon),
which would have been wrong for 1:00 PM even with the right digits."
```

### Task 3: Fix the three defects on `/hours/`

**Files:**
- Modify: `src/pages/hours.astro:25-37`

**Interfaces:**
- Consumes: `practice.hours.weekday` and `practice.hours.weekend`, both already imported at `hours.astro:3`.
- Produces: nothing.

The page has three problems: it hardcodes the times (line 28); it says *"Saturday — By appointment"* (lines 30–33) while the footer on the same page says *"Closed Saturday and Sunday"* from `locales.ts:65`; and it tells patients to leave a message *"After 5:00 PM"* (line 36) for an office that closes at 1:00 PM. The owner's batch names no Saturday availability.

- [ ] **Step 1: Replace the hours block**

Replace `src/pages/hours.astro` lines 25–37 with:

```astro
      <div class="hours-list">
        <div class="hours-item">
          <span>{practice.hours.weekday}</span>
        </div>
        <div class="hours-item">
          <span>{practice.hours.weekend}</span>
        </div>
      </div>
      <p class="hours-note">
        If you call when the office is closed, please leave a message. Calls are
        returned the next business day.
      </p>
```

Both strings already carry their own day labels (`Monday–Friday …`, `Closed Saturday and Sunday`), so the separate label column is redundant. The note deliberately states no clock time — that is what made the old copy go stale.

- [ ] **Step 2: Simplify the now-unused two-column rule**

In the `<style>` block, change the `.hours-item` rule from `justify-content: space-between;` to `justify-content: flex-start;` and delete the `.hours-item span:last-child` rule entirely (lines 68–71), which right-aligned the removed second column.

- [ ] **Step 3: Run the duplication test**

Run: `npx vitest run tests/data/source-integrity.test.ts -t "hardcodes the opening times"`
Expected: PASS — `hours.astro` no longer contains a literal clock time.

- [ ] **Step 4: Commit**

```bash
git add src/pages/hours.astro
git commit -m "fix: /hours/ contradicted its own footer and its own opening time

The page body said 'Saturday - By appointment' while the footer rendered on the
same page said 'Closed Saturday and Sunday'. It also told patients to leave a
message 'after 5:00 PM' - a leftover from the scaffold's 9-6 hours - for an
office that closes at 1. Times now come from practice.ts."
```

### Task 4: Fix the doubled day range on the English insurance page

**Files:**
- Modify: `src/pages/insurance.astro:125`

**Interfaces:** none.

`insurance.astro:125` reads `{practice.phone} | Monday–Friday, {practice.hours.weekday}`. Since `practice.hours.weekday` already begins `Monday–Friday`, that line renders **"Monday–Friday, Monday–Friday 9:00 AM – 1:00 PM"**. The two Chinese insurance pages use `getTranslation` and do not have this bug.

- [ ] **Step 1: Remove the redundant label**

Change line 125 from:

```astro
        {practice.phone} | Monday–Friday, {practice.hours.weekday}
```

to:

```astro
        {practice.phone} | {practice.hours.weekday}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/insurance.astro
git commit -m "fix: insurance page printed the day range twice

practice.hours.weekday already starts 'Monday-Friday', so the hardcoded label
in front of it rendered 'Monday-Friday, Monday-Friday 9:00 AM - 1:00 PM'."
```

### Task 5: Verify against the built output, then open the PR

**Files:** none modified.

- [ ] **Step 1: Typecheck and test**

```bash
npx tsc --noEmit && npm test
```
Expected: both clean. `npm test` should now report 63 tests (61 existing + 2 new).

- [ ] **Step 2: Build the way CI does**

```bash
ALLOW_INDEXING=true npm run build
```
Expected: 22 pages, `postbuild` runs `verify-css.mjs` and `verify-build.mjs` clean. Plain `npm run build` fails by design — do not use it.

- [ ] **Step 3: Confirm the corrected time in the built HTML, in all three locales**

```bash
grep -ro "9:00 AM – 1:00 PM" dist/ | wc -l
grep -rlo "12:00 PM" dist/ || echo "no stale English time — good"
grep -rlo "中午12:00" dist/ || echo "no stale Chinese time — good"
grep -c "下午1:00" dist/zh-hant/location/index.html dist/zh-hans/location/index.html
```
Expected: the first count is non-zero; both `grep -rlo` print the "good" message; the last prints `1` for each Chinese location page.

**This is the step that catches a partial fix.** A green test suite is not evidence the rendered page changed.

- [ ] **Step 4: Confirm the two contradictions are gone**

```bash
grep -i "by appointment" dist/hours/index.html || echo "Saturday line gone — good"
grep -i "after 5:00" dist/hours/index.html || echo "5 PM note gone — good"
grep -o "Monday–Friday, Monday–Friday" dist/insurance/index.html || echo "doubled label gone — good"
```
Expected: all three print their "good" message.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin fix-office-hours
gh pr create --title "fix: office hours are 9-1, stored once instead of five times" --body "$(cat <<'EOF'
The practice owner confirmed on 2026-08-06 that the office is open
**9:00 AM to 1:00 PM, Monday to Friday**. The site said 12:00 PM. Patients
reading it would have believed the office closed an hour before it does.

## Why this was easy to get wrong

The same fact was stored in five places, none deriving from another — three of
them English:

- `src/data/practice.ts:130`
- `src/i18n/locales.ts:64` (en), `:104` (zh-hant), `:144` (zh-hans)
- `src/pages/hours.astro:28`, as a bare literal

Git history shows the scaffold shipped `9:00 AM – 6:00 PM`, later corrected to
12:00 PM. The hours have now been wrong at least twice, and the duplication is
why a correction lands partially. `locales.ts` now derives its English value
from `practice.ts`; the two Chinese values stay hand-authored because they are
translations, and a new test asserts their clock digits match the source.

## Two further defects found on /hours/

That page is linked from the main nav and from the location page.

1. It **contradicted its own footer**: the body said "Saturday — By appointment"
   while the footer rendered on the same page said "Closed Saturday and Sunday".
   The owner's batch names no Saturday availability, so the Saturday line is
   gone.
2. It told patients to leave a message **"after 5:00 PM"** — vestigial from the
   9–6 scaffold. Replaced with wording that states no time and cannot go stale.

## And one on the insurance page

`insurance.astro:125` printed the day range twice —
"Monday–Friday, Monday–Friday 9:00 AM – 12:00 PM" — because
`practice.hours.weekday` already begins with the day range. English only; the
Chinese pages use `getTranslation` and were unaffected.

## Verified

- `npx tsc --noEmit` and `npm test` clean, 63 tests.
- `ALLOW_INDEXING=true npm run build` clean through `verify-css` and
  `verify-build`.
- Built HTML checked directly: no `12:00 PM` or `中午12:00` remains in `dist/`,
  `下午1:00` present on both Chinese location pages, and all three removed
  strings confirmed absent from the built pages.

## Still needs confirmation

Nothing in this PR. Hours are owner-supplied and unambiguous.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01RY69z81XjvGdp2us3hWzdg
EOF
)"
```

- [ ] **Step 6: Merge and confirm the deploy**

```bash
gh pr merge --merge --delete-branch
gh run watch
```
Then load https://shengchangmd.com/hours/ and confirm it reads 1:00 PM. Deploy success is not the same as the page being right.

---

# PHASE 2 — Credentials (PR 2)

Branch: `restore-licence-and-pathology`

Restores the California licence number and the American Board of Pathology certification, both removed on 2026-08-05 at the owner's request and re-supplied by him on 2026-08-06, plus the postgraduate training that pathology's removal had been blocking.

### Task 6: Restore the data in `practice.ts`

**Files:**
- Modify: `src/data/practice.ts` — the `PracticeInfo` interface (lines 35–67), the removal comment (lines 69–106), and the exported object (lines 121–158)

**Interfaces:**
- Produces: `practice.medicalLicenseNumber: string`, `practice.medicalLicenseStatus: string`, `practice.education.postgraduateTraining: string[]`, and a second entry in `practice.boardCertifications`. Tasks 7 and 8 render these.

- [ ] **Step 1: Extend the interface**

In `interface PracticeInfo`, after `credentials: string;` add:

```typescript
  /** California licence. Restored 2026-08-06; see the comment block below. */
  medicalLicenseNumber: string;
  medicalLicenseStatus: string;
```

and change the `education` member to:

```typescript
  education: {
    medicalDegree: string;
    school: string;
    year: number;
    /** Each entry is one appointment, most recent last. */
    postgraduateTraining: string[];
  };
```

- [ ] **Step 2: Add the values**

In the exported `practice` object, after `credentials`, add:

```typescript
  medicalLicenseNumber: 'A 33409',
  medicalLicenseStatus: 'Active',
```

Extend `education` with:

```typescript
    postgraduateTraining: [
      'Transitional Year internship, University of Chicago (NorthShore), 1969–1970',
      'Residency in Anatomic and Clinical Pathology, University of Alabama Medical Center, 1970–1973',
    ],
```

Add the second board certification to `boardCertifications`:

```typescript
    {
      board: 'American Board of Pathology',
      // NOT independently verified. This specialty label comes from the
      // original scaffold, which is known to contain fabricated content
      // (see CLAUDE.md). The owner's 2026-08-06 message says only
      // "American Board of Pathology (ABP)". The 1973 date IS corroborated:
      // Dr. Chang's Doximity profile puts his pathology residency at
      // 1970–1973. Confirm the exact specialty wording with him.
      specialty: 'Anatomic Pathology & Clinical Pathology',
      firstCertified: 1973,
      currentStatus: 'Certified',
      // Lifetime certificate. ABP did not issue time-limited certificates
      // until 2006, so there is no maintenance cycle for a 1973 certification.
      maintenanceRequired: false,
    },
```

- [ ] **Step 3: Rewrite the removal comment so it stays accurate**

The comment block at lines 69–106 says these fields were removed. That is now half-wrong and will mislead the next reader. Replace its opening paragraph with:

```typescript
/*
  Removed 2026-08-05 at the owner's request, then PARTIALLY RESTORED on
  2026-08-06 when he supplied the same facts again. Recorded here so neither the
  removal nor the restoration reads as an accident:

  RESTORED 2026-08-06 — the licence number, the American Board of Pathology
  certification, and the postgraduate training below. All three are now live.

  STILL REMOVED, deliberately:
  - `licenseExpiresDate` ('July 31, 2028'). A published expiry date goes stale
    silently and nobody will be watching the site the day it does.
  - `hospitalAffiliations` (San Gabriel Valley Medical Center, College Hospital
    Costa Mesa).

  `licenseIssuedDate` was 'February 13, 1979'. It stays unpublished but is
  preserved here: it is the best evidence for when Dr. Chang began practising in
  California, and it is why the site says 1979 rather than the 1997 his own bio
  text gives.
*/
```

Then delete the now-obsolete "POSTGRADUATE TRAINING — deliberately not rendered" paragraph, since it *is* now rendered, but **keep** the Doximity citation and the false-Alabama-claim history by folding them into a short note above `postgraduateTraining`:

```typescript
    // Source: Dr. Chang's Doximity profile
    // (https://www.doximity.com/pub/sheng-chang-md). The site previously
    // claimed "three years of postgraduate training in family medicine and
    // internal medicine at University of Alabama Hospital" — the "family
    // medicine and internal medicine" part was false. It was a pathology
    // residency, and it is labelled as one here.
```

Keep the UNRESOLVED Wake Forest paragraph exactly as it is.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. If `about.astro` errors on `postgraduateTraining`, that is Task 7's job — note it and continue.

- [ ] **Step 5: Commit**

```bash
git add src/data/practice.ts
git commit -m "data: restore licence A 33409, ABP certification and pathology training

All three were removed 2026-08-05 at the owner's request and re-supplied by him
on 2026-08-06. A 33409 is now double-sourced: the original scaffold and the
owner independently. The ABP specialty wording is scaffold-derived and flagged
as unverified in a comment; the 1973 date is corroborated by Doximity residency
dates. Licence expiry stays off - a published expiry date goes stale silently."
```

### Task 7: Add the Chinese lookups before rendering anything

**Files:**
- Modify: `src/i18n/locales.ts` — `practiceLocalized`, lines 197–233, and the comment at 179–196

**Interfaces:**
- Consumes: the English strings added in Task 6.
- Produces: `boards['American Board of Pathology']`, `specialties['Anatomic Pathology & Clinical Pathology']`, and `licenseStatus` maps in all three locales.

**Do this task before Task 8.** `getPracticeLocalized` falls back to English on a missing key, so rendering first would put English board names mid-sentence on the Chinese About pages — the failure recorded in `docs/solutions/logic-errors/shared-data-module-locale-strings.md`.

- [ ] **Step 1: Extend all three locale blocks**

In `practiceLocalized.en`, add to `specialties` and `boards`, and add a new `licenseStatus` map:

```typescript
    specialties: {
      'Family Medicine': 'Family Medicine',
      'Anatomic Pathology & Clinical Pathology': 'Anatomic Pathology & Clinical Pathology',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': 'American Board of Family Medicine',
      'American Board of Pathology': 'American Board of Pathology',
    } as Record<string, string>,
    certStatus: { Certified: 'Certified' } as Record<string, string>,
    licenseStatus: { Active: 'Active' } as Record<string, string>,
```

In `practiceLocalized['zh-hant']`:

```typescript
    specialties: {
      'Family Medicine': '家庭醫學',
      'Anatomic Pathology & Clinical Pathology': '解剖病理學與臨床病理學',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': '美國家庭醫學專科委員會',
      'American Board of Pathology': '美國病理學專科委員會',
    } as Record<string, string>,
    certStatus: { Certified: '認證有效' } as Record<string, string>,
    licenseStatus: { Active: '有效' } as Record<string, string>,
```

In `practiceLocalized['zh-hans']`:

```typescript
    specialties: {
      'Family Medicine': '家庭医学',
      'Anatomic Pathology & Clinical Pathology': '解剖病理学与临床病理学',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': '美国家庭医学专科委员会',
      'American Board of Pathology': '美国病理学专科委员会',
    } as Record<string, string>,
    certStatus: { Certified: '认证有效' } as Record<string, string>,
    licenseStatus: { Active: '有效' } as Record<string, string>,
```

- [ ] **Step 2: Update the "deliberately NOT localised" comment**

At lines 193–195 it says entries for `licenseStatus`, `licenseExpires` and `postgraduateTraining` were removed. Replace that paragraph with:

```
  `licenseStatus` was restored 2026-08-06 alongside the source field in
  practice.ts. `licenseExpires` stays removed. `postgraduateTraining` is
  rendered in English on the Chinese pages for now — institution names
  ("University of Alabama Medical Center") have no established Chinese form
  here, and inventing one would be worse than leaving it. Revisit with a
  fluent reader.
```

- [ ] **Step 3: Run the locale tests**

Run: `npx vitest run tests/i18n/locale-coverage.test.ts`
Expected: PASS. This suite fails if a `practiceLocalized` value has no counterpart in a Chinese locale, or if a Chinese value is byte-identical to English.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales.ts
git commit -m "i18n: translate the pathology board, specialty and licence status

Added before anything renders them. getPracticeLocalized falls back to English
on a missing key, so rendering first would have put an English board name mid-
sentence on both Chinese About pages."
```

### Task 8: Render the licence and both certifications

**Files:**
- Modify: `src/pages/about.astro` — the Credentials grid at lines 116–146 and the Board Certifications section at 150–192
- Modify: `src/pages/zh-hant/about.astro`, `src/pages/zh-hans/about.astro` — the equivalent sections

**Interfaces:**
- Consumes: `practice.medicalLicenseNumber`, `practice.medicalLicenseStatus`, `practice.education.postgraduateTraining`, `practice.boardCertifications`, and `getPracticeLocalized(locale).licenseStatus` / `.boards` / `.specialties`.

- [ ] **Step 1: Add a licence card to the English credentials grid**

The grid at `about.astro:116` is `grid-cols-1 md:grid-cols-2`. Add a third card after the Languages card. Use only `bg-gray-50`, `border-gray-200`, `text-gray-900`, `text-gray-700`, `text-gray-600` — the neutral classes the two existing cards already use, which are on the theme-token map. **Do not introduce a `primary-*` class here** without checking `global.css` first.

```astro
        {/* Medical Licence */}
        <div class="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <h3 class="font-serif text-xl font-bold mb-4 text-gray-900">
            California Medical Licence
          </h3>
          <p class="text-gray-700 mb-2">
            <span class="font-semibold">{practice.medicalLicenseNumber}</span>
          </p>
          <p class="text-gray-600 text-sm">
            {practice.medicalLicenseStatus}
          </p>
        </div>
```

- [ ] **Step 2: Add postgraduate training to the Medical Degree card**

Inside the existing Medical Degree card, after the "Graduated {year}" paragraph:

```astro
          <ul class="mt-4 space-y-2 border-t border-gray-200 pt-4">
            {practice.education.postgraduateTraining.map((t) => (
              <li class="text-gray-600 text-sm">{t}</li>
            ))}
          </ul>
```

- [ ] **Step 3: Widen the certifications grid**

`about.astro:157` reads `grid grid-cols-1 gap-8 max-w-md mx-auto` — sized for one card. With two certifications, change to:

```astro
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
```

The `.map` over `boardCertifications` already handles the second entry; no other template change is needed. Also change the heading at line 154 from `Board Certification` to `Board Certifications`.

- [ ] **Step 4: Mirror all three changes onto both Chinese About pages**

Apply the same three edits to `src/pages/zh-hant/about.astro` and `src/pages/zh-hans/about.astro`, with these differences:

- Read the localised values, never `practice.*` directly, for the status/board/specialty strings — e.g. `pl.licenseStatus[practice.medicalLicenseStatus] ?? practice.medicalLicenseStatus`, matching whatever pattern those files already use for `certStatus`. **Read the surrounding code first and follow it.**
- Headings in Chinese: 加州醫師執照 / 加州医师执照 for the licence card; pluralise the certifications heading to match local usage.
- `practice.medicalLicenseNumber` renders as-is in every locale — it is an identifier, like the I-693 and N-648 form numbers.

- [ ] **Step 5: Verify in the built output, both themes**

```bash
ALLOW_INDEXING=true npm run build
grep -c "A 33409" dist/about/index.html dist/zh-hant/about/index.html dist/zh-hans/about/index.html
grep -o "美國病理學專科委員會" dist/zh-hant/about/index.html
grep -o "American Board of Pathology" dist/zh-hant/about/index.html && echo "LEAK: English board name on a Chinese page"
```
Expected: `1` for each of the three About pages; the Traditional Chinese board name present; **no** English leak. The last line must print nothing before the `&&`.

- [ ] **Step 6: Check the rendered page in both themes**

Run `npm run dev`, open http://localhost:3120/about/, and toggle the theme. Confirm the new licence card and the second certification card are legible in **both** light and dark, and hover any link inside them. A screenshot in one theme is not evidence — this repo has shipped four separate contrast defects of exactly that kind.

- [ ] **Step 7: Commit, push, PR, merge**

```bash
git add src/pages/about.astro src/pages/zh-hant/about.astro src/pages/zh-hans/about.astro
git commit -m "about: show the licence, both board certifications and the training"
git push -u origin restore-licence-and-pathology
```

PR body must state: what was restored and why (owner re-supplied on 2026-08-06 after asking for removal on 2026-08-05), that the ABP **specialty wording is unverified** and needs his confirmation, that the licence **expiry is deliberately omitted**, and that both themes were checked.

---

# PHASE 3 — Patient scope and insurance (PR 3)

Branch: `patient-scope-and-coverage`

The highest-value content in the batch: the site currently says nothing about who the practice does and does not see.

### Task 9: Add scope and coverage strings to all three locales

**Files:**
- Modify: `src/i18n/locales.ts` — add a `patientScope` and a `coverage` block to each of the three `translations` locales

**Interfaces:**
- Produces: `translations.<locale>.patientScope.{heading,adults,seniors,noMinors,noObGyn,referrals}` and `translations.<locale>.coverage.{heading,confirmNote,medicare,mediCal,hmo,ppo,privateInsurance,cash}`, read via `getTranslation('<locale>', 'patientScope.adults')` etc.

**A key defined here must be read by a page.** `tests/data/source-integrity.test.ts` encodes that rule for `serviceCards` because fifteen tests once asserted labels no page rendered. Add the strings and the markup in the same PR.

- [ ] **Step 1: Add the English strings**

Into `translations.en`, after `serviceCards`:

```typescript
    patientScope: {
      heading: 'Who we see',
      adults: 'Adults aged 18 and over',
      seniors: 'Seniors aged 65 and over',
      noMinors: 'We do not see patients under 18. Please ask us and we will point you to a paediatric practice.',
      noObGyn: 'We do not provide gynaecology or obstetric care.',
      referrals: 'We refer to specialists where it is indicated. Some referrals need prior authorisation from your plan, and we will tell you if yours does.',
    },
    coverage: {
      heading: 'Coverage we work with',
      confirmNote: 'Plan names are not the whole picture — whether your particular plan is contracted with this office depends on the network. Call before your visit with your card to hand and we will confirm it and tell you what you will pay.',
      medicare: 'Medicare (the red, white and blue card)',
      mediCal: 'Medi-Cal (the white card)',
      hmo: 'HMO plans',
      ppo: 'PPO plans',
      privateInsurance: 'Private insurance',
      cash: 'Cash and self-pay',
    },
```

- [ ] **Step 2: Add the Traditional Chinese strings**

Into `translations['zh-hant']`, same keys:

```typescript
    patientScope: {
      heading: '看診對象',
      adults: '18 歲以上成人',
      seniors: '65 歲以上長者',
      noMinors: '本診所不看 18 歲以下患者。歡迎來電，我們可為您介紹兒科診所。',
      noObGyn: '本診所不提供婦科及產科服務。',
      referrals: '如有需要，我們會轉介專科醫師。部分轉介需保險公司事先核准，屆時我們會告知您。',
    },
    coverage: {
      heading: '合作的保險與付款方式',
      confirmNote: '保險名稱並非全部——您的保險方案是否與本診所簽約，取決於網絡內容。就診前請攜保險卡來電，我們會為您確認並說明費用。',
      medicare: 'Medicare（紅白藍卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保險',
      ppo: 'PPO 保險',
      privateInsurance: '私人保險',
      cash: '現金自費',
    },
```

- [ ] **Step 3: Add the Simplified Chinese strings**

Into `translations['zh-hans']`, same keys:

```typescript
    patientScope: {
      heading: '就诊对象',
      adults: '18 岁以上成人',
      seniors: '65 岁以上长者',
      noMinors: '本诊所不接诊 18 岁以下患者。欢迎来电，我们可为您介绍儿科诊所。',
      noObGyn: '本诊所不提供妇科及产科服务。',
      referrals: '如有需要，我们会转介专科医师。部分转介需保险公司事先核准，届时我们会告知您。',
    },
    coverage: {
      heading: '合作的保险与付款方式',
      confirmNote: '保险名称并非全部——您的保险方案是否与本诊所签约，取决于网络内容。就诊前请携保险卡来电，我们会为您确认并说明费用。',
      medicare: 'Medicare（红白蓝卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保险',
      ppo: 'PPO 保险',
      privateInsurance: '私人保险',
      cash: '现金自费',
    },
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit && npm test
git add src/i18n/locales.ts
git commit -m "i18n: add patient scope and coverage strings in all three locales"
```

### Task 10: Render patient scope on the services pages

**Files:**
- Modify: `src/pages/services.astro`, `src/pages/zh-hant/services.astro`, `src/pages/zh-hans/services.astro`
- Modify: `src/pages/new-patients.astro`

**Interfaces:** consumes the `patientScope` keys from Task 9.

- [ ] **Step 1: Add the section to the English services page**

Place it near the top of the page, above the immigration section that begins at `services.astro:34` — a patient needs to learn the practice does not see their child before reading three service descriptions. Use only neutral utility classes (`bg-gray-50`, `border-gray-200`, `text-gray-900`, `text-gray-700`). **If you reach for any `primary-*` class, first confirm it and its `hover:` form are on the map in `src/styles/global.css`** — `tests/styles/theme-token-coverage.test.ts` will fail the build otherwise, which is the intended outcome.

```astro
  {/* Who we see — scope limits supplied by the practice owner 2026-08-06 */}
  <section class="py-12 bg-gray-50 border-b border-gray-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="max-w-3xl mx-auto">
        <h2 class="font-serif text-2xl md:text-3xl font-bold mb-6 text-gray-900">
          Who we see
        </h2>
        <ul class="space-y-3 text-gray-700">
          <li>Adults aged 18 and over</li>
          <li>Seniors aged 65 and over</li>
          <li>We do not see patients under 18. Please ask us and we will point you to a paediatric practice.</li>
          <li>We do not provide gynaecology or obstetric care.</li>
        </ul>
        <p class="mt-6 text-gray-700">
          We refer to specialists where it is indicated. Some referrals need prior authorisation from your plan, and we will tell you if yours does.
        </p>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Add the same section to both Chinese services pages**

Same markup and placement, with every string read through `getTranslation('zh-hant', 'patientScope.adults')` and so on. Both files already import `getTranslation` (line 233 uses it), so no new import is needed. **Never interpolate `practice.*` or an English literal into these files.**

- [ ] **Step 3: Add a condensed version to `new-patients.astro`**

This page is English-only. Add the same four bullets under a "Who we see" heading, following whatever section markup that file already uses — read it first.

- [ ] **Step 4: Add "by appointment only" to the stem cell section**

In `services.astro`, inside the stem cell section that begins at line 175, add one sentence: `Stem cell therapy is by appointment only.` Mirror it into both Chinese services pages via a locale key.

**Do not add anything else to this section.** It is a deliberate placeholder that asserts no benefit, indication, success rate or safety claim, and the `{/* PLACEHOLDER */}` comment above it explains why. Scheduling information does not breach that; anything about what the treatment does would.

- [ ] **Step 5: Build and verify the scope text reaches all three locales**

```bash
ALLOW_INDEXING=true npm run build
grep -c "under 18" dist/services/index.html dist/new-patients/index.html
grep -c "18 歲以下" dist/zh-hant/services/index.html
grep -c "18 岁以下" dist/zh-hans/services/index.html
```
Expected: at least `1` from each.

- [ ] **Step 6: Commit**

```bash
git add src/pages/services.astro src/pages/zh-hant/services.astro src/pages/zh-hans/services.astro src/pages/new-patients.astro
git commit -m "services: state who the practice sees, and who it does not

Adults 18+, seniors 65+, no patients under 18, no gynaecology or obstetrics.
Supplied by the owner 2026-08-06. Nothing on the site said any of this, so a
parent could have driven over with a sick child."
```

### Task 11: Publish the coverage types on all three insurance pages

**Files:**
- Modify: `src/pages/insurance.astro`, `src/pages/zh-hant/insurance.astro`, `src/pages/zh-hans/insurance.astro`

**Interfaces:** consumes the `coverage` keys from Task 9.

- [ ] **Step 1: Replace the English "Insurance & Coverage" body**

In `insurance.astro`, keep the first paragraph's spirit but add the list. Every item is qualified by the note; the note is **not optional** and must sit with the list, not below the fold.

```astro
        <h2>Coverage we work with</h2>
        <ul class="coverage-list">
          <li>Medicare (the red, white and blue card)</li>
          <li>Medi-Cal (the white card)</li>
          <li>HMO plans</li>
          <li>PPO plans</li>
          <li>Private insurance</li>
          <li>Cash and self-pay</li>
        </ul>
        <p class="note">
          Plan names are not the whole picture — whether your particular plan is
          contracted with this office depends on the network. Call before your
          visit with your card to hand and we will confirm it and tell you what
          you will pay.
        </p>
```

Keep the existing paragraph about immigration exams, N-648 reports and medical-legal reports often not being covered. That is true and useful.

- [ ] **Step 2: Update the removal comment rather than deleting it**

The comment at `insurance.astro:41-56` explains that a fabricated eight-carrier list was removed. Leaving it unchanged would make this list look like the fabricated one creeping back. Append inside that same comment block:

```
          UPDATE 2026-08-06. The list above is different in kind and is
          published on the owner's written instruction. It names plan TYPES
          (Medicare, Medi-Cal, HMO, PPO, private, cash), not carriers, and every
          item is qualified by a note saying the office confirms whether your
          specific plan is contracted. The prohibition stands: no carrier names,
          no carrier logos, and no "we accept most major plans" phrasing.
```

- [ ] **Step 3: Mirror onto both Chinese insurance pages**

Same structure, strings read via `getTranslation('zh-hant', 'coverage.medicare')` and so on. Both files already import `getTranslation`.

- [ ] **Step 4: Style the list**

Add a `.coverage-list` rule to the `<style is:global>` block in each file. Use `var(--text-strong)` / `var(--text-muted)` and existing tokens. **No literal colours, and no `primary-*` class that is not on the map in `global.css`.**

- [ ] **Step 5: Build, then check both themes**

```bash
ALLOW_INDEXING=true npm run build && npm test
```
Then `npm run dev` and view `/insurance/`, `/zh-hant/insurance/` and `/zh-hans/insurance/` in **both** light and dark, hovering every link. The insurance hero is a branded red/amber surface and has already produced two contrast bugs.

- [ ] **Step 6: Commit, push, PR, merge**

PR body must record that the plan types were owner-supplied in writing on 2026-08-06, that they are types rather than carriers, that the call-to-confirm qualifier is deliberate and load-bearing, and that the carrier-name prohibition still stands.

---

# PHASE 4 — Biography (PR 4)

Branch: `about-early-life-and-aca`

### Task 12: Add the early-life and ACA facts to all three About pages

**Files:**
- Modify: `src/pages/about.astro` — the Professional Background section (lines 36–47) and the Community section (lines 61–67)
- Modify: `src/pages/zh-hant/about.astro`, `src/pages/zh-hans/about.astro`

**Interfaces:** none — prose.

- [ ] **Step 1: Add early life to the English Professional Background section**

Insert as a new first paragraph, before the existing "moved to California in 1979" paragraph:

```astro
          <p class="leading-relaxed">
            Dr. Chang was raised in Tainan, Taiwan, and graduated from National Taiwan University College of Medicine in 1967. He married Min Mey Chang in 1968 and came to the United States in 1969.
          </p>
```

**Publish no number of years in practice.** The owner's text says both "since 1997" and "for 40 years" while also saying he moved to California in 1979; the site uses 1979, backed by his 13 February 1979 licence issue date. 1979 to 2026 is 47 years. Any figure contradicts one of his own statements, so state none.

**Do not mention his sons or grandsons.** They have not consented to appearing on a public, indexed medical site.

- [ ] **Step 2: Add the ACA presidency term**

In the Community section, the existing sentence says he and Min Mey Chang founded the association in 1982. Extend it with the term — keeping the existing `minmeychang.com` link and its `text-primary-700` class exactly as they are, since that class is already on the theme-token map:

```
… founded the Arcadia Chinese Association to help new immigrants — most of them
from Taiwan — who did not yet speak English well. He served as its founding
president from 1982 to 1990.
```

- [ ] **Step 3: Mirror onto both Chinese About pages**

Translate the same two additions. 台南 for Tainan. Use the existing 國立臺灣大學醫學院 / 国立台湾大学医学院 from `practiceLocalized.school` rather than writing the institution name again.

- [ ] **Step 4: Build and verify**

```bash
ALLOW_INDEXING=true npm run build && npm test
grep -c "Tainan" dist/about/index.html
grep -c "台南" dist/zh-hant/about/index.html dist/zh-hans/about/index.html
grep -o "40 years\|since 1997" dist/about/index.html && echo "FAIL: published a contradicted date"
```
Expected: `1` from each of the first two; the last must print nothing before the `&&`.

- [ ] **Step 5: Commit, push, PR, merge**

---

## Post-merge: update the project record

- [ ] Update `CLAUDE.md`: hours are 9–1; the licence and ABP certification are restored and why; the insurance page now lists plan types on written owner instruction, with the carrier prohibition intact; the ABP specialty wording awaits confirmation.
- [ ] Write `docs/solutions/logic-errors/` entry for the five-copy hours defect — it is the same shape as the existing duplicated-facts write-up but the first instance caught by a test rather than by eye.
- [ ] Confirm https://shengchangmd.com/hours/ reads 1:00 PM after the Phase 1 deploy.

## Open items this plan does not resolve

- The ABP specialty wording ("Anatomic Pathology & Clinical Pathology") is scaffold-derived and unverified. Ask Dr. Chang.
- The Ph.D.'s institution, field and year remain unknown. His own 2026-08-06 credentials list names ABFM, ABP and the NTU medical degree, and no doctorate. The owner chose to leave it live.
- Stem cell specifics — product, indications, regulatory basis — still not supplied.
- Medical-legal report scope still unconfirmed beyond "general".
- The Arcadia archive photograph is blocked pending written permission from ref247@ArcadiaCA.gov.
- `postgraduateTraining` renders in English on the Chinese pages. Revisit with a fluent reader.
