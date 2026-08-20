# Design: a dililaw.com-inspired redesign

**Date:** 2026-08-19
**Status:** design approved in conversation; chop and photographs deferred by the owner
**Requested by:** the site owner, relaying a reference site he wants the practice to resemble

## Goal

Restyle the site to resemble [dililaw.com](https://www.dililaw.com/) — a law firm in
City of Industry serving much the same Chinese-American community — while keeping
everything the site already does correctly: three locales, light and dark themes, the
text-size control, the footer, and the call-now button.

This is a **visual** change. No published fact changes. Hours, address, phone,
credentials, patient scope and coverage all keep coming from `practice.ts` and
`locales.ts` exactly as they do now.

## What dililaw.com actually is

Read from its computed styles in a real browser on 2026-08-19, not from a screenshot.
This matters because the obvious assumption — "a law firm site will have a corporate
navy or gold" — is wrong, and designing from that assumption would have produced
something the owner did not ask for.

| Role | Value |
| --- | --- |
| Header, body ground | `#ffffff` |
| Alternating section | `#f9f9f9` |
| Dark band | `#3f3f3f` |
| Contact block / footer | `#34313b` |
| Text | `#333333`, `#222222` |

**It has no brand color.** Every saturated hex in its stylesheet traces to unused
WordPress block-editor defaults. The only color on the page is the maroon in its own
logo and a green WeChat glyph. Photography carries everything else.

Its other signatures: Lato throughout at weight 300 for display sizes; nav, buttons and
section titles all uppercase with ~1px letter-spacing; **ghost buttons** (transparent
fill, 1px border); a full-bleed photographic hero with centered white text; and a
language item (`中文`) as the last nav entry.

Two things about it we are deliberately **not** copying: its hero image is served from
`http://dililaw.sitevance.com`, a stale dev host over plain HTTP, and its nav offers no
theme or text-size control.

## Decisions

| Decision | Choice | Who |
| --- | --- | --- |
| How literally to mimic the palette | Achromatic surfaces, one red accent | Owner |
| Stem cell therapy section | Keep exactly as-is | Owner |
| Logo direction | Square name chop | Owner |
| Chop script, layout, impression | **Deferred** | Owner, 2026-08-19 |
| Logo script for all locales | Traditional `張` everywhere | Owner |
| Typeface | Keep Georgia + system sans; **no web fonts** | Delegated to me |
| Charcoal band | Every page, not home only | Owner |
| Photographs | Owner will supply later | Owner |

### On the typeface

dililaw uses Lato. The site currently loads **zero web fonts**, which is part of why it
is fast, and it serves older patients on variable connections. Adopting Lato buys a
letterform difference most visitors will not name and costs a render-blocking download
on every visit.

What actually makes dililaw's pages feel the way they do is the *treatment* — uppercase,
letter-spaced, light weights, generous space — and that is free. So: Georgia stays for
display, the system sans stays for everything else, and the treatment changes.

## The token system

`--brand` currently inverts **red → amber** between themes. That is a hue change, and it
is the direct cause of the two worst UI bugs this repo has recorded. The new palette keeps
a red in both themes and moves only lightness.

**The existing token names stay.** An earlier draft of this spec renamed them to
`--ground` / `--ink` / `--rule`, which would have meant editing every consumer across
`global.css`, five components and a page, to gain nothing. Only the **values** change,
plus three genuinely new tokens for the fixed-dark surfaces the charcoal band needs.

```css
:root {
  --surface:        #ffffff;   /* was #fbf7f4 — the warm cast goes */
  --surface-raised: #ffffff;
  --surface-sunken: #f7f6f4;   /* the alternating band */
  --surface-accent: #f7f4f4;   /* was pink-tinted #fbeeec */
  --surface-info:   #eef1f1;

  --text-strong:    #2b2a28;
  --text:           #46443f;
  --text-muted:     #6f6b65;

  --line:           #e3e0db;

  --brand:          #8a2f3c;   /* unchanged */
  --brand-strong:   #6f2531;   /* unchanged */
  --brand-contrast: #ffffff;

  /* NEW — dark in BOTH themes. See the note below. */
  --surface-dark:   #3f3f3f;
  --surface-deep:   #34313b;
  --on-dark:        #ffffff;
}

html[data-theme='dark'] {
  --surface:        #1a191d;
  --surface-raised: #212026;
  --surface-sunken: #17161a;
  --surface-accent: #241f21;
  --surface-info:   #1c2224;

  --text-strong:    #eae7e2;
  --text:           #cfcac3;
  --text-muted:     #948f88;

  --line:           #38363d;

  --brand:          #d99aa4;   /* was #e8b96b amber — the hue no longer changes */
  --brand-strong:   #e9b3bb;
  --brand-contrast: #26161a;

  --surface-dark:   #2c2b31;
  --surface-deep:   #34313b;
  --on-dark:        #ffffff;
}
```

`--surface-dark` and `--surface-deep` are dark in **both** themes on purpose, and
`--on-dark` is white in both to match. That is the one legitimate fixed light text color
on this site: the surface does not invert, so its contrast pair does not either. It needs
a comment where it is declared, or a future reader applying the color rule will "fix" it
into a bug.

Three tokens are worth resolving while we are in here. `--surface-info` and `--accent`
are **read by nothing** — dead tokens, and dead style is what `.insurance-list` taught
this repo to distrust. `--secondary` and `--positive` are each read by exactly one rule
in `global.css`. Delete what is dead; keep and re-value what is live.

### Contrast, computed

Computed from the hex values above with the WCAG formula. Every pair clears AAA.

| Pair | Ratio |
| --- | --- |
| `--brand` on `--surface` (light) | 8.23:1 |
| `--brand` on `--surface-sunken` (light) | 7.62:1 |
| `--text-strong` on `--surface` (light) | 14.34:1 |
| `--on-dark` on `--surface-dark` | 10.53:1 |
| `--on-dark` on `--surface-deep` | 12.74:1 |
| `--brand` on `--surface` (dark) | 7.59:1 |
| `--brand` on `--surface-raised` (dark) | 7.01:1 |
| `--text-strong` on `--surface` (dark) | 14.18:1 |
| `--brand-contrast` on `--brand` (light) | 8.23:1 |
| `--brand-contrast` on `--brand` (dark) | 7.51:1 |
| `--on-dark` on the hero overlay | 11.60:1 |

**These are arithmetic, not measurement.** They prove the palette is sound; they do not
prove the built page renders it. The computed color of every one of these must be read
out of a real browser in both themes, **including hover**, before merge. A resting
screenshot in one theme is not evidence.

## The utility-class remap — the highest-risk part of this change

Templates use 13 themed Tailwind palette classes, 150 occurrences:

| Class | Uses | | Class | Uses |
| --- | --- | --- | --- | --- |
| `text-primary-600` | 48 | | `bg-primary-600` | 8 |
| `bg-primary-50` | 31 | | `border-primary-600` | 6 |
| `text-primary-700` | 27 | | `bg-primary-100` | 4 |
| `border-primary-200` | 16 | | `border-primary-300` | 2 |
| `bg-primary-700` | 8 | | `hover:bg-primary-700` | 7 |
| `hover:text-primary-700` | 5 | | `hover:bg-primary-50` | 3 |
| `hover:text-primary-600` | 2 | | | |

Each resolves to a literal hex unless `global.css` redeclares it against a token. All 13
are currently mapped and `tests/styles/theme-token-coverage.test.ts` guards that. **The
map must be updated in the same commit as the token block, and no class may be dropped
from it.** Four instances of exactly this omission shipped on 2026-08-05; three were
found by eye one pass at a time and the fourth by that test.

Where a restyle removes the last use of a class, remove it from the map too — a stale
entry is the same hazard as `.insurance-list` was.

## Components

| File | Change |
| --- | --- |
| `src/styles/global.css` | Token blocks and the 13-class map |
| `tailwind.config.ts` | Palette values behind the tokens |
| `src/components/Navigation.astro` | Uppercase, 11.5px, 1.1px tracking; brand underline on active |
| `src/components/Header.astro` | Logo lockup; utility row for language, theme, text size |
| `src/components/HeroSection.astro` | Optional full-bleed image, dark overlay, ghost CTA |
| `src/components/CallButton.astro` | Ghost variant for use over photographs |
| `src/components/Logo.astro` | **New.** Wraps the mark; placeholder today, chop later |
| `src/layouts/BaseLayout.astro` | Footer restyle to `--surface-deep`; favicon reference |
| `MobileNav`, `StickyCallBar`, `ThemeToggle`, `FontSizeControl`, `LanguageSwitcher`, `Breadcrumb`, `ServiceCard` | Restyle only, no behavior change |
| `src/pages/services.astro` ×3 | Regroup into the owner's two groups |
| `src/i18n/locales.ts` | Three new group headings ×3 locales |
| `.gitignore` | Add `.playwright-mcp/` |

### `Logo.astro` and the deferred chop

The chop's layout, script and impression are undecided. The mark therefore lands as a
component with the **current** red rounded square and `SC` — which is already the site's
favicon, so nothing regresses — and a single documented swap point.

The chop, when chosen, must be an **outlined SVG path, not live text**. A CJK character
left as text renders in whatever font the visitor has, so the logo would differ between
a Windows PC and an iPhone. Note in the component that editing the mark later means
redrawing it.

Also recorded, because it is a real limitation and not a preference: none of the six
faces available on the build machine is 篆書 seal script, which is what an authentic
name chop uses. The honest options are a legible stand-in, a licensed seal font with the
glyphs outlined, or a Chinese type designer. Do not describe a clerical-script mark as a
traditional seal.

### Heroes

`HeroSection` takes an optional image and **falls back to flat `--surface-dark` when there
is none**. This is what lets the redesign ship before the photographs arrive; each image
then drops in without touching layout.

Slots and sizes, for when the owner supplies them: home 2400×1200; about, services and
location 2400×1000. A dark overlay sits over every hero so white text stays legible.
Images with an identifiable patient need written permission, so staff and empty rooms are
the safe path.

## Services restructure

The six services the owner listed are **already live**. Nothing was deleted. The change
is grouping, which the page does not currently do:

- **Services Provided** — general acute and chronic illness, diagnosis and treatment;
  specialist referral where indicated, prior authorization may be needed; accepting new
  patients.
- **Social Services Provided** — immigration physical, Form I-693; citizenship exam
  waiver medical report, Form N-648; general medico-legal report.
- **Also Offered** — stem cell therapy, by appointment. Its own heading because it
  belongs to neither group. Copy unchanged, per Dr. Chang's confirmation of 2026-08-09.

The owner dictated "I 648". **The form is N-648**, the Medical Certification for
Disability Exceptions filed with the N-400; there is no Form I-648. The site already says
N-648 correctly. No change, recorded so nobody "corrects" it later.

### The trilingual obligation

Three new group headings are user-facing English strings, so they land in `zh-hant` and
`zh-hans` **in the same commit**, in Taiwan Mandarin in both scripts. They go in
`locales.ts` and are read with `getTranslation` — not inlined into the pages, and not
into a component's own map.

`社會服務` is the natural rendering of "social services" and is Taiwan usage. Avoid
`社會福利`, which names government welfare programs and would misdescribe what these are.

`tests/data/source-integrity.test.ts` derives its block list from `translations.en`, so
the new block is covered automatically — but each key still needs a page that reads it or
that test fails, which is the intended behavior.

## Invariants this change must not break

- No hardcoded `black`, `white`, `#000`, `#fff` or palette literal on a branded or
  inverting surface. The two fixed-dark surfaces above are the documented exception.
- No heading may pin its own color inside a colored surface.
- American English throughout, in copy, comments and commit messages.
- No new copy of any fact from `practice.ts`. No address, phone, place id, coordinate or
  map URL outside that file — `source-integrity` fails the build on it.
- No carrier names, carrier logos or "most major plans" anywhere.
- Both Chinese locales stay `reviewed: false`, therefore `noindex`.
- No Chinese string in a shared component.

## Verification

Nothing here is done because it builds. Before merge:

1. `npx tsc --noEmit`, then `npm test` — 162 tests plus whatever this adds.
2. `ALLOW_INDEXING=true npm run build` — the plain form fails locally by design.
3. **Read computed colors out of a real browser**, light and dark, resting *and* hover,
   for: nav links, active nav, the phone CTA in the header, the hero ghost button, the
   footer, and links in body copy. The phone number on hover is the specific case that
   shipped at 1.67:1 before.
4. Load all 22 pages in both themes at 375px and 1440px.
5. Confirm the text-size control still scales type in the restyled header, and that the
   language switcher still reaches all three locales.
6. Confirm no Chinese page renders an English string from `practice.*`.

Report what was checked and how. Do not report a subagent's or a tool's claim as a
result.

## Rollout

Branch, PR, merge — never straight to `main`. Split into reviewable PRs:

1. Tokens, the 13-class map, `.gitignore`. No visual restructuring. Easiest to verify in
   isolation and the riskiest to get wrong.
2. Header, navigation, `Logo.astro`, footer.
3. `HeroSection` with the image-optional pattern.
4. Services regrouping and its three locale keys.

Each PR body states what was verified and what remains unconfirmed.

## Deferred, not forgotten

- **The chop** — layout (traditional `張` right vs western `張` left), script, and
  白文/朱文 impression. The owner will decide. Traditional order is right-column-first;
  he described the mirror, and that was flagged rather than silently corrected.
- **The photographs** — four slots. The hero ships working without them.
- **A real seal-script mark** — needs a licensed font or a designer.
