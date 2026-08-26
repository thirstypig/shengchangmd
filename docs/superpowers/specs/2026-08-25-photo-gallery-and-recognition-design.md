# Personal photo gallery + main-site "Community & Recognition" section

Date: 2026-08-25
Status: approved by owner in chat 2026-08-25

## Source material

`_Sheng Chang Photos/` (repo root, not yet gitignored — 103 files, mostly
`IMG_XXXX.HEIC` and UUID-named `.jpeg`, no descriptive filenames). Reviewed
image-by-image; full categorization lives in this session's transcript. Three
files (`1475.jpg`, `1497.jpg`, `1508.jpg`) are watermarked "City of Arcadia
Library" archive photos — per `CLAUDE.md`'s Arcadia History Collection section,
these cannot be reproduced anywhere, gallery included, without the
still-pending written permission from `ref247@ArcadiaCA.gov`. They are
excluded from both destinations below.

## Destination 1: personal gallery (unlinked)

- New Astro page at `/family-photos-2026/` — deliberately not `/gallery/`
  or anything a directory-listing guess would find quickly.
- `noindex`, excluded from the sitemap (same mechanism as the unreviewed
  Chinese locales — gate on a boolean, not a manual robots exception).
- No link to it from any nav, footer, or other page. English-only; no
  trilingual obligation since it carries no site copy, only images.
- Single flat responsive grid, click-to-enlarge lightbox. No captions.
- Content: all reviewed photos not selected for Destination 2, minus the
  three archive-blocked photos above (~85 photos).
- Owner accepted "unlisted-only" as sufficient privacy 2026-08-25 — the
  repo is public, so this page and its images are still technically
  reachable by anyone with the URL or browsing repo history. No further
  access gate requested.

## Destination 2: main site — "Community & Recognition" section on the About page

- Curated, capped at 8 items (owner: "I do not want too many photos on
  the main page"):
  - Certificates (own copies, no third-party watermark): Congressional
    Proclamation (Nov 4 1988), LA County Commendation, Certificate of
    Commendation signed by Pete Wilson, Alumni Association of Taiwan First
    High School of Southern California Certificate of Appreciation.
  - Civic/association photos: podium speech under a red dragon banner
    (Arcadia-area Chinese association event), a plaque presentation
    ("美国罗省中华会馆暨各侨团首長回國致敬"), a second plaque-presentation
    photo, and one banner/podium shot ("中华文化推展中心荣任文教育研讨會").
  - Exact file mapping recorded in implementation plan, not here — filenames
    are opaque UUIDs/IMG numbers and need to be renamed to something durable
    during implementation.
- Layout: compact photo strip, not a full grid — visually secondary to the
  page's existing content.
- New heading + one-line intro, translated into `zh-hant` and `zh-hans` in
  the same commit per this repo's trilingual-content rule. Routed through
  `locales.ts` / `getTranslation`, not hardcoded in a shared component.
- No JSON-LD changes — these are not facts requiring structured data.

## Explicitly out of scope this pass

- Photos left in the "uncertain" bucket during review (053, 058, 074, 076,
  077, 085, 099) default to gallery-only. Owner can promote any to
  Destination 2 later.
- Press clippings (075, 083) are not part of either destination yet — flagged
  as candidates for the About-page bio text, not the photo section, and not
  actioned this pass.
- The three archive-blocked photos (009, 011, 012) go nowhere until written
  permission arrives. Do not add them to the gallery as a workaround.

## Asset handling

- Selected originals move from `_Sheng Chang Photos/` into the repo:
  Destination 2 images into `public/images/`, resized/compressed for web;
  Destination 1 images into a public path the new gallery page reads from
  (also resized — full-res HEIC scans are too large to ship 85 of, as-is).
- This is a deliberate exception to the `src-photos/`-stays-gitignored rule:
  those originals were "never meant for publication." These photos are
  being published on purpose, at the owner's request.
- `_Sheng Chang Photos/` itself should not remain committed at the repo root
  once sorted — either gitignore it (mirroring `src-photos/`) or delete it
  after the selected/rejected images are moved, so the full unsorted dump
  (including the blocked archive photos) isn't sitting in the public repo
  outside the two curated destinations.
