---
status: pending
priority: p2
issue_id: 003
tags: [code-review, architecture, i18n, duplicated-facts]
dependencies: []
---

# Owner-supplied patient-scope facts exist in three places, and only Chinese reads the source

## Problem Statement

The patient-scope limits supplied by the practice owner on 2026-08-06 — who the
practice sees, and that it does not see under-18s or provide gynecology or
obstetric care — live in `src/i18n/locales.ts` under `patientScope.*`.

They are **also hardcoded** as literal English sentences in two pages.

This branch sharpened the asymmetry rather than causing it. The new Chinese
pages read `patientScope.*` via `getTranslation`. The English page they mirror
does not. So a correction to the scope limits reaches Traditional and Simplified
Chinese and silently misses English — the indexed locale.

## Findings

Three locations for the same owner-supplied fact:

| Location | Mechanism |
|---|---|
| `src/i18n/locales.ts:71` | the source |
| `src/pages/new-patients.astro:36-39` | hardcoded literals |
| `src/pages/services.astro:47-50` | hardcoded literals |
| `src/pages/zh-han{t,s}/new-patients.astro` | reads the source (added this branch) |
| `src/pages/zh-han{t,s}/services.astro` | reads the source |

**No drift has happened yet.** Checked every `patientScope` key against both
English pages: all byte-identical to `locales.ts` today. This is latent, not
live — which is why it is P2 and not P1.

No guard covers it. `source-integrity.test.ts` asserts every key in a nested
block is *read by at least one page*, and `patientScope` keys are read by the
Chinese pages, so the assertion is satisfied while the English pages carry
independent copies.

This is the defect documented in
`docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md`:
"A fact copied into a second place will drift, and your fix will reach only one
copy." It happened six times in one session on 2026-08-05.

## Proposed Solutions

### Option A — English pages read `patientScope.*` too
Replace the literals in `new-patients.astro` and `services.astro` with
`getTranslation('en', 'patientScope.*')`, matching the Chinese pages.

- Pros: deletes the second and third copies, which is the documented fix —
  "delete the second copy, not remember it". Renders byte-identical output.
- Cons: touches two English pages not otherwise in this branch's scope.
- Effort: Small. Risk: Low — verifiable by diffing built HTML before/after.

### Option B — add a guard asserting the copies match
A test that fails if a hardcoded English sentence diverges from `locales.ts`.

- Pros: no page changes. Cons: keeps three copies and guards the symptom;
  a new copy elsewhere is still invisible. Effort: Small.

### Option C — leave it, document it
- Pros: zero risk now. Cons: the next owner correction reaches Chinese only.
- Effort: None. Risk: Medium, deferred.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/pages/new-patients.astro:34-40`
- `src/pages/services.astro:45-51`
- `src/i18n/locales.ts` `patientScope`

## Acceptance Criteria

- [ ] The scope sentences exist in exactly one place in the repo
- [ ] Built HTML for `/new-patients/` and `/services/` is unchanged
- [ ] Changing the sentence in `locales.ts` changes all six pages

## Work Log

**2026-08-20** — Found during self-review. Verified all copies currently
byte-identical, so latent rather than live.

## Resources

- `docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md`
- Commit `fef0fe7` (added the Chinese pages that read the source)
