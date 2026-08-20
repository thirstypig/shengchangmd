---
status: pending
priority: p3
issue_id: 008
tags: [code-review, accessibility, ux]
dependencies: []
---

# The "Accepting New Patients" badge became a link with no hover or focus styling

## Problem Statement

On this branch the badge on all three home pages changed from a `<div>` to an
`<a href=".../new-patients/">`, to give the previously orphaned page an inbound
link. Its classes were carried over unchanged, so nothing about it changes on
hover or focus. It does not look clickable.

## Findings

Built markup (`dist/index.html`):

```html
<a href="/new-patients/" class="bg-white border border-success rounded-lg px-6 py-4 text-center block">
  <p class="text-success font-semibold"><span aria-hidden="true">✓</span> Accepting New Patients</p>
</a>
```

Assessed:

- **Accessible name** is "Accepting New Patients" — the ✓ is correctly
  `aria-hidden`. Adequate.
- **Focus ring**: no `outline: none` / `outline-none` exists anywhere in
  `global.css`, the layout, or the components, so the browser's default
  `:focus-visible` ring survives. Not a blocker, but it is the UA default rather
  than a designed state, and `global.css` defines no `:focus-visible` styling at
  all site-wide.
- **Colour tokens are correct.** `bg-white`, `text-success` and `border-success`
  are all redeclared against theme tokens in `global.css` (lines 214, 326, 329)
  and the `THEMED` family list in `theme-token-coverage.test.ts` covers `white`
  and `success`. No hardcoded-palette bug here.
- **No hover state**: the card is visually identical on hover, so a sighted
  mouse user gets no affordance that it leads anywhere.

## Proposed Solutions

### Option A — add hover and focus-visible states using existing tokens
e.g. a border-colour shift and an explicit focus ring.

- Pros: makes it read as interactive. Cons: **any `hover:`/`focus:` colour
  utility must be added to the map in `global.css`, including those variants** —
  CLAUDE.md records four shipped bugs from exactly this omission, and Tailwind
  emits variants at higher specificity. Effort: Small. Risk: Medium if done with
  palette utilities, Low if done in the page's own CSS with tokens.

### Option B — keep the card static, add a plain text link beneath it
- Pros: avoids the variant-mapping trap entirely. Cons: more UI. Effort: Small.

### Option C — leave it
- Pros: zero risk; the link works and is announced correctly.
- Cons: poor affordance on the site's main conversion path to that page.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/pages/index.astro`, `src/pages/zh-hant/index.astro`,
  `src/pages/zh-hans/index.astro` — the `practice.acceptingNewPatients` block

## Acceptance Criteria

- [ ] The badge visibly changes on hover and on keyboard focus
- [ ] Verified in BOTH themes and in hover state in both — a resting screenshot
      in one theme is not evidence
- [ ] Any new themed utility is on the map in `global.css` with its variants
- [ ] `tests/styles/theme-token-coverage.test.ts` still passes

## Work Log

**2026-08-20** — Found during self-review. Verified the accessible name, the
absence of any outline reset, and that the three palette classes are
token-mapped.

## Resources

- Commit `fef0fe7`
- `docs/solutions/ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md`
