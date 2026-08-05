---
title: 'A fact copied into a second place drifts, and the fix reaches only one copy'
date: 2026-08-05
category: logic-errors
problem_type: duplicated_source_of_truth
component: src/data/practice.ts / JsonLd.astro / trilingual page set / sitemap
severity: high
symptoms:
  - 'a defect is corrected on the English page and the Chinese pages keep it'
  - 'a fabricated value is removed from a page body while the hero and meta description still assert it'
  - 'two elements on the same page derive the same URL differently; one is hardcoded'
  - 'structured data and visible page copy state different versions of the same fact'
  - 'grepping for the strings you just changed reports success while the defect is still live'
  - 'typecheck, unit tests and the build all pass with the contradiction shipped'
  - 'a sitemap lists exactly the pages that must not be indexed and omits the ones that should be'
  - 'passing tests exercise a data structure no page actually renders'
stack:
  - Astro 5
  - TypeScript
  - vitest
  - '@astrojs/sitemap'
  - GitHub Pages
recurrence_risk: 'high — every new fact added to practice.ts or to one locale is a chance to create copy number two; the failure is structural, not a lapse of attention'
tags:
  - single-source-of-truth
  - i18n
  - content-integrity
  - silent-failure
  - structured-data
  - seo
  - verification-bias
  - build-output-assertions
  - medical-accuracy
---

# A fact copied into a second place drifts, and the fix reaches only one copy

> **Category note.** Filed under `logic-errors`: nothing threw, nothing failed
> to compile, and every page rendered. The defect is that one fact was stored in
> two or more places, so correcting it in one left the others asserting the old
> version. `content-qa` would describe the symptom; duplication is the cause.

This is a companion to
[`shared-data-module-locale-strings.md`](shared-data-module-locale-strings.md).
That one is about a fact stored in the *wrong form* (English strings where
locale-neutral data belonged). This one is about a fact stored in the *wrong
number of places*.

## Symptom

On 2026-08-05 the same failure appeared **six times in one working session** on
a live medical practice site. Each time, a real defect had been fixed — and each
time the fix reached one copy of the fact and not the others.

| # | The fact | Fixed in | Still wrong in |
|---|---|---|---|
| 1 | Dr. Chang's postgraduate training | — | `about.astro` **and both Chinese About pages** all claimed "family medicine and internal medicine at University of Alabama Hospital". It was a **pathology** residency. |
| 2 | The office's Google Maps embed URL | English `location.astro`, in an earlier session | **Both Chinese location pages**, still serving a fabricated `maps/embed?pb=…` URL with invented place ids (`0x…f8f8f8f8f9:0x1234567890`, `4v1234567890`) |
| 3 | Which insurance carriers are accepted | the page body, all three locales | the **hero subtitle and meta description** on all three, which kept promising "accepted insurance plans and flexible payment options" for the following hour |
| 4 | The office address, as a directions link | the `<iframe>` on both Chinese location pages | the `<a>` **immediately below it on the same page**, hardcoding the address into a query string — missed in the same edit, in the same session |
| 5 | The postal address | `practice.address` | `JsonLd.astro` held **two further hardcoded copies** of `streetAddress`, in the data search engines and assistants actually read |
| 6 | Each service's display name | `locales.ts` `serviceCards` | three `index.astro` files with the names hardcoded — four copies per locale, and `serviceCards` was read by nothing but tests |

Incident 4 is the sharpest. The fabricated map URL in incident 2 was fixed
*that morning*, by someone (me) who was specifically looking for hardcoded map
URLs, on that exact file — and the anchor tag six lines below the iframe was
still hardcoded. Knowing about the failure mode did not prevent it.

## Why it evaded detection

Every one of these passed the full gate:

- `npx tsc --noEmit` — clean. Duplicated string literals are all valid.
- `npm test` (42 tests) — clean. The suite covers locale key coverage, not
  whether two places agree.
- `npm run build` + `verify-css.mjs` — clean. Nothing about a build detects
  that a page contradicts itself.

