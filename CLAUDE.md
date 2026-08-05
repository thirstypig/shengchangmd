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

- Hours, address, phone → `src/data/practice.ts` (single source of truth). The
  address lives there as `addressParts`; `practice.address` is derived from it,
  so the prose address and the JSON-LD `PostalAddress` cannot drift apart.
- **A fact copied into a second place will drift, and your fix will reach only
  one copy.** This happened six times in one session on 2026-08-05 — the false
  Alabama training claim, a fabricated map embed, the insurance carrier list,
  a hardcoded directions link, the JSON-LD address, and duplicated service
  names. The fix is to delete the second copy, not to remember it:
  [write-up](docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md).
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
  Google place IDs. `tests/data/source-integrity.test.ts` fails the build if a
  place id, a pre-baked embed URL, a latitude/longitude, or the street address
  or phone number appears anywhere outside `practice.ts`.

## Known open items requiring the owner's confirmation

- ~~Doctor's Chinese name~~ — 张胜雄 / 張勝雄 confirmed acceptable by the owner
  (2026-07-29).
- **Insurance carriers.** ~~The generated list is live.~~ Removed 2026-08-05.
  `insurance.astro` had named eight carriers as accepted — Medicare, Medicaid,
  Blue Cross Blue Shield, Aetna, Cigna, United Healthcare, Anthem, Molina
  Healthcare — plus "We accept most major insurance plans", and claimed direct
  billing, self-pay discounts and payment plans. None of it was supplied by the
  practice. All three locales now say only that the office confirms coverage by
  phone, which is true whatever the answer turns out to be. **Do not restore a
  carrier list, or any "most major plans" phrasing, without the real list in
  writing.** No carrier logos either: reproducing the marks copies trademarks,
  and displaying them asserts network participation.
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
npm run build    # 22 pages; postbuild runs verify-css.mjs + verify-build.mjs
npm test         # 55 vitest tests
```

Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`, with global
styles and the theme in `src/styles/global.css`. Design tokens live in
`tailwind.config.ts`, loaded by the `@config` directive. Utility classes will
silently do nothing if that plugin is ever removed — verify visually after
touching the build config.

## Tests

Three files, 55 tests, run with `npm test`:

- `tests/i18n/locale-coverage.test.ts` — the i18n layer
- `tests/data/source-integrity.test.ts` — guards facts against being stored
  twice: the address must stay derived from `addressParts`, no file outside
  `practice.ts` may restate the address or phone, no hardcoded map URLs, place
  ids or coordinates, and no locale key may be defined without a page reading it
- `tests/routes/robots-gate.test.ts` — the `ALLOW_INDEXING` gate in both states,
  which `verify-build.mjs` cannot cover because it only ever sees one build

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
than shipping. `postbuild` then runs `scripts/verify-css.mjs` and
`scripts/verify-build.mjs`, which assert against the built output — that a
referenced asset exists, that the sitemap and the robots meta tag agree, that
JSON-LD's address matches `practice.ts`, and that no page names the retired
host. Those are contradiction checks; none of them can be seen from source.

**Every test here was verified by making it fail.** A mutation was introduced
for each guarded invariant and the expected test confirmed red before being
restored. This is not ceremony: 15 tests shipped on 2026-08-05 asserting
`serviceCards` labels that no page rendered, so they could never fail, and
"42 tests passing" was quoted as evidence several times before anyone noticed.

## Deployment

Live at **https://shengchangmd.com** via GitHub Pages
(`thirstypig/shengchangmd`, public repo). `.github/workflows/deploy.yml` builds
on push to `main`. DNS is an apex domain on Squarespace nameservers, resolving
to the four GitHub Pages A records; `www` redirects to the apex. The Let's
Encrypt certificate covers both names.

`SITE_URL` in the workflow feeds every canonical URL, sitemap entry, hreflang
link and JSON-LD `@id`. Nothing else should hardcode the domain — pages derive it
via `new URL(path, Astro.site)`.

**The migration from `shengchangmd.bahtzang.com` completed 2026-08-05.** The old
host now 404s. Two things about that day are worth carrying forward:

- The custom domain is a **repository setting**, not `public/CNAME`. Setting it
  through the web UI also flipped the Pages `build_type` from `workflow` to
  `legacy`, which started a Jekyll build that failed on every push while the
  site survived on the last `actions/deploy-pages` artifact. If Pages starts
  behaving oddly, check `gh api repos/thirstypig/shengchangmd/pages` first.
- `SITE_URL` was not moved at the same time, so for several hours every
  canonical URL, sitemap entry and JSON-LD `@id` named a host that 404s.
  `scripts/verify-build.mjs` now fails the build if any page references the
  retired host.

History and the 2026-08-01 outage:
[`docs/runbooks/domain-migration-to-shengchangmd-com.md`](docs/runbooks/domain-migration-to-shengchangmd-com.md).

**Indexing is ON as of 2026-08-05**, via `ALLOW_INDEXING: "true"` in the
workflow. It drives both the robots meta tag and `src/pages/robots.txt.ts`, so
the two cannot disagree. Unreviewed locales stay `noindex` regardless, driven by
`reviewed` in `locales.ts` — which also decides sitemap membership, so a page
can never be listed and de-indexed at once. **Both Chinese locales are still
`reviewed: false`**, so two-thirds of the site is not indexed pending a fluent
reader. Un-indexing is far slower than indexing: anything published here should
be true first.
