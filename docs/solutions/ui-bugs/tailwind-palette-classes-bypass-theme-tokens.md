---
title: "A Tailwind palette class left off the token map keeps one theme's colour in both"
date: 2026-08-05
category: ui-bugs
problem_type: theme_token_bypass
component: src/styles/global.css / Navigation.astro / ServiceCard.astro / contact + about page sets
severity: medium
symptoms:
  - 'a link is legible in light mode and nearly invisible in dark mode, or the reverse'
  - 'text goes *darker* on hover on a dark surface, disappearing into the background'
  - 'a border or underline that marks the active nav item vanishes in one theme'
  - 'the defect appears only on hover or only on one theme, so a single screenshot misses it'
  - 'the class name looks brand-correct in the template — nothing reads as hardcoded'
  - 'typecheck, all unit tests, verify-css and verify-build pass with it shipped'
  - 'grepping the template for black/white/#fff finds nothing, because the colour is a palette class'
stack:
  - Tailwind CSS v4
  - '@tailwindcss/vite'
  - Astro 5
  - CSS custom properties
recurrence_risk: 'high — the map in global.css is maintained by hand, and every new brand-coloured utility (and every hover:/focus: variant of one) is another chance to omit an entry'
tags:
  - theming
  - dark-mode
  - accessibility
  - contrast
  - tailwind
  - silent-failure
  - partial-fix-propagation
---

# A Tailwind palette class left off the token map keeps one theme's colour in both

> **Category note.** Filed under `ui-bugs`: nothing threw, nothing failed to
> compile, and every page rendered. The pixels were wrong in one theme only.

This is the colour-system counterpart to
[`duplicated-facts-and-partial-fix-propagation.md`](../logic-errors/duplicated-facts-and-partial-fix-propagation.md).
That one is about a *fact* stored in more than one place. This one is about a
*colour* stored in more than one place — Tailwind's fixed palette and the
theme's token set — where only one of them inverts.

## Symptom

Three links were added to the About page on 2026-08-05, styled with the same
class the page already used for its one existing inline link:

```html
<a class="text-primary-700 underline underline-offset-2 hover:no-underline">
```

In light mode they were correct. In dark mode they rendered as **`#8a2f3c` on
`#1d1719`** — light mode's deep red on dark mode's near-black surface. Barely
readable, and the pre-existing Min Mey Chang link in the same paragraph had
been failing this way for as long as it had existed.

Three separate classes were affected, and they were found in **two passes**:

| Class | Uses | Where it shows | Measured in dark mode |
|---|---|---|---|
| `.text-primary-700` | 19 | About page archive citations, the Min Mey Chang link, contact pages, `ServiceCard` | `#8a2f3c` on `#1d1719` |
| `.hover:text-primary-700` | 4 | **the contact pages' phone number** — the practice's primary call to action — and `ServiceCard` | `#6f2531` on `#1d1719` = **1.67:1** |
| `.border-primary-600` | 4 | the active nav item's underline in `Navigation.astro`, the contact pages' outlined button | `#8a2f3c` border on near-black |

The hover case is the worst of the three and was the last one found. On a dark
surface the link sat at a correct amber `#e8b96b`, and **moving the pointer
over it made it darker**, dropping to 1.67:1 — effectively invisible. It is
also the hardest to catch, because a screenshot of a page at rest never shows
it.

## Why it evaded detection

- **The class name looks right.** `text-primary-700` reads as "the brand
  colour, slightly stronger". Nothing about it signals that it resolves to a
  literal hex. The project's colour rule in `CLAUDE.md` warns against
  hardcoding `black`, `white`, `#000` and `#fff` — so a grep for those, which
  is the natural check, returns nothing.
- **Its sibling worked.** `.text-primary-600` *was* mapped to `var(--brand)`.
  Two adjacent shades of the same colour behaved differently, and the working
  one was the more common, which made the map look complete.
- **Only one theme is wrong.** Every automated check in this repo — `tsc`,
  55 unit tests, `verify-css.mjs`, `verify-build.mjs` — inspects source or
  built text. None of them renders a page or resolves a computed colour. The
  build asserts that Tailwind produced *real output*, not that the output is
  *legible*.
- **Variants hide behind specificity.** Tailwind emits
  `.hover\:text-primary-700:hover { color: #6f2531 }`, which outranks a base
  `.text-primary-700` rule. Fixing the base class therefore looks correct at
  rest and silently reverts on interaction.
- **Screenshots are taken in one theme.** The first visual check of this change
  happened to land in dark mode, which is the only reason it was caught at all.
  In light mode the page looked perfect.

## Root cause

`global.css` does not restyle templates. It **re-points Tailwind's fixed
palette classes at theme-aware custom properties**, by redeclaring them later
in the same stylesheet:

```css
.text-gray-800,
.text-gray-700 { color: var(--text); }

.text-primary-600 { color: var(--brand); }   /* mapped */
/* .text-primary-700 — never added */
```

Because `--brand` inverts between themes (`#8a2f3c` deep red in light,
`#e8b96b` amber in dark), any class on that list follows the theme. Any class
*off* the list keeps whatever hex `tailwind.config.ts` assigned it, in both
themes.

So the map is a hand-maintained list, and the failure mode is **omission**, not
error. There is no signal when an entry is missing: the class still works, it
just stops being theme-aware. The colour now lives in two places — the Tailwind
palette and the token set — and only one of them responds to the theme.

## Solution

### 1. Add the missing entries, including every variant form

```css
.text-primary-600,
.text-primary-700 {
  color: var(--brand);
}
.hover\:text-primary-600:hover,
.hover\:text-primary-700:hover {
  color: var(--brand-strong);
}

.border-primary-600 {
  border-color: var(--brand);
}
```

