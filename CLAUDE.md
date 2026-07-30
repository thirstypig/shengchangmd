# shengchangmd — working agreement

Astro 5 static site for Sheng Chang, M.D., a family medicine practice in
San Gabriel, CA. Trilingual: English, Traditional Chinese, Simplified Chinese.

## Reporting: be brutally honest

This is a real medical practice site. Wrong information on it has real
consequences for real patients. Therefore:

- **Never restate a subagent's or a tool's success claim as fact.** Verify it
  directly — load the page, read the built CSS, run the command — or label the
  claim as unverified.
- **Lead with what is broken, missing, or fabricated**, before what works.
- **No "production ready", "complete", or benchmark scores without evidence**
  you produced yourself in that session.
- **Name your own mistakes plainly.** No hedging, no burying them at the end.
- **Never invent factual content.** Not names, credentials, board
  certifications, insurance carriers, patient reviews, hours, addresses, map
  coordinates, or URLs. If a fact is unknown, leave a clearly-marked
  placeholder and say so.

This exists because an earlier session reported "Lighthouse 100/100/100/100",
"52/52 audits passed" and "17/17 tasks complete, production ready" for a site
that was rendering with **zero compiled CSS** — Tailwind had never been wired
into Astro. The same session shipped a fabricated Google Maps embed URL, an
invented insurance carrier list, and an invented Chinese name for the doctor.

Full write-up, including which prior reports are void:
[`docs/solutions/integration-issues/tailwind-v4-astro-silently-uncompiled.md`](docs/solutions/integration-issues/tailwind-v4-astro-silently-uncompiled.md).
`npm run build` now runs `scripts/verify-css.mjs` via `postbuild`, which fails
the build if the compiled CSS lacks real Tailwind output.

## Colour rule (do not break this)

`--brand` **inverts between themes**: deep red in light mode, light amber in
dark mode. Therefore:

- **Never** hardcode `black`, `white`, `#000`, `#fff`, or any fixed text colour
  on a branded or coloured background. It will be legible in one theme and
  invisible in the other.
- **Never pin a heading's colour** inside a coloured surface. Headings are
  `color: inherit` on purpose so the surface decides.
- Set the surface's own `color` to `--brand-contrast` and let descendants
  inherit. `--brand-contrast` is defined per theme to be legible on `--brand`.

This caused two real bugs: dark text on the red insurance hero in light mode,
and light text on the light brand fill in dark mode — both from a single
`h1…h6 { color: var(--text-strong) }` rule that overrode the hero's own label
colour.

## Facts that must come from source, never memory

- Hours, address, phone → `src/data/practice.ts` (single source of truth)
- Localized copy → `src/i18n/locales.ts`
- **Never interpolate `practice.*` directly into a `zh-hans`/`zh-hant` page or a
  shared component.** Route it through `getPracticeLocalized()` or
  `getTranslation()`. Those fields are English strings, so rendering them on a
  Chinese page produces sentences that switch language mid-clause. This shipped
  once, including via the shared footer, so it hit every Chinese page:
  [write-up](docs/solutions/logic-errors/shared-data-module-locale-strings.md).
- **Verify against the invariant, not against your diff.** Grepping for the
  strings you just fixed proves only that you fixed them. Search for the *shape*
  of the defect — that is what found a hardcoded English skip link on every
  Chinese page after a "no English remains" claim had already been made.
- Board certifications, licence numbers, education → `src/data/practice.ts`
- Map URLs → derive from `practice.address`, never hardcode coordinates or
  Google place IDs

## Known open items requiring the owner's confirmation

- ~~Doctor's Chinese name~~ — 张胜雄 / 張勝雄 confirmed acceptable by the owner
  (2026-07-29).
- **Insurance carriers.** The list on `insurance.astro` was generated, not
  supplied, and is currently live. The owner is compiling the real list
  (2026-07-29). Do not enable indexing until it is replaced. No carrier logos:
  reproducing the marks copies trademarks, and displaying them asserts network
  participation.
- ~~Immigration medical exams~~ — confirmed 2026-07-29: Dr. Chang is listed in
  the USCIS Find a Doctor locator, i.e. he holds the **civil surgeon
  designation** and may complete **Form I-693**. Recorded as
  `practice.civilSurgeon`. Note the term misleads — "civil surgeon" is a USCIS
  designation for licensed physicians of any specialty, not a surgical
  qualification.
- **Doctor's portrait** now comes from a real photograph the owner supplied
  (`src-photos/formal-tighter.jpeg`), cropped to `public/images/dr-sheng-chang.jpg`
  at 1024×1024. It is a banquet photo, not a studio headshot — fine for now, but
  a clinical/office portrait would suit the practice better.
- **A couple crop** exists at `public/images/dr-and-mrs-chang.jpg`. Unused:
  unconfirmed whether Mrs. Chang is part of the practice.

## Setup

```
npm install
npm run dev      # http://localhost:3120
npm run build
```

Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`, with global
styles and the theme in `src/styles/global.css`. Design tokens live in
`tailwind.config.ts`, loaded by the `@config` directive. Utility classes will
silently do nothing if that plugin is ever removed — verify visually after
touching the build config.
