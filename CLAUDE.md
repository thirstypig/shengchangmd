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
- **A Tailwind palette class is a hardcoded colour too.** `text-primary-700`
  looks brand-correct and is not — it resolves to a literal hex unless
  `global.css` redeclares it against a token. Grepping for `#fff` will never
  find it. Before using a brand-coloured utility, confirm it is on the map in
  `global.css`, **including its `hover:`/`focus:` forms**, which Tailwind emits
  at higher specificity and which therefore override the base rule.

This caused two real bugs: dark text on the red insurance hero in light mode,
and light text on the light brand fill in dark mode — both from a single
`h1…h6 { color: var(--text-strong) }` rule that overrode the hero's own label
colour.

It caused three more on 2026-08-05, found in two passes because the first fix
corrected one entry of the map and not its siblings: every `text-primary-700`
link site-wide, the contact pages' phone number on hover (1.67:1 — the practice's
primary call to action, invisible on hover in dark mode), and the active nav
item's underline. **Verify the computed colour in both themes, and hover in
both — a resting screenshot in one theme is not evidence.**
[write-up](docs/solutions/ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md).

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
- **Publishing a fact does not remove the claim that contradicts it.** Before
  adding any constraint or limit, grep for its *negation* — in all three locales
  and in `JsonLd.astro`. Phase 3 of the 2026-08-06 batch published "we do not see
  patients under 18" onto a site that asserted "patients of all ages" in seven
  places, including "from newborns to seniors" in the structured data Google
  reads. No test can catch that: both sentences are well-formed on their own, so
  there is no invariant to assert — the search term has to come from imagining
  what the site might already say. `JsonLd.astro` is not a page and will not turn
  up in a page-by-page review; check it explicitly every time.
  [write-up, with worked examples for walk-ins, telehealth and cash-only](docs/solutions/logic-errors/publishing-a-fact-does-not-remove-its-contradiction.md).
- Map URLs → derive from `practice.address`, never hardcode coordinates or
  Google place IDs. `tests/data/source-integrity.test.ts` fails the build if a
  place id, a pre-baked embed URL, a latitude/longitude, or the street address
  or phone number appears anywhere outside `practice.ts`.

## Trilingual content: English changes are not done until Chinese is done

**Any user-facing English string change — page copy, headings, button labels,
`aria-label`, `alt`, meta descriptions — lands in `zh-hant` and `zh-hans` in the
same commit.** Full guidance, including the Taiwan vocabulary tables, is in
[`.claude/skills/trilingual-content/SKILL.md`](.claude/skills/trilingual-content/SKILL.md).
Read it before touching copy.

Two things from it that are easy to get wrong:

- **Do not skip the translation because you are not fluent.** A baseline test had
  an agent decline with "the wording should come from you or a fluent reviewer
  rather than me inventing the phrasing." That sounds responsible and is not:
  `reviewed: false` already keeps both Chinese locales `noindex`, and that gate —
  not your abstention — is the safety mechanism. An English-only change makes the
  Chinese page *actively wrong* rather than merely incomplete: if English gains
  "we do not accept walk-ins" and Chinese does not, silence tells a Chinese
  reader they may walk in. Translate it, flag it for review, do not omit it.
  The one real exception is a proper noun with no supplied Chinese name —
  guessing at those characters invents a fact.
- **Both Chinese locales use Taiwan Mandarin, in both scripts.** Simplified here
  means Taiwan wording in simplified characters, not mainland wording. Never
  `信息`/`网络`/`软件`/`视频`/`数据`; use `资讯`/`网路`/`软体`/`影片`/`资料`.
  Also never `医生`/`联系`/`普通话`/`身份`/`筛查`/`记录`; use
  `医师`/`联络`/`国语`/`身分`/`筛检`/`纪录`.
  **Never write `健保`** — that is Taiwan's National Health Insurance, which does
  not operate in California. Use full-width punctuation.
- **Do not verify Chinese against that word list.** It is a starting point, not a
  test, and checking against it returns a confident green while the same defect
  class sits in words nobody listed. That happened twice: a sweep verified "no
  信息/网络/软件/视频/移动/质量/数据/健保" and shipped with **31 instances of
  `医生`**; the sweep that fixed `医生` shipped with seven more concepts drifted,
  including `普通话` rendering under the homepage heading 看诊语言.
  **Use cross-locale parity instead** — for each concept, the Taiwan form's count
  in `zh-hant` must equal its simplified twin's count in `zh-hans`. Any
  inequality means one locale says something the other does not, whatever the
  word is and whether or not anyone thought to list it. Script and full account:
  [write-up](docs/solutions/logic-errors/simplified-is-a-script-not-a-dialect.md).
