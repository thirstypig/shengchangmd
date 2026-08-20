---
status: pending
priority: p3
issue_id: 006
tags: [code-review, i18n, guards, pre-existing]
dependencies: []
---

# The notFound string is translated into three locales and rendered by nothing

## Problem Statement

`notFound` is defined in all three locales (`locales.ts:151`, `:233`, `:315`) as
"Page not found" / 頁面未找到 / 页面未找到. No page or component reads it, and
the site has no 404 route at all, so GitHub Pages serves its own default 404 —
in English, for every visitor in every locale.

Pre-existing; not introduced by this branch. Raised because the branch is about
locale correctness and because it corrects an earlier claim of mine.

## Findings

- `grep -rn "notFound" src/ --include="*.astro" --include="*.ts"` outside
  `locales.ts` returns **nothing**.
- `ls src/pages/404*` — no such file.
- `tests/data/source-integrity.test.ts:213` derives its coverage list as
  `Object.entries(translations.en).filter(([, v]) => typeof v === 'object' ...)`.
  It checks **nested blocks only**, so top-level scalar keys like `notFound` are
  structurally outside what it can see — the same shape as the two blind spots
  that file's own comments already document.

**This corrects something I told you earlier today.** I flagged `notFound`'s
wording (頁面未找到 vs the more natural Taiwanese 找不到頁面) as an item for the
fluent reviewer. It renders nowhere, so reviewing its wording is wasted effort.
The packet should say so.

## Proposed Solutions

### Option A — add a 404 page per locale and use the key
GitHub Pages serves `404.html` from the site root for unmatched paths. One
English `src/pages/404.astro` is what Pages will actually serve; it cannot vary
by locale on a static host.

- Pros: a branded 404 with a route back into the site; uses the key.
- Cons: cannot be localized by path on GitHub Pages — a Chinese visitor still
  gets an English 404 unless it is client-detected. Effort: Small-Medium.

### Option B — delete the key from all three locales
- Pros: honest; removes dead weight. Cons: loses the translation if a 404 is
  built later. Effort: Small. Risk: Low.

### Option C — extend source-integrity to scalar keys
Make the coverage check see top-level strings, not only nested blocks, so the
next dead key is caught. Likely surfaces other unused keys.

- Pros: fixes the guard's blind spot, which is the real finding here.
- Cons: may fail immediately on other keys, needing triage. Effort: Medium.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/i18n/locales.ts:151,233,315`
- `tests/data/source-integrity.test.ts:213`
- No `src/pages/404.astro`

## Acceptance Criteria

- [ ] `notFound` is either rendered by a page or removed from all three locales
- [ ] If C is taken: adding an unread top-level key fails the suite
- [ ] The reviewer packet no longer asks for a ruling on unrendered copy

## Work Log

**2026-08-20** — Found during self-review while checking routing edge cases.
Verified from source rather than `dist/`, because a parallel agent was
rebuilding `dist/` and an earlier grep against it returned a false result.

## Resources

- `docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md`
