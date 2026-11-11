# STATUS — shengchangmd

**Last updated:** 2026-11-11

## One-line description
Trilingual (English, Traditional Chinese, Simplified Chinese) static website for the family medicine practice of Sheng Chang, M.D., in San Gabriel, CA.

## Scope / positioning
- Real practice site; facts come only from `src/data/practice.ts`.
- Owner priority (todo 010): immigration medical exams (Form I-693) first, new patients of any kind second.

## Stack & hosting
- Astro 5, Tailwind CSS 4, TypeScript, Vitest; `@astrojs/sitemap`.
- GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
- Custom domain via `CNAME`. No analytics on the site.

## URLs
- Live: https://shengchangmd.com
- Repo: https://github.com/thirstypig/shengchangmd

## Shipped (last 60 days)
- Form I-693 page in three locales with FAQ and JSON-LD (PR #67, 2026-09-22).
- Articles section: index, method page, two sourced I-693 articles, AI-drafting disclosure.
- Chinese pages set indexable (2026-09-22); Chinese SEO titles/descriptions and Chinese-name header wordmark.
- Encrypted, unlisted editorial schedule with twelve drafts.
- Google Search Console verified (2026-09-23); Bing Webmaster Tools imported.
- Privacy fixes: stripped GPS/EXIF/IPTC/XMP metadata from all published images; real `/privacy/` and `/accessibility/` content.
- Nav trimmed to five links; footer expanded to a full site map.
- About page: 2026 Lifetime Achievement Award and two 2026 gala videos.
- Trilingual 404 page; clickable new-patients badge; home hero rewritten as a direct answer.
- Structured-data vocabulary fixes.
- CI runs build-output tests after the build (todo 013).

## In progress
- SEO/GEO strategy (todo 010): remaining workstreams (C direct-answer/consistency, D city pages, E Chinese channels) not all shipped or declined.
- Multilingual blog (todo 011): acceptance criteria still open.

## Open bugs / known issues
- Google index: on 2026-10-15 Search Console showed only the home page indexed; child `sitemap-0.xml` read "Couldn't fetch". Resubmitted and indexing requested 2026-10-16; recheck not recorded.
- README still says both Chinese locales are `noindex`, contradicting CLAUDE.md and the 2026-09-22 change.
- Third-party listings contradict site facts (todo 009); owner handles offline.
- Two exposures remain in public git history; owner accepted the risk (todo 012).
- Still open: Chinese share card (`og-image.png`, English-only today); hero photographs missing (owner sourcing).
- Chinese copy is live but not yet read by a fluent reviewer.

## Next phases (in order)
1. Confirm Google indexing beyond the home page; then read Search Console performance about two weeks after.
2. Workstream D (city pages, Arcadia only) — on hold until indexing is confirmed.
3. Blog spec and first owner-reviewed post (todo 011).
4. Recognition-photo admin page (spec approved 2026-08-26, not built).
5. Deferred: Spanish/Vietnamese pages (needs fluent reviewer), attorney referral page.

## Decisions changed recently
- Chinese pages switched from `noindex` to indexed (2026-09-22), ahead of the owner's review.
- Articles publish without a physician-review claim; `reviewedBy` only set after review (2026-09-22).
- I-693 fee, labs and turnaround kept unpublished (2026-09-21).
- Listings, Google Business Profile and Chinese directories moved to owner, offline (2026-09-23).
- Wikidata item and `llms.txt` declined (2026-10-16).
- Retired PORTS.md; MASTER-PORTS.md no longer published (2026-09-12).