- **A shared component must not contain Chinese.** All translations live in
  `src/i18n/locales.ts` and are read with `getTranslation(locale, key)`. Do not
  start a second one.

  This is a rule because it happened: `HeroSection.astro`, `StickyCallBar.astro`
  and `Header.astro` each carried their own locale map, and that is where `医生`
  survived the sweep that fixed 31 instances elsewhere — the sweep read the pages
  and `locales.ts`, not those objects. Neither i18n test could see them either
  (`locale-coverage` imports `translations`; `shared-component-labels` matches
  literal attributes, not string maps), and `Header` used ternaries rather than
  an object, so even a search shaped for the other two skipped it. **Resolved
  2026-08-10** — all eight strings moved into `locales.ts`, rendered output
  byte-identical, and reintroducing either defect now fails the suite.
  Search for the *shape* (Chinese outside the translation layer), not the syntax.

This exists because six English `aria-label`s rendered on all 12 Chinese pages
for months — the strings a screen-reader user actually hears — while four of them
had translations sitting in `locales.ts` that nothing read.

## Known open items requiring the owner's confirmation

**The batch of facts that arrived from the owner on 2026-08-06 is now fully
published** — all four phases of
[`docs/superpowers/plans/2026-08-06-owner-supplied-practice-facts.md`](docs/superpowers/plans/2026-08-06-owner-supplied-practice-facts.md)
shipped on 2026-08-07 (PRs #16, #24, #25, #26) and were verified against
production, not against a local build. Live: the licence `A 33409`, the American
Board of Pathology certification, the Alabama pathology residency, the patient
scope limits, the six coverage types, and the four biography facts.

**The lesson from Phase 3, which applies to every future content change:
publishing a fact does not remove the claim that contradicts it.** The plan
described Phase 3 as publishing the scope limits. The site said the opposite in
**seven** places across all three locales — "patients of all ages", and in
`JsonLd.astro` "from newborns to seniors", which is what Google and voice
assistants read. Shipping the plan as written would have put "we do not see
patients under 18" and "patients of all ages" on the same page. No test catches
this; both sentences are individually well-formed. **Grep for the negation of
what you are about to publish, in every locale and in the structured data.**

- ~~Doctor's Chinese name~~ — 张胜雄 / 張勝雄 confirmed acceptable by the owner
  (2026-07-29).
- ~~Office hours~~ — **9:00 AM – 1:00 PM confirmed by the owner 2026-08-06** and
  live. The site had said 12:00 PM, and before that the scaffold said 6:00 PM.
  `practice.ts` now holds `opens`/`closes` in 24-hour form as the single source
  and derives the display string; three tests guard it.
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

  **Update 2026-08-06: the owner supplied coverage in writing, and it is
  different in kind.** It names plan **types**, not carriers — Original Medicare
  (the red, white and blue card), Medi-Cal (the white card), HMO, PPO, private
  insurance and cash. That meets the bar set above, and it went **live on
  2026-08-07** (PR #25) on all three insurance pages. Each item is qualified by
  a note that the office confirms whether your specific plan is contracted.
  **That qualifier is load-bearing — do not tidy it away or move it below the
  fold.** "HMO" and "PPO" name plan structures, not networks, so an unqualified
  list would mislead a patient whose HMO has no contract here — the same harm
  the fabricated list could have caused. **The prohibition on carrier names,
  carrier logos and "most major plans" stands unchanged**, and is verified
  absent from the live HTML.

  The `.insurance-list` CSS that styled the fabricated carriers as a monochrome
  logo wall was deleted at the same time. It had outlived its list by a year —
  defined in all three insurance pages, referenced by no markup in any of them.
  Dead style is not neutral here: a logo-wall rule sitting ready in the file
  invites someone to fill it, and the thing it wants is the carrier list.
  `.coverage-list` replaces it and is deliberately a plain list, because plan
  types are not brands and should not carry a logo wall's visual weight.
- ~~ABP specialty wording~~ — **confirmed by Dr. Chang 2026-08-09**, relayed by
  the owner, who put the question to him directly. "Anatomic Pathology &
  Clinical Pathology" is approved as it stands. **Do not re-raise.** Worth
  keeping in mind, though: that phrasing originated in the **original scaffold**
  — the same source that fabricated the map embed and the carrier list — and it
  happened to be right. That is luck, not evidence, and it is not a reason to
  trust the scaffold's other output. The 1973 date is separately corroborated by
  Doximity.
- ~~Immigration medical exams~~ — confirmed 2026-07-29: Dr. Chang is listed in
  the USCIS Find a Doctor locator, i.e. he holds the **civil surgeon
  designation** and may complete **Form I-693**. Recorded as
  `practice.civilSurgeon`. Note the term misleads — "civil surgeon" is a USCIS
  designation for licensed physicians of any specialty, not a surgical
  qualification.
- **The Ph.D. is asserted, not evidenced.** Added 2026-08-05 on Dr. Chang's own
  say-so, relayed by the owner, after the concern was raised and he confirmed.
  Nothing else corroborates it: this repo held M.D. only, and his Healthgrades
  and Doximity profiles list M.D. only. **The owner's own detailed credentials
  list of 2026-08-06 also omits it** — it names ABFM, ABP and the National Taiwan
  University medical degree, and no doctorate. That was raised with the site
  owner on 2026-08-07 and he chose to leave it live. Recorded, not re-litigated;
  do not raise it again unless new evidence appears. **Institution, field and year are all
  unknown**, which is why it appears in `doctorName`/`credentials` and
  deliberately *not* in `education` — putting it there would assert that
  National Taiwan University granted it. Fill `education` in properly once those
  three facts arrive.
- **Stem cell therapy copy is minimal, live, and now confirmed as sufficient.**
  Dr. Chang was asked on 2026-08-09 and the answer was that nothing changes. The
  copy on `services.astro` therefore stays exactly as it is: it says the service
  exists, that it is by appointment only, and to call. It asserts no benefit,
  indication, success rate or safety claim, and it is deliberately excluded from
  the JSON-LD in `JsonLd.astro`.

  **Read that confirmation precisely. He approved the copy; he did not supply
  the specifics.** The type of product or procedure, the indications and the
  regulatory basis are *still unknown here*. So the prohibition is unchanged and
  is now permanent rather than pending: **do not expand this section.** There is
  nothing to expand it from, and the FDA and FTC have both acted on marketing
  claims for unapproved stem cell products. "The owner said the copy is fine"
  is not a source for a claim the copy does not make.
- **Medical-legal report scope: confirmed general, 2026-08-09.** Dr. Chang was
  asked and the answer was that nothing changes, so the deliberately general
  wording stands. It remains unknown — and unpublished — whether the service
  covers personal injury, IMEs, disability or workers' comp, who may instruct,
  and whether testimony is offered. Do not add any of that; none of it was
  supplied. The `TODO` in `services.astro` is resolved as "stays general".
- **Wake Forest University.** The owner asked whether Dr. Chang has a connection.
  Nothing was found in `practice.ts`, Healthgrades, Doximity, or search. His ABFM
  certification (1978) postdates his pathology residency (ended 1973), so a family
  practice residency in that gap would fit — but that is a hypothesis. Publish
  nothing on it without Dr. Chang confirming. The Arcadia History Collection's
  57 records (below) mention it nowhere either — another negative, still not
  proof of absence.
- **The Arcadia History Collection, and why its search must never be linked.**
  The Arcadia Public Library indexes **57 records** naming Dr. Chang at
  `arcadiahistory.andornot.net`. It is the only *public archival* corroboration
  this repo has for anything on the About page, and it confirmed the Apr–Jul
  2003 rotating mayoralty independently of the owner's bio. Two facts came from
  it and are now live in all three locales: he was the first Chinese-American
  Arcadia City Council member (1994) and the city's first Chinese-American mayor
  (2003), both per *Arcadia Weekly*.

  **Link individual permalinks only. Never link the search results.** The same
  57-record run also indexes a 2003 accusation that he embezzled ~$420,000 from
  the Access IPA medical group — which he denied, explaining he had moved funds
  between banks and moved them back, and over which he sued the two accusing
  doctors for libel — plus a 1994 election-fraud suit a judge dismissed for
  insufficient evidence. **The archive records no outcome for the embezzlement
  matter.** Linking the search would put those one click from a patient and give
  crawlers a path to them. `newspaper31226` additionally calls him Arcadia's
  first *Asian*-American mayor; that is deliberately off the page as a broader
  claim resting on one sentence.

  The collection's own terms prohibit reproducing its items in any form without
  written permission, so its photographs — including a c.1996 portrait and the
  1995 library groundbreaking — may be linked but never copied into `public/`.
  **The owner emailed `ref247@ArcadiaCA.gov` on or before 2026-08-09 and is
  awaiting a reply.** The images are deferred until it arrives; that is his
  decision, not an oversight. The prohibition on copying stands until written
  permission is actually in hand — an unanswered request is not permission.
- **No video of Dr. Chang has ever been found**, in English or Chinese, despite
  targeted searching. Chinese-language press coverage is likewise near-absent:
  the only hit for 張勝雄 is zh.wikipedia's Arcadia article listing him among
  three Chinese council members. 世界日報 / 星島日報 archives from that era are
  largely unindexed, so this is weak evidence, not a finding.
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
npm run dev                          # http://localhost:3120
ALLOW_INDEXING=true npm run build    # 22 pages; postbuild runs verify-css + verify-build
npm test                             # 101 vitest tests
```

**`npm run build` on its own fails locally, and that is expected.** `ALLOW_INDEXING`
is set only in `.github/workflows/deploy.yml`, so without it every reviewed page
is built `noindex` while the sitemap still lists it — and `verify-build.mjs`
correctly refuses a build whose sitemap and robots meta contradict each other.
It reports all ten English pages, which reads alarmingly like a real regression.
Pass the variable to reproduce what CI actually does.

Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`, with global
styles and the theme in `src/styles/global.css`. Design tokens live in
`tailwind.config.ts`, loaded by the `@config` directive. Utility classes will
silently do nothing if that plugin is ever removed — verify visually after
touching the build config.

## Tests

Six files, 101 tests, run with `npm test`:

- `tests/i18n/locale-coverage.test.ts` — the i18n layer. Also asserts that
  `getTranslation` returns an empty string **as-is** rather than treating it as
  missing, and that no locale leaves a value empty — **including `en`**. The
  emptiness check used to iterate the two Chinese locales only, so `en` was
  structurally outside what it could see, and a footer key with an empty English
  value made `getTranslation`'s old `return value || key` render the literal text
  `footer.englishOnly` on every English page
- `tests/i18n/shared-component-labels.test.ts` — no shared component may carry a
  literal `aria-label`, `title`, `alt` or `data-label`. A literal there cannot
  vary by locale, so it renders English on every Chinese page. Six shipped that
  way and reached screen-reader users on all 12 Chinese pages; four of the six
  had translations sitting unused in `locales.ts`. The test matches literals and
  ignores `{expressions}`, so it flags the defect by construction rather than by
  trying to detect English. Both of the above are written up in
  [`docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md`](docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md)
- `tests/data/source-integrity.test.ts` — guards facts against being stored
  twice: the address must stay derived from `addressParts`, no file outside
  `practice.ts` may restate the address or phone, no hardcoded map URLs, place
  ids or coordinates, and no locale key may be defined without a page reading it.
  That last rule used to name `serviceCards` explicitly, so `patientScope` and
  `coverage` were structurally outside what it could see when they were added on
  2026-08-07 — the same shape as the emptiness check that iterated only the two
  Chinese locales. It now derives the block list from `translations.en` itself,
  so the next block added is covered without anyone remembering
- `tests/i18n/taiwan-register.test.ts` — both Chinese locales stay Taiwan
  Mandarin. Two assertions, and the second is the one that matters. A banned-word
  table catches known mainland forms; **cross-locale parity** requires the Taiwan
  form's count in `zh-hant` to equal its simplified twin's count in `zh-hans`,
  which needs no vocabulary knowledge and so catches words nobody listed. That
  distinction is not theoretical: a wordlist sweep let `医生` through 31 times,
  and the sweep that fixed `医生` let seven further concepts through. Its corpus
  is the locale-forked pages **plus** each locale's subtree of `locales.ts` —
  `普通话` hid in `practiceLocalized.languages` and rendered under the homepage
  看诊语言 heading, invisible to a pages-only sweep
- `tests/routes/robots-gate.test.ts` — the `ALLOW_INDEXING` gate in both states,
  which `verify-build.mjs` cannot cover because it only ever sees one build
- `tests/styles/theme-token-coverage.test.ts` — the hand-maintained colour map
  in `global.css`. Fails if any themed utility class used in a template is not
  redeclared against a token, **including its `hover:` variant**, which Tailwind
  emits at higher specificity. Four instances of that omission shipped on
  2026-08-05; the first three were found by eye, one pass at a time, and the
  fourth (`hover:bg-primary-50`, a near-white panel under amber text) was found
  by this test. It also asserts the dark block still redefines `--brand`, since
  every other assertion here passes if it stops

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
