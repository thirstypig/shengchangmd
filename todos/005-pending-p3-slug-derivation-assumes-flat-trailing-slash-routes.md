---
status: pending
priority: p3
issue_id: 005
tags: [code-review, routing, seo]
dependencies: []
---

# hreflang slug derivation assumes flat routes with trailing slashes

## Problem Statement

`src/layouts/BaseLayout.astro:62` derives the page slug, and
`localeHasPage` maps it to `/src/pages/{slug}.astro`. Both assumptions hold for
every route that exists today and neither is asserted anywhere.

## Findings

Two latent cases, neither live:

**1. Nested routes.** A page at `src/pages/services/stem-cell/index.astro`
yields slug `services/stem-cell`, and `localeHasPage` looks for
`/src/pages/services/stem-cell.astro`, which does not exist. Result: the page
emits **no alternates at all**, silently. Todo 001's guard cannot see absence,
so nothing would fail. All routes are currently flat.

**2. Trailing slashes.** The locale-stripping regex uses a `(?=\/)` lookahead,
so a canonical of `/zh-hant` without a trailing slash would leave slug
`zh-hant`, matching no file in any locale, again emitting nothing. Verified all
26 canonicals are declared with trailing slashes, so this cannot currently fire.

## Proposed Solutions

### Option A — resolve both file shapes
Check `/src/pages/{slug}.astro` and `/src/pages/{slug}/index.astro`.

- Pros: removes case 1 entirely; three lines. Effort: Small. Risk: Low.

### Option B — fix 001 first and let the guard catch it
With a self-referential-alternate assertion, a page emitting nothing fails the
build the moment it is added.

- Pros: catches this and every other cause of silent absence.
- Cons: fails at build rather than working correctly. Effort: covered by 001.

### Option C — both

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/layouts/BaseLayout.astro:60-65`

## Acceptance Criteria

- [ ] A nested page emits correct alternates, or fails the build loudly
- [ ] Existing 26 pages' alternates unchanged

## Work Log

**2026-08-20** — Found during self-review. Confirmed all current canonicals use
trailing slashes and all routes are flat, so neither case is live.

## Resources

- Commit `b9070e6`