The deeper reason is **verification bias**, which `CLAUDE.md` already warns
about and which this session demonstrated repeatedly:

> Verify against the invariant, not against your diff. Grepping for the strings
> you just fixed proves only that you fixed them.

After removing the carrier list from the insurance body, `grep -c Aetna` on the
page returned `0`. That was true and it was not the question. The question was
whether the *page as a whole* still claimed to accept specific plans — and the
hero, three elements above, did.

A related trap appeared in the sitemap. Its filter returned `true` for English
only at `/` and `/404`, so every English subpage was omitted while every
`noindex` Chinese page was listed — **exactly inverted**. It produced a valid,
well-formed sitemap. Nothing failed. The site simply would not have ranked.

And one self-inflicted case worth recording: 15 tests were added asserting that
`serviceCards` labels exist in every locale. They passed. They were also
meaningless, because no page read `serviceCards` — the cards used hardcoded
strings. **A test that cannot fail for a real reason is worse than no test**,
because "42 passing" was then quoted as evidence several times.

## Root cause

One fact, stored more than once, with no mechanism forcing the copies to agree.

Duplication arrives in three ways here, and all three are easy to introduce:

1. **Across locales.** A trilingual site triples every piece of prose. A
   correction applied to `src/pages/x.astro` has two siblings under
   `zh-hant/` and `zh-hans/` that no tool associates with it.
2. **Across representations.** The same address exists as human-readable prose,
   as a URL query parameter, and as JSON-LD fields. Each looks like different
   content and is the same fact.
3. **Across page regions.** Body copy, hero subtitle, `<title>` and
   `description` all restate the page's claim. Fixing "the page" usually means
   fixing the part being read at the time.

The common structure: **the second copy has no reason to exist**, but once it
does, correctness depends on a human remembering it.

## Solution

### 1. Delete the copy rather than guarding it

The address became parts, with the display string derived:

```ts
// src/data/practice.ts
const addressParts: AddressParts = {
  street: '330 W. Las Tunas Drive, Suite 3',
  locality: 'San Gabriel',
  region: 'CA',
  postalCode: '91776',
  country: 'US',
};

export const practice: PracticeInfo = {
  // Derived. Never edit directly.
  address: `${addressParts.street}, ${addressParts.locality}, ${addressParts.region} ${addressParts.postalCode}`,
  addressParts,
  // …
};
```

`JsonLd.astro` then builds `PostalAddress` from `practice.addressParts`, and
every map or directions URL derives from `practice.address`:

