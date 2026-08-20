---
status: pending
priority: p3
issue_id: 007
tags: [code-review, css, architecture, duplication]
dependencies: []
---

# The four new pages each carry a verbatim copy of the English page's style block

## Problem Statement

`zh-han{t,s}/new-patients.astro` and `zh-han{t,s}/hours.astro` each duplicate the
entire `<style is:global>` block from their English source — roughly 100 and 30
lines respectively. Astro inlines page styles per page, so these are not shared;
editing one copy changes one page.

This follows the pattern already in the repo (`zh-hant/location.astro` and
`zh-hant/insurance.astro` do the same), so it is consistent rather than novel.
It is still the duplicated-fact shape applied to CSS, and this branch added four
more copies.

## Findings

- Page CSS is **not** in the shared bundle. `dist/_astro/` contains exactly one
  CSS file, 32 KB, and `grep` for `.content-section`, `.info-box`,
  `.cta-button`, `.hours-link` finds **zero** occurrences in it. Each page
  carries its rules in an inline `<style>` block.
- That is precisely how the `.hours-link` bug in `5711618` arose: the Chinese
  location pages had `:hover` and `:focus-visible` but no base rule, because the
  base rule lived in the English page's block and never reached them.
- `.content-section` is defined with **different values** in different pages
  (`.content-left h1` margin is `0 0 1.5rem` in hours, `0 0 1rem` in
  new-patients). Because the blocks are inlined per page rather than bundled,
  these do not collide today.

## Proposed Solutions

### Option A — move the shared page-layout rules into `src/styles/global.css`
Promote `.content-section`, `.content-container`, `.content-left`, `.info-box`,
`.cta-button`, `.hours-link*` to the global stylesheet; delete the per-page
blocks; keep genuinely page-specific overrides local.

- Pros: one definition; the `.hours-link` class of bug becomes impossible;
  smaller HTML per page and one cacheable stylesheet.
- Cons: the differing `h1` margins must be reconciled deliberately, and this
  touches pages outside the branch. Needs visual verification in both themes on
  all 26 pages. Effort: Medium. Risk: Medium — this is exactly the change that
  can silently alter a colored surface, and CLAUDE.md is emphatic that contrast
  checks cannot see a fill/text confusion.

### Option B — extract to a shared Astro component
A layout component owning the markup and the style.

- Pros: markup and style travel together. Cons: larger refactor. Effort: Medium.

### Option C — leave it, matching the existing pattern
- Pros: zero risk; consistent with the six existing Chinese pages.
- Cons: keeps the trap that produced `5711618`. Effort: None.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/pages/zh-han{t,s}/new-patients.astro` (style block ~100 lines each)
- `src/pages/zh-han{t,s}/hours.astro` (~30 lines each)
- `src/pages/{location,insurance,hours,new-patients}.astro` and the existing
  Chinese location/insurance pages

## Acceptance Criteria

- [ ] Each shared rule is defined once
- [ ] All 26 pages verified visually in BOTH themes, not by contrast test alone
- [ ] No page loses a base rule while keeping its `:hover` (the `5711618` bug)

## Work Log

**2026-08-20** — Found during self-review. Confirmed empirically that page CSS
is inlined per page and absent from the shared bundle.

## Resources

- Commit `5711618` (the dead-CSS bug this duplication caused)
- CLAUDE.md, "Color rule"
