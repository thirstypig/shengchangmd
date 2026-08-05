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
- **The Ph.D. is asserted, not evidenced.** Added 2026-08-05 on Dr. Chang's own
  say-so, relayed by the owner, after the concern was raised and he confirmed.
  Nothing else corroborates it: this repo held M.D. only, and his Healthgrades
  and Doximity profiles list M.D. only. **Institution, field and year are all
  unknown**, which is why it appears in `doctorName`/`credentials` and
  deliberately *not* in `education` — putting it there would assert that
  National Taiwan University granted it. Fill `education` in properly once those
  three facts arrive.
- **Stem cell therapy copy is a placeholder and is live.** Added 2026-08-05 at
  the owner's request, with no detail supplied: the type of product or procedure,
  the indications, and the regulatory basis are all unknown. The copy on
  `services.astro` therefore asserts no benefit, indication, success rate or
  safety claim — it says the service exists and to call. Do not expand it without
  the owner supplying specifics; the FDA and FTC have both acted on marketing
  claims for unapproved stem cell products. It is deliberately excluded from the
  JSON-LD in `JsonLd.astro` for the same reason.
- **Medical-legal report scope is unconfirmed.** Listed as a service without
  detail. Unknown whether it covers personal injury, IMEs, disability or workers'
  comp, who may instruct, and whether testimony is offered.
- **Wake Forest University.** The owner asked whether Dr. Chang has a connection.
  Nothing was found in `practice.ts`, Healthgrades, Doximity, or search. His ABFM
  certification (1978) postdates his pathology residency (ended 1973), so a family
  practice residency in that gap would fit — but that is a hypothesis. Publish
  nothing on it without Dr. Chang confirming.
- **Two details normalised from the owner's bio text**, both worth confirming:
  "Arcadia city Library" was rendered as *Arcadia Public Library*, and the
  1994–1998 / 2000–2004 council terms are stated as given. The bio also said
  "practising Family Medicine since 1997", which contradicted "moved to
  California in 1979" and the council dates; 1979 was used, matching the
  February 13, 1979 licence issue date. A rotating mayoralty of April–July 2003
  is unusually short and is stated as supplied.
- **Doctor's portrait** comes from a photograph the owner supplied, cropped and
  colour-corrected to `public/images/dr-sheng-chang.jpg` at 1024×1024. It is a
  banquet photo, not a studio headshot — serviceable, but a clinical portrait
  would suit the practice better.
- **A crop of Dr. and Mrs. Chang** exists at
  `src-photos/dr-and-mrs-chang-crop.jpg`. Unused, and deliberately not in
  `public/` — anything there is served publicly, and whether Mrs. Chang has a
  role in the practice is unconfirmed.

## Photographs

Originals live in `src-photos/`, which is **gitignored on purpose**: this repo is
public, and the originals include full-resolution personal photographs of the
doctor and his wife that were never meant for publication. They were stripped
from git history while it was still unpushed. Only the derived portrait the site
actually renders is committed. Keep it that way — if the originals are ever
needed in version control, make the repo private first.

## Setup

```
npm install
npm run dev      # http://localhost:3120
npm run build    # 22 pages; postbuild runs scripts/verify-css.mjs
npm test         # 42 vitest tests
```

Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`, with global
styles and the theme in `src/styles/global.css`. Design tokens live in
`tailwind.config.ts`, loaded by the `@config` directive. Utility classes will
silently do nothing if that plugin is ever removed — verify visually after
touching the build config.

## Tests

`tests/i18n/locale-coverage.test.ts` — 42 tests, run with `npm test`.

Deliberately narrow. Every test prevents a regression that has actually happened
here, and all of them are for defects that typecheck and build cleanly:

- a value in `practice.ts` with no counterpart in `practiceLocalized`, which
  falls back to English and so leaks English onto a Chinese page
- a key present in `en` but missing from a Chinese locale, which makes
  `getTranslation` return the key itself, so a patient sees the literal text
  `hoursWeekday`
- a Chinese value left byte-identical to its English counterpart
- both fallback paths returning something renderable rather than `undefined`

**In CI.** `.github/workflows/deploy.yml` runs `npx tsc --noEmit` then `npm test`
before the build, so a typecheck or locale regression blocks the deploy rather
than shipping.

## Deployment

Live at **https://shengchangmd.bahtzang.com** via GitHub Pages
(`thirstypig/shengchangmd`, public repo). `.github/workflows/deploy.yml` builds
on push to `main`. DNS is a CNAME on Squarespace: `shengchangmd` →
`thirstypig.github.io`.

`SITE_URL` in the workflow feeds every canonical URL, sitemap entry, hreflang
link and JSON-LD `@id`. Nothing else should hardcode the domain — pages derive it
via `new URL(path, Astro.site)`.

**Moving to `shengchangmd.com` is planned but not started.** The domain is
already registered and a registrar transfer was in progress as of 2026-07-31, so
DNS could not be edited yet. It is an *apex* domain, which needs four A records
rather than the single CNAME the current subdomain uses, and the steps have a
required order. Do not improvise it — follow
[`docs/runbooks/domain-migration-to-shengchangmd-com.md`](docs/runbooks/domain-migration-to-shengchangmd-com.md),
and re-verify the registrar and nameservers first, since the transfer changes
them.

**Crawlers are blocked by default.** The build only emits an indexable page when
`ALLOW_INDEXING=true`, which the workflow leaves commented out. Do not enable it
until the insurance carrier list is replaced with the real one. Unreviewed
locales stay `noindex` regardless, driven by `reviewed` in `locales.ts`.