```astro
const addressQuery = encodeURIComponent(practice.address);
const mapEmbedUrl         = `https://www.google.com/maps?q=${addressQuery}&output=embed`;
const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;
const appleDirectionsUrl  = `https://maps.apple.com/?daddr=${addressQuery}`;
```

Service names moved the same way — the cards now read
`t('serviceCards.immigrationExams')` instead of restating the label, which both
removes three copies per locale and makes the previously-dead tests real.

### 2. Tie related switches to one another

The sitemap filter now reads the same `reviewed` flag that drives the `noindex`
meta tag, so "listed in the sitemap" and "not `noindex`" cannot disagree:

```js
// astro.config.mjs
filter: (page) => {
  const pathname = new URL(page).pathname;
  if (pathname.startsWith('/404')) return false;
  const segment = pathname.split('/')[1];
  const locale = LOCALE_KEYS.includes(segment) ? segment : 'en';
  return locales[locale]?.reviewed === true;
},
```

`robots.txt` moved from a static file to `src/pages/robots.txt.ts`, deriving
from `Astro.site` and reading the same `ALLOW_INDEXING` gate as the meta tag.

### 3. Omit rather than publish an unverified value

`JsonLd.astro` carried `latitude: 34.0853, longitude: -118.1085`, hardcoded and
never verified. Structured-data `geo` is what places the pin on a map, so a
wrong value sends a patient to the wrong building. It was **removed, not
corrected** — a search engine geocodes the postal address on its own, so
omitting costs nothing, and no plausible-looking number is asserted on the
practice's behalf.

## Prevention

### Assert on the built output

The decisive addition. `scripts/verify-build.mjs` runs from `postbuild` beside
`verify-css.mjs`, and every check is a defect that actually shipped:

| Check | Caught defect |
|---|---|
| every referenced same-origin asset exists | `/og-image.png` and `/logo.svg` both 404'd, breaking every link preview |
| no `noindex` page appears in the sitemap | all Chinese pages were listed |
| every indexable page appears in the sitemap | every English subpage was missing |
| JSON-LD `streetAddress` equals `practice.ts` | three copies of the address existed |
| no page references the retired host | `SITE_URL` pointed at a domain that 404s |

These are *contradiction* checks, not correctness checks. They ask whether the
output disagrees with itself or with its source — which is precisely the class
that typecheck, unit tests and a green build cannot see.

**Each check was validated by reintroducing its bug into `dist/` and confirming
the script fails with the right message, then confirming it passes clean.**
Given that this same session shipped 15 tests that could not fail, adding
assertions on faith was not acceptable:

```
1 missing asset        caught → referenced asset missing from build: /logo.svg
2 noindex in sitemap   caught → sitemap lists a noindex page: /zh-hant/
3 address drift        caught → streetAddress "999 Wrong Street" != practice.ts
4 retired host         caught → references the retired bahtzang.com host
5 missing from sitemap caught → indexable page missing from sitemap: /about/
```

### Search for the shape, not the string

After any content fix, grep for the *pattern* of the defect across the whole
built site, not the text just edited:

```bash
npm run build
cd dist
grep -ril "aetna\|cigna\|most major insurance"   # the claim, not the line
grep -rhoE '<iframe[^>]*src="[^"]*"' . | sort -u  # every embed, not the one fixed
grep -rn "34\.08\|118\.1" .                       # coordinates anywhere
```

The fabricated map URL in incident 2 surfaced from a `<iframe src>` dump run
while checking something unrelated — broadening a check by one adjacent
question is where these fall out.

### Treat locales as one edit

A change to `src/pages/x.astro` is not finished until `zh-hant/x.astro` and
`zh-hans/x.astro` are checked. Compare **rendered text**, not structure —
matching section ids proved the pages had the same skeleton and said nothing
about the words inside. That is how the Ph.D. reached English headlines and not
Chinese ones despite an otherwise-clean structural audit.

### Before adding a test, make it fail

If a new test cannot be made to fail by breaking the thing it claims to guard,
it is measuring nothing. Confirm the failure first, then confirm the pass.

## Related

- [`shared-data-module-locale-strings.md`](shared-data-module-locale-strings.md)
  — the same file, `practice.ts`, storing facts in a form that leaked English
  onto Chinese pages. Same root theme: where a fact lives determines whether it
  can go wrong.
- [`../integration-issues/tailwind-v4-astro-silently-uncompiled.md`](../integration-issues/tailwind-v4-astro-silently-uncompiled.md)
  — the original "everything passes, nothing works" incident, and the reason
  `verify-css.mjs` exists. `verify-build.mjs` extends that pattern from
  "did CSS compile" to "does the output contradict itself".

## Separate incident found the same day

Not duplication, but recorded here because it was found by the same sweep and
is the most harmful thing on the list. **The contact form never sent anything.**
Its handler called `preventDefault()`, showed *"Thank you for your message! We
will get back to you soon"*, and reset the fields; the code comment called it a
demo. English and Simplified Chinese carried a "Demo Form" notice *below the
fields*, where it is read after filling them in. **Traditional Chinese carried
no notice at all.** A patient describing a health concern was told the practice
would respond, and nobody ever saw it.

Replaced in all three locales with the phone number and practice email. The
lesson is narrower and worth stating plainly: **demo scaffolding on a
production medical site is a live defect, not a placeholder.** Nothing in a
build can detect "this button lies" — only reading what the handler does when a
user presses it.
