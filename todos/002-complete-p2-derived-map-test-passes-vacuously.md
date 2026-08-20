---
status: complete
priority: p2
issue_id: 002
tags: [code-review, quality, i18n, guards]
dependencies: []
---

# The new Traditional-to-Simplified assertions pass on an empty map

## Problem Statement

`tests/i18n/taiwan-register.test.ts` gained a describe block on this branch that
derives a Traditional-to-Simplified character map by pairing locale strings by
key and zipping them. It found a real defect (`覽 -> 览` vs `覽 -> 航`).

It does not guard its own domain. If the derived maps are empty, both new
assertions pass, because both iterate the map and assert an empty array of
problems.

## Findings

**Verified by mutation.** Replacing the `zh-hant` map construction with `[]`,
simulating a refactor that renames or flattens the locale keys:

```
Tests  29 passed (29)
```

All green, checking nothing.

The irony is local: the same file, about ten lines above the added code, already
carries a test named *"finds the nested blocks to check"* with the comment
*"Guards the derivation itself: if a refactor flattens translations, the loop
below would silently check nothing and still pass."* The new block did not copy
that precaution.

Note the sibling length-parity assertion has the same hole for the same reason —
`[...hant.keys()].filter(k => hans.has(k))` is empty when the maps are empty.

## Proposed Solutions

### Option A — assert the derivation is non-empty and plausibly sized
Add a test asserting the paired-key count is above a floor and that the derived
character map covers a minimum number of distinct characters.

- Pros: matches the convention already in this file; smallest change.
- Cons: a magic floor number needs a comment explaining it. Effort: Small.

### Option B — assert against a known-present pairing
Assert the map contains a specific known pair (e.g. `醫 -> 医`), which proves the
zip ran on real data.

- Pros: no magic number; reads as documentation. Cons: one hardcoded pair.
- Effort: Small. Risk: Low.

### Option C — both
Floor plus a known pair.

- Effort: Small. Risk: Low.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- Affected file: `tests/i18n/taiwan-register.test.ts`, the describe block
  "a Traditional-to-Simplified map derived from the copy itself"

## Acceptance Criteria

- [ ] Emptying either derived map fails the suite
- [ ] The existing `覽 -> 览 / 航` mutation still fails, with the same message
- [ ] Mutation evidence recorded in the commit message

## Work Log

**2026-08-20** — Fixed in `5a12360`, Option C. Added a size-floor assertion on
both maps and their intersection, plus an assertion that the derived map
contains 醫 -> 医. Verified: emptying the zh-hant map now fails both; the
original 覽 -> 览/航 mutation still fails with the same message. Suite 200 -> 202.

**2026-08-20** — Found during self-review. Mutation applied and reverted;
suite restored to 200 passing.

## Resources

- Commit `9781d44` (added the block)
- The precedent test in the same file: "finds the nested blocks to check"
