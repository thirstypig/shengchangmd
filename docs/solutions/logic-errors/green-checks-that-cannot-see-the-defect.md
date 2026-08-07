---
title: 'Five green checks, five defects they could not see — and why each was green for a different reason'
date: 2026-08-07
category: logic-errors
problem_type: verification_scope_mismatch
component: tests/data/source-integrity.test.ts / tests/i18n/locale-coverage.test.ts / src/i18n/locales.ts / src/components/JsonLd.astro / astro.config.mjs
severity: high
symptoms:
  - 'a test written to guard a duplicated fact passes while the duplicate is still wrong'
  - 'npx tsc --noEmit and npm test are both clean and npm run build fails to load its own config'
  - 'structured data and visible page copy state different times, and the guard for one cannot see the other'
  - 'a locale key renders as its own literal key text on the live page'
  - 'a grep finds a nav component, and the component turns out to be imported by nothing'
  - 'every automated check is green and the built HTML is wrong'
stack:
  - Astro 5
  - TypeScript
  - vitest
  - Vite
time_to_diagnose: 'each one minutes once the built output was read; three of the five would have shipped if a green report had been taken at face value'
recurrence_risk: 'high — every instance here was green, and a green check is the specific thing nobody re-examines'
tags:
  - silent-failure
  - verification-bias
  - test-design
  - entangled-oracle
  - path-aliases
  - structured-data
  - i18n
---

# Five green checks, five defects they could not see

> **Category note.** The obvious category is `test-failures`, and it is wrong:
> **nothing failed.** Every check discussed here passed, on a branch whose
> `npm test` reported 63/63 and whose `npx tsc --noEmit` was clean. Filed under
> `logic-errors` because the defect in each case is a wrong belief encoded in a
> check — about what it covers, what it compares, or whether the code it
> examines runs at all. `integration-issues` is the runner-up for instance 2
> alone, and would have hidden the shared pattern.

Correcting one wrong number — the office closing time, `12:00 PM` → `1:00 PM` —
took ten commits. Three of them were fixes to the guards and instructions
written during the correction, not to the original bug.

Every defect below was live behind a green check. That is the point: a red check
gets investigated. A green one ends the conversation.

## The five

### 1. A guard entangled with the source it validates

The first version of the duplication guard extracted the digits from
`practice.hours.weekday` and flagged any file whose digits contained them:

```ts
const times = clockDigits(practice.hours.weekday).join(':');   // '9:00:1:00'
const offenders = FILES.filter((f) => /* ... */ clockDigits(code(f)).join(':').includes(times));
```

It failed on `hours.astro` and `locales.ts` when written, so it looked like a
working red-to-green test. Then `practice.ts` was corrected to `1:00 PM` — and
the stale `9:00 AM – 12:00 PM` still sitting in `hours.astro` yielded
`9:00:12:00`, which does not contain `9:00:1:00`. **The guard went green because
the copy had drifted.**

This is not a scope problem. Widening it would not have helped. The oracle read
the same mutable source it was meant to validate, so both sides moved together
and no version of that comparison could stay red. It had to be replaced with an
existence check:

```ts
// Any Latin-script clock time in src/ outside practice.ts is a defect, full
// stop. No comparison against the current value.
const offenders = FILES.filter(
  (f) => rel(f) !== DATA_FILE && /\d{1,2}:\d{2}\s*(AM|PM)/i.test(code(f)),
);
```

**A copy is harmless while it agrees and dangerous once it drifts. A guard keyed
to the current value excuses precisely the case it exists to catch.**

### 2. Three resolvers, three green lights, one broken build

`locales.ts` gained `import { practice } from '@data/practice'`. Then:

```
npx tsc --noEmit     → clean
npm test             → 63/63
ALLOW_INDEXING=true npm run build
  → [astro] Unable to load your Astro config
    Cannot find module '@data/practice' imported from src/i18n/locales.ts
```

`tsc` resolves that alias from `tsconfig.json` paths. `vitest` resolves it from
its own alias map. `astro.config.mjs:4` does `import { locales } from
'./src/i18n/locales'` **while Astro is loading its own config** — before Vite
exists, so before any alias is registered. Three resolvers, and the two that
were green never exercise the third.

Fix: a relative import in that one file, with a comment so nobody tidies it back.

**"Typecheck and tests pass" and "it builds" are sentences about different
resolvers.** Anything in `astro.config.mjs`'s import graph must not use aliases.

### 3. A regex that encoded the encoding, not the fact

`JsonLd.astro` hardcoded the hours at two sites, rendered on every page in every
locale by `BaseLayout.astro`:

```astro
opens: '09:00',
closes: '12:00',
```

The guard from instance 1 is shaped `\d{1,2}:\d{2}\s*(AM|PM)`. Twenty-four-hour
time carries no meridiem, so it was structurally invisible.

Had this shipped, the visible pages would have said 1:00 PM while
`openingHoursSpecification` — what Google's hours panel, Apple Maps and voice
assistants read — said noon. **Worse than the original bug**, which at least was
consistently wrong. It reaches people who never load the site.

Found by code review, not by any test. Now guarded separately:

```ts
const offenders = FILES.filter(
  (f) => rel(f) !== DATA_FILE && /\b(opens|closes)\s*:\s*['"`]\d{1,2}:\d{2}/.test(code(f)),
);
```

**Enumerate every textual encoding a fact takes in the codebase — 12-hour,
24-hour, 上午/下午 — and write one assertion per encoding.** Do not generalise
into one clever regex; that is the move that produced the gap.

### 4a. A completeness check scoped to a subset

A new locale key used `''` as its English value so English readers would see no
marker. `npm test` passed — because `locale-coverage.test.ts`'s "no empty or
whitespace-only values" assertion iterates `['zh-hant', 'zh-hans']`. **`en` was
never in scope.** Not a near miss; a design gap.

**When a test iterates a filtered subset, ask whether the invariant is true only
for that subset or for the whole domain.** This one is true for the whole domain.

### 4b. `||` on authored content — a different bug entirely

The empty string then hit `getTranslation`:

```ts
return value || key;        // src/i18n/locales.ts:185
```

`''` is falsy, so the function returned the **key**, and every English page
rendered the literal text `footer.englishOnly` in its footer.

This one is *not* a check-scope failure. No check was pointed at it, narrow or
otherwise. It is a plain coercion bug — the same species as `if (count)`
misfiring on `count === 0` — and filing it with the others would send the next
reader looking for a broader test when the fix is one character.

**Still live.** It was worked around by making the value non-empty, not fixed.
Verified 2026-08-07 by injecting an empty value at runtime: `getTranslation`
returns the key. `??` is the fix.

### 5. A grep proves a string exists, not that the code runs

While writing up instance 1, this document's own author reported that `/hours/`
was "linked from the main nav and from the location page," in a design spec, an
implementation plan, and a merged PR body.

It is not in the nav. `Navigation.astro` and `MobileNav.astro` link home, about,
services, insurance, location and contact. `/hours/` appears in
`PageNav.astro:12` — and **nothing imports `PageNav.astro`**. It is dead code.
`grep -rn "/hours/" src/` found it, and "appears in a file called PageNav" was
read as "is in the nav."

The page is genuinely reachable — `location.astro:73` links it and it is in the
sitemap — so the underlying defect was real. The severity was inflated by a
check that answered "does this string appear" when the question was "does this
code run."

**A grep is an existence proof about text.** For a component, confirm something
imports it. For a route, confirm it appears in `dist/`.

## The three shapes, and why the distinction matters

These are not one pattern. Sorting them changes the fix:

| Shape | Instances | Fix |
|---|---|---|
| **Entangled oracle** — pass/fail computed from the same mutable source being validated | 1 | **Replace.** Widening cannot help; both sides move together. Assert existence or uniqueness, never equality against the current value. |
| **Scope-narrow** — sound within its scope, and the defect lives outside it | 2, 3, 4a, 5 | **Widen** the domain the same check already covers: the other resolver, the other encoding, the other locale, the import graph rather than the text. |
| **Unasked** — no check exists; nothing was green because nothing was asked | 4b | **Write one.** Do not file it as a scope problem. |

## What to do instead

1. **Never assert a copy equals the current source.** Assert the fact appears in
   exactly one place.
2. **Name which resolver, encoding, locale or scope each green check exercises**
   before treating it as evidence. "Tests pass" is evidence about the assertions
   written, and nothing else.
3. **End verification at the built output**, in the form it will really be read:

   ```bash
   ALLOW_INDEXING=true npm run build
   grep -rlo '"closes":"12:00"' dist/ || echo "OK"
   grep -rE 'aria-label="[A-Za-z]' dist/zh-hant dist/zh-hans
   ```

   `verify-css.mjs` and `verify-build.mjs` check the contradictions someone
   already thought to encode. Exit code 0 means "no *known* contradiction."
4. **Make every new guard fail first, by mutating the real defect back in.** A
   mutation that does not change the file proves nothing — see
   [`tailwind-palette-classes-bypass-theme-tokens.md`](../ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md).
   Instance 1 *did* fail first and was still invalid, because it was made to fail
   against a value that later moved. Failing once is necessary, not sufficient.

## Still open

- **`getTranslation`'s `||` is unfixed** (`src/i18n/locales.ts:185`). Worked
  around, not repaired.
- **`PageNav.astro` is dead code carrying live hazards**: a hardcoded
  `aria-label="Main navigation"`, hardcoded English nav labels, and links to
  `/zh-hant/hours/` and `/zh-hant/new-patients/`, **neither of which exists**.
  Harmless while nothing imports it; a set of bugs the moment someone does.
  Delete it or fix it.
- **No test catches a hardcoded English literal in a shared component's
  `aria-label`/`title`/`alt`/`data-label`.** Six shipped and rendered on all 12
  Chinese pages — three in `FontSizeControl`, its live-region announcement,
  `MobileNav`'s toggle, `LanguageSwitcher`'s nav — fixed in `0a82988` and
  `40efe52`. Nothing prevents a seventh.

## Related

- [`duplicated-facts-and-partial-fix-propagation.md`](duplicated-facts-and-partial-fix-propagation.md)
  — the hours were a seventh instance of that pattern. This document adds a
  failure mode it does not have: a guard *existed* and was defeated anyway.
- [`shared-data-module-locale-strings.md`](shared-data-module-locale-strings.md)
  — same file family. Instance 4a is the mirror of its finding: a check scoped
  to the Chinese locales is structurally blind to `en`.
- [`tailwind-v4-astro-silently-uncompiled.md`](../integration-issues/tailwind-v4-astro-silently-uncompiled.md)
  — "exit-code success is not output correctness for any tool that can no-op."
  Instance 2 is a second Astro-config trap: not a missing plugin, but the config
  file's own import graph resolving differently from the rest of the toolchain.
- [`tailwind-palette-classes-bypass-theme-tokens.md`](../ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md)
  — the mutation-testing discipline these guards are held to.