Note the hover rules map to `--brand-strong`, not `--brand`. That token is
defined per theme to move in the legible direction — **darker** on light
(`#8a2f3c → #6f2531`), **lighter** on dark (`#e8b96b → #f2cd8e`). Mapping
hover to `--brand` instead would make hover a no-op; mapping it to a fixed hex
recreates the original bug one interaction deeper.

This is one edit in one file that corrects **all 27 occurrences** across seven
templates and three locales. Editing the templates instead would have meant
seven files, and would have left the next `text-primary-700` anyone writes
broken again.

### 2. Fix the whole list, not the one class you noticed

The first pass added `.text-primary-700` only, verified it in both themes,
measured 9.8:1, and reported the fix as complete. That was wrong: the hover
and border siblings were the same defect, and the audit that found them was
run *after* the fix had already been committed and a PR opened.

A fix that lands on one entry of a mapping list while its siblings keep the raw
value is the same partial-fix propagation already documented in this repo. The
lesson generalises: **when the defect is "an entry is missing from a list",
the fix is never one entry — it is an audit of the list.**

### 3. Audit by diffing the two sources against each other

The audit that found the remaining two classes:

```bash
python3 - <<'PY'
import re, glob, collections
css = open('src/styles/global.css', encoding='utf-8').read()
mapped = set(re.findall(r'\.((?:text|bg|border)-[a-z]+-\d{2,3})', css))
base, variant, loc = collections.Counter(), collections.Counter(), collections.defaultdict(set)
for f in glob.glob('src/**/*.astro', recursive=True):
    for line in open(f, encoding='utf-8'):
        for m in re.finditer(r'([a-z]+:)?((?:text|bg|border)-primary-\d{2,3})', line):
            v, c = m.group(1), m.group(2)
            (variant if v else base)[(v or '') + c] += 1
            if not v: loc[c].add(f)
for c, n in sorted(base.items(), key=lambda kv: -kv[1]):
    print(f"{c:24} {n:3}  {'mapped' if c in mapped else 'UNMAPPED <<<'}")
print(dict(variant))
PY
```

Two things this script got wrong on the first run, both worth repeating:

- **It counted `hover:bg-primary-700` as a base `bg-primary-700`** and reported
  a defect that did not exist, because the leading `:` was inside the
  delimiter class. Separating base from variant forms removed a false positive.
- **It missed gradients entirely.** `from-primary-50` and `to-white` do not
  match a `text|bg|border` prefix. Both are used in `HeroSection.astro` and all
  three contact pages, and both turned out to be correctly mapped already at
  `global.css:178` — but the script would not have said so. A negative result
  from a pattern-matching audit is only as good as the pattern.

## Prevention

### Verify the computed colour, not the class name

Reading the template tells you nothing here, because the class name is not the
colour. The check that actually settles it, run against a served build:

```js
const el = document.querySelector('a.text-primary-700');
getComputedStyle(el).color;                                   // resolved value
getComputedStyle(el.closest('section')).backgroundColor;      // what it sits on
```

For hover states, which cannot be read at rest, resolve the winning declaration
from the CSSOM instead:

```js
for (const sheet of document.styleSheets)
  for (const r of sheet.cssRules)
    if (r.selectorText?.includes('hover\\:text-primary-700')) console.log(r.style.color);
```

If that prints a `#hex` rather than a `var(--…)`, the class is unmapped.

### Check both themes, and check hover in both

`document.documentElement.dataset.theme = 'light' | 'dark'` flips the theme
without clicking through the UI. A single-theme screenshot is not evidence
about a two-theme system, and a resting screenshot is not evidence about hover.
This defect needed all four combinations to be fully visible.

### A candidate test — not yet written

The natural regression guard is a unit test that parses every `*.astro` file
for brand-coloured utility classes, parses `global.css` for the selectors it
redeclares, and fails on any class used but not mapped — variants included.

It is deliberately **not** added here yet. This repo's rule is that every test
must be verified by making it fail before it is trusted, after 15 tests once
shipped asserting a data structure no page rendered. Writing the test is a
separate piece of work that has to include mutating `global.css` to confirm
the test goes red.

The test would need to handle, at minimum:

- variant prefixes (`hover:`, `focus:`, `md:`) as distinct selectors
- gradient stop utilities (`from-*`, `via-*`, `to-*`), which the first audit missed
- the `html[data-theme='dark']` nested block, which maps some classes only for dark
- classes that legitimately need no mapping because their value is theme-neutral

### Keep the rule next to the map

The mapping block in `global.css` now carries a comment naming all four rules,
what each one broke, and the instruction to check variant forms. The map is
hand-maintained; the reason each entry exists has to live beside it, or the
next person deletes one as redundant.

## Related

- [`duplicated-facts-and-partial-fix-propagation.md`](../logic-errors/duplicated-facts-and-partial-fix-propagation.md)
  — same shape, different material: a value stored twice, where fixing one copy
  looks like fixing the problem.
- [`tailwind-v4-astro-silently-uncompiled.md`](../integration-issues/tailwind-v4-astro-silently-uncompiled.md)
  — the other way this stylesheet has failed silently. That one produced *no*
  CSS; this one produces CSS that is wrong in half the cases. Both pass every
  automated check the repo had at the time.
- `CLAUDE.md` § "Colour rule" — the existing rule forbids hardcoded `black`,
  `white`, `#000`, `#fff` on branded surfaces. This defect is the same class of
  problem wearing a palette-class name, which that rule's wording does not
  currently catch.
