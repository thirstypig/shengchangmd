---
status: complete
priority: p2
issue_id: 001
tags: [code-review, quality, seo, guards]
dependencies: []
---

# verify-build's hreflang check cannot see hreflang disappearing

## Problem Statement

`scripts/verify-build.mjs` check #5 was added on this branch to guard the fix for
32 broken `hreflang` alternates. It validates every alternate that **exists**.
It has no opinion about alternates that are **absent**, so deleting the emission
entirely passes the build clean.

That matters because the guard's whole purpose is to protect the fix in
`b9070e6`. As written it would not notice that fix being reverted.

## Findings

**Verified by mutation, not by reading.** Replacing the emission block in
`src/layouts/BaseLayout.astro` with a comment, so that no page emits any
`<link rel="alternate">` at all, then running `ALLOW_INDEXING=true npm run build`:

```
[verify-css]   OK — 1 CSS file(s), all 4 sentinels present.
[verify-build] OK — 26 pages, 30 referenced assets all present, sitemap consistent with robots meta.
```

Clean. 26 pages, zero alternates, no failure.

The loop is `for (const m of html.matchAll(/<link rel="alternate"[^>]*href="([^"]+)"/g))`
— zero matches means zero iterations means zero failures.

This is the defect class CLAUDE.md already names: a green check that cannot see
the defect. Same shape as the emptiness check that iterated only the two Chinese
locales, and as `source-integrity`'s block list when it named `serviceCards`
explicitly.

## Proposed Solutions

### Option A — assert every indexable page carries a self-referential alternate
Every page must emit an alternate whose href equals its own canonical URL. That
is true by definition of a correct hreflang cluster, it catches total absence,
and it also catches the original 2026-08-20 bug where a Chinese page's `en-US`
alternate pointed at itself while no alternate pointed at the Chinese page.

- Pros: derives from a real invariant; catches absence AND misdirection; no list.
- Cons: needs care for pages with a single locale (still must self-reference).
- Effort: Small. Risk: Low.

### Option B — assert a minimum alternate count per page
Fail if any page emits fewer than one alternate.

- Pros: trivial. Cons: weaker; passes on one wrong alternate. Effort: Small.

### Option C — assert reciprocity across the cluster
If A lists B as an alternate, B must list A.

- Pros: strongest; the actual Google requirement. Cons: most code.
- Effort: Medium. Risk: Low.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- Affected file: `scripts/verify-build.mjs`, check #5 (added this branch)
- Related: `src/layouts/BaseLayout.astro` lines 82-90

## Acceptance Criteria

- [ ] Deleting the hreflang emission from BaseLayout fails `npm run build`
- [ ] The failure message names the pages missing alternates
- [ ] Restoring the emission passes
- [ ] Mutation evidence recorded in the commit message, per repo convention

## Work Log

**2026-08-20** — Fixed in `5a12360`, Option A. Check 5 now also asserts every
page names itself among its alternates, with x-default excluded so it cannot
satisfy the check alone on an English page. Verified by two mutations:
removing the emission gives 26 failures; restoring the pre-`b9070e6`
expression gives 36 (32 alternate-404s + 4 from the two English-only pages).
Baseline build clean.

**2026-08-20** — Found during self-review of this branch. Confirmed by mutation:
emission removed, build clean. Restored; 200 tests and build green.

## Resources

- Commit `b9070e6` (the fix this guard is meant to protect)
- CLAUDE.md, "Tests" section, on guards that cannot see their defect
