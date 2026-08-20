---
status: pending
priority: p3
issue_id: 004
tags: [code-review, seo, duplicated-facts]
dependencies: [001]
---

# x-default is computed by a different mechanism than every other alternate

## Problem Statement

In `src/layouts/BaseLayout.astro`, the locale alternates are now built from
`origin` plus a derived `slug`, existence-checked against the filesystem. The
`x-default` alternate one line below is still built the old way, by string
replacement on the canonical URL:

```js
const xDefaultHref = canonicalUrl.replace(/\/(zh-hans|zh-hant)\//, '/');
```

Two derivations of the same fact — "what is the English URL for this page" —
which is the shape that drifts.

## Findings

Currently correct on all four page shapes:

| Page | x-default |
|---|---|
| `/` | `https://shengchangmd.com/` |
| `/zh-hant/about/` | `https://shengchangmd.com/about/` |
| `/new-patients/` | `https://shengchangmd.com/new-patients/` |
| `/zh-hans/hours/` | `https://shengchangmd.com/hours/` |

Two latent differences from the alternates beside it:

1. **No existence check.** A Chinese-only page would emit an `x-default`
   pointing at an English URL that was never built. Todo 001's guard would
   catch it at build time, but only because x-default is also a
   `rel="alternate"` — that is luck, not design.
2. **Different failure mode on nested routes.** The regex replaces the first
   `/zh-hant/` anywhere in the URL, not only the leading segment.

## Proposed Solutions

### Option A — derive x-default from the same slug
`const xDefaultHref = ${origin}/${slug === 'index' ? '' : slug + '/'}` and emit
it only when `localeHasPage('en')`.

- Pros: one derivation; consistent with the alternates. Effort: Small. Risk: Low.

### Option B — leave it
- Pros: works today. Cons: the next routing change has to be applied twice.

## Recommended Action

_(to be filled during triage)_

## Technical Details

- `src/layouts/BaseLayout.astro:90`

## Acceptance Criteria

- [ ] x-default and the `en-US` alternate are produced by the same expression
- [ ] Built x-default values are unchanged on all 26 pages

## Work Log

**2026-08-20** — Found during self-review; verified current output correct on
four representative page shapes.

## Resources

- Commit `b9070e6`
