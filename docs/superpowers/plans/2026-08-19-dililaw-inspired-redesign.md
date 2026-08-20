# dililaw-Inspired Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle shengchangmd.com to resemble dililaw.com — achromatic surfaces, uppercase navigation, ghost buttons, a full-bleed photographic hero, and a charcoal band — without changing a single published fact.

**Architecture:** The site already re-points Tailwind's fixed palette classes at CSS custom properties in `src/styles/global.css`. This redesign changes the **values** of those properties and extends the map; it does not introduce a new styling mechanism. Three new tokens (`--surface-dark`, `--surface-deep`, `--on-dark`) describe surfaces that are dark in *both* themes, which is what the charcoal band and the hero overlay need. Component work is restyling plus one new `Logo.astro` seam for the deferred chop.

**Tech Stack:** Astro 5, Tailwind v4 via `@tailwindcss/vite`, vitest, TypeScript.

**Spec:** [`docs/superpowers/specs/2026-08-19-dililaw-inspired-redesign-design.md`](../specs/2026-08-19-dililaw-inspired-redesign-design.md)

## Global Constraints

Every task's requirements implicitly include all of these.

- **American English** in copy, comments, and commit messages. `pediatric`, `gynecology`, `authorization`, `license`, `color`, `center`.
- **Any user-facing English string change lands in `zh-hant` and `zh-hans` in the same commit.** Both Chinese locales are Taiwan Mandarin in both scripts. Never `信息`/`网络`/`医生`/`联系`/`普通话`/`健保`; use `资讯`/`网路`/`医师`/`联络`/`国语`. Full-width punctuation.
- **No Chinese string in a shared component.** All translations live in `src/i18n/locales.ts`, read with `getTranslation(locale, key)`.
- **Never hardcode `black`, `white`, `#000`, `#fff`, or a Tailwind palette literal** on a surface that inverts between themes. The only exception is `--surface-dark` / `--surface-deep`, which are dark in both themes by design.
- **Never pin a heading's color** inside a colored surface.
- **No fact may be copied out of `src/data/practice.ts`.** No address, phone, place id, latitude/longitude or map URL anywhere else — `tests/data/source-integrity.test.ts` fails the build on it.
- **No carrier names, no carrier logos, no "most major plans"** anywhere, ever.
- Both Chinese locales stay `reviewed: false`, therefore `noindex`.
- Branch → commit → push → PR → merge. **Never commit to `main`.** Never `git push -u origin main`.
- `npm run build` fails locally by design. Use `ALLOW_INDEXING=true npm run build`.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/styles/global.css` | Token values; the Tailwind-class → token map | 1, 2 |
| `tests/styles/theme-token-coverage.test.ts` | Extended with a hue-stability and a contrast assertion | 1 |
| `tests/styles/contrast.test.ts` | **New.** Computes WCAG ratios from the token block | 1 |
| `src/components/Logo.astro` | **New.** The mark, with one documented swap point | 3 |
| `src/components/Navigation.astro` | Desktop nav, uppercase treatment | 4 |
| `src/components/Header.astro` | Logo lockup and the utility row | 4 |
| `src/layouts/BaseLayout.astro` | Footer surface; favicon reference | 5 |
| `src/components/HeroSection.astro` | Optional full-bleed image, overlay, ghost CTA | 6 |
| `src/components/CallButton.astro` | `ghost` variant | 6 |
| `src/pages/services.astro` + `zh-hant` + `zh-hans` | The owner's two service groups | 7 |
| `src/i18n/locales.ts` | Three group headings × three locales | 7 |

---

### Task 1: Retone the palette, and make the invariant testable

The point of this redesign's palette is that **`--brand` keeps its hue across themes** instead of swinging red → amber. That is a structural property, so it gets a test rather than a promise. A second new test computes contrast from the token block itself, which is the only check here that could have caught the 1.67:1 hover bug before a human noticed it.

Write the tests first. They must fail against the *current* amber palette.

**Files:**
- Create: `tests/styles/contrast.test.ts`
- Modify: `src/styles/global.css:32-83` (both token blocks)

**Interfaces:**
- Consumes: nothing.
- Produces: the token names `--surface`, `--surface-raised`, `--surface-sunken`, `--surface-accent`, `--text-strong`, `--text`, `--text-muted`, `--line`, `--brand`, `--brand-strong`, `--brand-contrast`, `--surface-dark`, `--surface-deep`, `--on-dark`, each defined in both `:root` and `html[data-theme='dark']`. Tasks 2–7 style against these names only.

- [ ] **Step 1: Write the failing test**

Create `tests/styles/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Computes WCAG contrast from the token block in global.css.
 *
 * Every other check in this repo reads source or built HTML. None of them
 * resolves a color, which is why `.hover:text-primary-700` shipped at 1.67:1
 * on the practice's primary call to action and was found by eye, on the third
 * pass. Arithmetic on the declared tokens is not a substitute for reading the
 * computed value out of a browser, but it is the part a machine can own.
 *
 * It also pins the redesign's central claim: --brand keeps its hue between
 * themes. The old palette swung deep red to amber, a hue change, and every
 * contrast failure this repo has recorded traces back to it.
 */

const CSS = readFileSync(
  fileURLToPath(new URL('../../src/styles/global.css', import.meta.url)),
  'utf8'
);

/** The first `:root { … }` block, and the first dark block. Tokens only. */
function tokenBlock(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`no ${selector} block in global.css`);
  const open = CSS.indexOf('{', start);
  let depth = 0;
  let end = CSS.length;
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  const out: Record<string, string> = {};
  for (const m of CSS.slice(open, end).matchAll(/(--[a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const LIGHT = tokenBlock(':root');
const DARK = tokenBlock("html[data-theme='dark']");

function rgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb(hex).map((v) => f(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue in degrees, 0–360. Achromatic colors return 0. */
function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** Smallest angle between two hues, so 359° and 1° are 2° apart. */
function hueGap(a: string, b: string): number {
  const d = Math.abs(hue(a) - hue(b)) % 360;
  return d > 180 ? 360 - d : d;
}

describe('the token blocks parse, so nothing below can pass vacuously', () => {
  it('reads both blocks', () => {
    expect(Object.keys(LIGHT).length).toBeGreaterThan(10);
    expect(Object.keys(DARK).length).toBeGreaterThan(10);
  });

  it('defines every token in both themes', () => {
    const missing = Object.keys(LIGHT).filter((t) => !(t in DARK));
    expect(missing, 'tokens defined in light but not dark fall back to the light value').toEqual([]);
  });
});

describe('--brand keeps its hue between themes', () => {
  it('does not swing to a different color family', () => {
    // The old palette went #8a2f3c (hue ~351) to #e8b96b (hue ~38): a 47-degree
    // gap and a different color entirely. Anything past 25 degrees means the
    // brand is no longer one brand.
    expect(hueGap(LIGHT['--brand'], DARK['--brand'])).toBeLessThan(25);
  });
});

describe('every foreground/background pair the design relies on clears AAA', () => {
  const PAIRS: Array<[string, string, string]> = [
    ['brand on surface', '--brand', '--surface'],
    ['brand on surface-sunken', '--brand', '--surface-sunken'],
    ['brand on surface-raised', '--brand', '--surface-raised'],
    ['text-strong on surface', '--text-strong', '--surface'],
    ['text on surface', '--text', '--surface'],
    ['text-muted on surface', '--text-muted', '--surface'],
    ['brand-contrast on brand', '--brand-contrast', '--brand'],
    ['brand-strong on surface', '--brand-strong', '--surface'],
    ['on-dark on surface-dark', '--on-dark', '--surface-dark'],
    ['on-dark on surface-deep', '--on-dark', '--surface-deep'],
  ];

  for (const [label, fg, bg] of PAIRS) {
    it(`light: ${label}`, () => {
      expect(contrast(LIGHT[fg], LIGHT[bg])).toBeGreaterThanOrEqual(7);
    });
    it(`dark: ${label}`, () => {
      expect(contrast(DARK[fg], DARK[bg])).toBeGreaterThanOrEqual(7);
    });
  }

  it('--text-muted still clears AA even though it is the weakest', () => {
    // Guards against "muted" drifting into decorative-only illegibility.
    expect(contrast(LIGHT['--text-muted'], LIGHT['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK['--text-muted'], DARK['--surface'])).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails against the current palette**

Run: `npx vitest run tests/styles/contrast.test.ts`

Expected: FAIL. Specifically the hue test — current `--brand` is `#8a2f3c` light and `#e8b96b` dark, a gap of roughly 47°. Also expect failures for `--surface-dark`, `--surface-deep` and `--on-dark`, which do not exist yet.

**Do not proceed until you have seen it fail.** Fifteen tests shipped here on 2026-08-05 asserting labels no page rendered, and "42 tests passing" was quoted as evidence several times before anyone noticed they could never fail.

- [ ] **Step 3: Retone both token blocks**

In `src/styles/global.css`, replace the token declarations in `:root` (currently lines 32–55) and `html[data-theme='dark']` (currently lines 57–83) with:

```css
:root {
  color-scheme: light;

  /* dililaw.com's surfaces are achromatic: white, #f9f9f9, #3f3f3f, #34313b.
     The warm off-whites this site used are gone; photography carries the color
     now, and the red is reserved for the mark, links and the phone button. */
  --surface: #ffffff;
  --surface-raised: #ffffff;
  --surface-sunken: #f7f6f4;
  --surface-accent: #f7f4f4;

  --text-strong: #2b2a28;
  --text: #46443f;
  --text-muted: #6f6b65;

  --line: #e3e0db;

  --brand: #8a2f3c;
  --brand-strong: #6f2531;
  --brand-contrast: #ffffff;

  /* These two are dark in BOTH themes, and --on-dark is white in both to
     match. That is deliberate and it is the one place on this site where a
     fixed light foreground is correct: the surface does not invert, so its
     contrast pair does not either. Do not "fix" these into var(--text-strong)
     — that is how you get charcoal text on charcoal in light mode. */
  --surface-dark: #3f3f3f;
  --surface-deep: #34313b;
  --on-dark: #ffffff;

  --positive: #2f6b39;
  --secondary: #1d6a6a;
}

html[data-theme='dark'] {
  color-scheme: dark;

  --surface: #1a191d;
  --surface-raised: #212026;
  --surface-sunken: #17161a;
  --surface-accent: #241f21;

  --text-strong: #eae7e2;
  --text: #cfcac3;
  --text-muted: #948f88;

  --line: #38363d;

  /* Was #e8b96b amber. The hue no longer changes between themes — only
     lightness — which is what tests/styles/contrast.test.ts pins. */
  --brand: #d99aa4;
  --brand-strong: #e9b3bb;
  --brand-contrast: #26161a;

  --surface-dark: #2c2b31;
  --surface-deep: #34313b;
  --on-dark: #ffffff;

  --positive: #74c583;
  --secondary: #5cc9c9;
}
```

Delete `--surface-info` and `--accent` from both blocks. Confirm first that nothing reads them:

```bash
grep -rn "var(--surface-info)\|var(--accent)" src/
```

Expected: no output. If there is output, map those call sites before deleting.

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run tests/styles/contrast.test.ts
npm test
```

Expected: `contrast.test.ts` green; the full suite still green at its previous count plus the new tests.

- [ ] **Step 5: Commit**

```bash
git add -- src/styles/global.css tests/styles/contrast.test.ts
git commit -m "style: retone the palette achromatic, and pin the hue invariant in a test

--brand no longer swings red to amber between themes. It stays red and moves
only lightness, which is the property tests/styles/contrast.test.ts now asserts
directly: a hue gap over 25 degrees fails. The old palette's gap was 47.

The new test also computes WCAG contrast for ten foreground/background pairs in
both themes and requires AAA. Nothing in this repo resolved a color before, and
that is precisely how .hover:text-primary-700 shipped at 1.67:1 on the phone
number and survived two hand passes.

Confirmed failing against the amber palette before the values were changed.

--surface-info and --accent are deleted; grep confirms nothing read them."
```

---

### Task 2: Update the Tailwind-class → token map

`global.css` re-points Tailwind's fixed palette classes at the tokens. Task 1 changed the token values; this task makes sure the map still covers every class in use and that the charcoal band's classes resolve to the fixed-dark tokens.

**Files:**
- Modify: `src/styles/global.css:163-282` (the map block)

**Interfaces:**
- Consumes: the token names from Task 1.
- Produces: `.bg-gray-800` → `var(--surface-dark)` and `.on-dark` → `var(--on-dark)`, used by Tasks 4–7.

- [ ] **Step 1: Confirm the existing map is complete before touching it**

Run: `npx vitest run tests/styles/theme-token-coverage.test.ts`

Expected: PASS. If it fails now, Task 1 broke something — fix that before continuing.

- [ ] **Step 2: Add the fixed-dark surface classes to the map**

Append to the map block in `src/styles/global.css`, after the existing `.border-gray-200` rule:

```css
/* The charcoal band. Dark in both themes by design, so its classes resolve to
   the fixed-dark tokens rather than to --surface-*, and its foreground is
   --on-dark rather than --text-strong. See the token block for why that is the
   one correct fixed light foreground on this site. */
.bg-gray-800 {
  background-color: var(--surface-dark);
}
.bg-gray-900 {
  background-color: var(--surface-deep);
}
.on-dark {
  color: var(--on-dark);
}
```

Note `.bg-gray-900` currently maps to `var(--text-strong)`. Change it to `var(--surface-deep)` — it is used as a dark surface, not as text, and mapping a surface to a text token is what made it invert in the first place.

- [ ] **Step 3: Do not reuse `text-white` on the new dark surfaces**

`tests/styles/theme-token-coverage.test.ts` exempts `text-white` with a specific, conditional reason:

> *always paired with `bg-primary-600`, whose mapped rule sets the label color and is emitted later*

The hero ghost button and the charcoal band are white text with **no** `bg-primary-600` behind them. Using `text-white` there would make that exemption's stated reason false while the test kept passing — a green check that can no longer see the thing it guards.

Use `class="on-dark"` on those surfaces instead. Do not edit the exemption.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/styles/theme-token-coverage.test.ts
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -- src/styles/global.css
git commit -m "style: map the charcoal band's classes to the fixed-dark tokens

.bg-gray-900 was mapped to var(--text-strong) — a text token standing in for a
surface, which is exactly why it inverted. It now resolves to --surface-deep.

Adds .on-dark rather than reusing .text-white on the new dark surfaces. The
coverage test exempts text-white because it is 'always paired with
bg-primary-600, whose mapped rule sets the label color'. The hero ghost button
has no bg-primary-600 behind it, so reusing text-white there would falsify the
exemption's reason while the test carried on passing."
```

---

### Task 3: `Logo.astro`, with a documented seam for the deferred chop

The owner chose a square name chop but deferred its layout, script and impression. The mark therefore lands as a component wrapping **today's** favicon artwork, so nothing regresses, with exactly one place to swap.

**Files:**
- Create: `src/components/Logo.astro`
- Modify: `src/layouts/BaseLayout.astro:129` (favicon data URI → reference the same artwork)

**Interfaces:**
- Consumes: `--brand`, `--brand-contrast` from Task 1.
- Produces: `<Logo size={number} />`, default `size={40}`, rendering an inline `<svg>` square. Used by Task 4.

- [ ] **Step 1: Write the failing test**

Add to `tests/i18n/shared-component-labels.test.ts` — a shared component may not carry a literal `aria-label`, and `Logo.astro` will be shared across all three locales:

No new test file. Instead confirm the existing guard covers it:

```bash
npx vitest run tests/i18n/shared-component-labels.test.ts
```

Expected: PASS now, and PASS after Task 3 — because `Logo.astro` will take its label through `getTranslation`, not a literal.

- [ ] **Step 2: Create the component**

`src/components/Logo.astro`:

```astro
---
/**
 * The practice mark.
 *
 * DEFERRED, 2026-08-19: the owner chose a square Chinese name chop (張勝雄) but
 * has not settled its layout, script or impression. Until he does, this renders
 * the artwork the site already used as its favicon, so nothing regresses.
 *
 * TO SWAP IN THE CHOP, replace the <svg> body below and nothing else.
 *
 * Three constraints the chop must satisfy, all established 2026-08-19:
 *
 *  1. OUTLINED PATHS, NOT TEXT. A CJK character left as <text> renders in
 *     whatever font the visitor happens to have, so the mark would differ
 *     between a Windows PC and an iPhone. Converting to paths fixes the shape
 *     and means editing it later is a redraw, not an edit.
 *  2. TRADITIONAL 張 IN ALL THREE LOCALES. One file, one favicon, one social
 *     card — the surname is not stored twice and cannot drift.
 *  3. THE FAVICON IS THE SURNAME ALONE. Rendered at 32px, the three-character
 *     chop is a smudge; this was tested, not assumed.
 *
 * Also on the record: no font on the build machine is 篆書 seal script, which
 * is what an authentic name chop is carved in. Do not describe a clerical or
 * stele-script mark as a traditional seal.
 */
import { getTranslation } from '@i18n/locales';

interface Props {
  locale: string;
  size?: number;
}

const { locale, size = 40 } = Astro.props;
const label = getTranslation(locale, 'logoAlt');
---

<svg
  width={size}
  height={size}
  viewBox="0 0 32 32"
  role="img"
  aria-label={label}
  class="logo-mark"
>
  <rect width="32" height="32" rx="6" fill="var(--brand)" />
  <text
    x="16"
    y="23"
    font-size="18"
    font-family="Georgia, serif"
    fill="var(--brand-contrast)"
    text-anchor="middle">SC</text
  >
</svg>

<style>
  .logo-mark {
    display: block;
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 3: Add the `logoAlt` key to all three locales**

In `src/i18n/locales.ts`, add to each locale's top-level block:

```ts
// en
logoAlt: 'Sheng Chang, M.D., Ph.D. — home',
// zhHant
logoAlt: '張勝雄醫師 — 首頁',
// zhHans
logoAlt: '张胜雄医师 — 首页',
```

Note `醫師` / `医师`, never `醫生` / `医生`.

- [ ] **Step 4: Run the tests**

```bash
npm test
```

Expected: PASS. `locale-coverage` confirms the key exists in all three; `shared-component-labels` confirms the `aria-label` is an expression, not a literal; `taiwan-register` confirms 医师 not 医生.

- [ ] **Step 5: Commit**

```bash
git add -- src/components/Logo.astro src/i18n/locales.ts
git commit -m "feat: extract the mark into Logo.astro, with one seam for the deferred chop

The owner chose a square name chop and deferred its layout, script and
impression on 2026-08-19. This renders the artwork already used as the favicon
so nothing regresses, and documents the three constraints the chop has to meet:
outlined paths rather than live text, traditional 張 in all three locales, and
the surname alone at favicon size.

The alt text goes through getTranslation, so the component carries no literal
aria-label and no Chinese."
```

---

### Task 4: Header and navigation

**Files:**
- Modify: `src/components/Navigation.astro:23-32`
- Modify: `src/components/Header.astro:61` and surrounding markup

**Interfaces:**
- Consumes: `<Logo locale size />` from Task 3; tokens from Task 1.
- Produces: no new exports.

- [ ] **Step 1: Restyle the desktop nav**

Replace the `<nav>` block in `src/components/Navigation.astro` with:

```astro
<nav class="hidden md:flex items-center gap-7">
  {navItems.map((item) => (
    <a
      href={item.href}
      class={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
      aria-current={isActive(item.href) ? 'page' : undefined}
    >
      {item.label}
    </a>
  ))}
</nav>

<style>
  /* dililaw.com's navigation is 12px uppercase at 1px tracking. The size is
     small on purpose: it makes the nav recede so the hero carries the page.
     Colors come from tokens, never from a Tailwind palette class, because a
     palette class here is what put the active underline on the wrong side of
     the theme on 2026-08-05. */
  .nav-link {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    padding-bottom: 3px;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .nav-link:hover,
  .nav-link:focus-visible {
    color: var(--brand);
  }
  .nav-link-active {
    color: var(--brand);
    border-bottom-color: var(--brand);
  }
  @media (prefers-reduced-motion: reduce) {
    .nav-link {
      transition: none;
    }
  }
</style>
```

This removes `text-primary-600` and `border-primary-600` from this file. Do **not** remove them from the map in `global.css` yet — Task 7 checks whether any use remains.

- [ ] **Step 2: Put the logo lockup in the header**

In `src/components/Header.astro`, import and use the component:

```astro
import Logo from '@components/Logo.astro';
```

Replace the contents of the `<a href={homeHref}>` at line 61 with:

```astro
<a href={homeHref} class="flex items-center gap-3 shrink-0 leading-tight">
  <Logo locale={locale} size={40} />
  <span class="logo-wordmark">
    {practiceLocalized.doctorName}
    <small>{tagline}</small>
  </span>
</a>
```

```css
.logo-wordmark {
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.5;
}
.logo-wordmark small {
  display: block;
  letter-spacing: 0.06em;
  font-weight: 400;
  color: var(--text-muted);
  text-transform: none;
}
```

**Use `practiceLocalized.doctorName`, not `practice.doctorName`.** The latter is an English string and rendering it on a Chinese page produces a sentence that switches language mid-clause. This shipped once through the shared footer and hit every Chinese page.

- [ ] **Step 3: Verify the build renders**

```bash
ALLOW_INDEXING=true npm run build
```

Expected: 22 pages, `postbuild` green.

- [ ] **Step 4: Run the tests**

```bash
npx tsc --noEmit && npm test
```

- [ ] **Step 5: Commit**

```bash
git add -- src/components/Navigation.astro src/components/Header.astro
git commit -m "style: uppercase navigation and a logo lockup in the header

Navigation moves off Tailwind palette classes onto tokens directly. A palette
class in this file is what put the active underline on the wrong side of the
theme on 2026-08-05, and a scoped rule against a token cannot repeat that.

The wordmark reads practiceLocalized.doctorName, not practice.doctorName —
the latter is an English string and would switch language mid-clause on the
Chinese pages, which is how the footer leaked English onto all twelve of them."
```

---

### Task 5: Footer

**Files:**
- Modify: `src/layouts/BaseLayout.astro:159` onward

- [ ] **Step 1: Move the footer onto the deep surface**

The footer keeps every link and every line of content. Only its surface changes: `--surface-deep` with `--on-dark` text, in both themes.

Find the `.footer` rule in `BaseLayout.astro`'s `<style>` and set:

```css
.footer {
  background-color: var(--surface-deep);
  color: var(--on-dark);
}
.footer a {
  color: var(--on-dark);
  text-decoration-color: color-mix(in srgb, var(--on-dark) 45%, transparent);
}
.footer a:hover,
.footer a:focus-visible {
  text-decoration-color: var(--on-dark);
}
```

Do **not** set a color on any heading inside the footer. Headings are `color: inherit` on purpose so the surface decides.

- [ ] **Step 2: Point the favicon at the same artwork as `Logo.astro`**

`BaseLayout.astro:129` holds an inline SVG data URI duplicating the mark. That is a second copy of the artwork and it will drift from `Logo.astro` the moment the chop lands.

Leave the data URI in place for now — a favicon cannot reference a component — but add:

```html
<!-- Keep this in step with src/components/Logo.astro. When the chop replaces
     the placeholder there, regenerate this to match. The favicon uses the
     SURNAME ALONE: the three-character chop is illegible at 32px. -->
```

- [ ] **Step 3: Build and check both themes**

```bash
ALLOW_INDEXING=true npm run build
```

- [ ] **Step 4: Run the tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -- src/layouts/BaseLayout.astro
git commit -m "style: footer moves to the deep charcoal surface

Same content, same links. The surface is --surface-deep, which is dark in both
themes, so its foreground is --on-dark rather than a token that inverts.

No heading in the footer gets a color; they inherit so the surface decides,
which is the rule that the h1-h6 { color: var(--text-strong) } override broke
on the insurance hero."
```

---

### Task 6: The photographic hero

**Files:**
- Modify: `src/components/HeroSection.astro`
- Modify: `src/components/CallButton.astro`

**Interfaces:**
- Consumes: tokens from Task 1, `.on-dark` from Task 2.
- Produces: `<HeroSection image?={string} imageAlt?={string} …>` — the existing props plus two optional ones. `<CallButton variant="ghost">`.

- [ ] **Step 1: Add the ghost variant to `CallButton`**

```astro
interface Props {
  text?: string;
  size?: 'base' | 'lg';
  variant?: 'filled' | 'ghost';
}
const { variant = 'filled' } = Astro.props;
```

```css
/* Ghost buttons sit over the hero photograph, whose overlay is dark in both
   themes, so currentColor here is --on-dark and stays legible either way. */
.call-button-ghost {
  background: none;
  border: 1px solid currentColor;
  color: var(--on-dark);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  font-weight: 600;
}
.call-button-ghost:hover,
.call-button-ghost:focus-visible {
  background-color: color-mix(in srgb, var(--on-dark) 14%, transparent);
}
```

- [ ] **Step 2: Make the hero image optional**

In `HeroSection.astro`:

```astro
interface Props {
  headline: string;
  subheadline?: string;
  locale: string;
  illustration?: string;
  image?: string;
  imageAlt?: string;
}
const { image, imageAlt } = Astro.props;
```

```astro
<section class="hero" data-has-image={image ? 'true' : 'false'}>
  {image && <img class="hero-image" src={image} alt={imageAlt ?? ''} loading="eager" />}
  <div class="hero-body on-dark">
    <!-- existing headline / subheadline / CTA markup -->
  </div>
</section>
```

```css
/* The hero ground is dark in BOTH themes — either the photograph under its
   overlay, or flat --surface-dark when there is no photograph yet. That is why
   the text inside is .on-dark and not a token that inverts.

   Shipping without images is deliberate: the owner is sourcing photographs
   separately, and the hero has to work in the meantime. Each image drops in
   later without touching this layout. */
.hero {
  position: relative;
  isolation: isolate;
  background-color: var(--surface-dark);
  display: grid;
  place-items: center;
  text-align: center;
  padding: clamp(3rem, 8vw, 6rem) 1.5rem;
}
.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}
.hero[data-has-image='true']::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgb(28 26 30 / 0.62);
  z-index: -1;
}
.hero-body :is(h1, h2) {
  color: inherit;
  font-weight: 400;
}
```

`imageAlt` defaults to `''` because a hero photograph behind text is decorative — the headline already carries the meaning, and a described-twice hero is noise for a screen-reader user. If a hero image ever carries information the text does not, pass real alt text.

- [ ] **Step 3: Build and confirm the no-image fallback**

```bash
ALLOW_INDEXING=true npm run build
grep -c 'class="hero"' dist/index.html
```

Expected: at least 1, rendering on flat charcoal since no image is passed yet.

- [ ] **Step 4: Run the tests**

```bash
npx tsc --noEmit && npm test
```

- [ ] **Step 5: Commit**

```bash
git add -- src/components/HeroSection.astro src/components/CallButton.astro
git commit -m "feat: full-bleed hero that works before the photographs arrive

HeroSection takes an optional image and falls back to flat --surface-dark when
there is none, so the redesign is not blocked on the owner sourcing photographs.
Each image drops in later without touching layout.

The hero ground is dark in both themes — photograph plus overlay, or flat
charcoal — so its text is .on-dark rather than a token that inverts. The
headline inherits its color; pinning it is what broke the insurance hero."
```

---

### Task 7: The two service groups, in three locales

**Files:**
- Modify: `src/i18n/locales.ts`
- Modify: `src/pages/services.astro`
- Modify: `src/pages/zh-hant/services.astro`
- Modify: `src/pages/zh-hans/services.astro`

- [ ] **Step 1: Grep for the negation before adding anything**

Publishing a fact does not remove the claim that contradicts it. Before adding group headings that imply a closed list, check the site does not already assert a different set:

```bash
grep -rn "all ages\|newborn\|full range\|complete range\|every service" src/ --include=*.astro --include=*.ts
```

Expected: no output. If there is output, resolve the contradiction in the same commit — including in `src/components/JsonLd.astro`, which is not a page and will not turn up in a page-by-page review.

- [ ] **Step 2: Add the three group headings to all three locales**

In `src/i18n/locales.ts`, add a `serviceGroups` block to each locale:

```ts
// en
serviceGroups: {
  clinical: 'Services Provided',
  social: 'Social Services Provided',
  other: 'Also Offered',
},
// zhHant
serviceGroups: {
  clinical: '診療服務',
  social: '社會服務',
  other: '其他服務',
},
// zhHans
serviceGroups: {
  clinical: '诊疗服务',
  social: '社会服务',
  other: '其他服务',
},
```

`社會服務` / `社会服务` is the right rendering. Avoid `社會福利` — that names government welfare programs and would misdescribe an immigration physical.

- [ ] **Step 3: Group the existing sections on all three services pages**

No copy is rewritten. The existing sections are wrapped under the three headings:

- **Services Provided** — the Family Medicine section, the referrals line at `services.astro:53`, and the accepting-new-patients statement.
- **Social Services Provided** — Immigration Medical Services (I-693), Citizenship Exam Waiver Medical Evaluation Report (N-648), Medical-Legal Reports.
- **Also Offered** — Stem Cell Therapy, copy untouched.

Read each heading with `getTranslation(locale, 'serviceGroups.clinical')` and so on. Do not inline the English into `services.astro` and do not put Chinese in a component.

Put the group headings on the charcoal band: `class="bg-gray-800 on-dark"`.

**The form is N-648.** The owner dictated "I 648"; there is no such form. The page already says N-648 correctly — do not change it.

**Stem cell copy does not change.** Not a word. It asserts no benefit, indication, success rate or safety claim and is deliberately excluded from `JsonLd.astro`. Dr. Chang confirmed on 2026-08-09 that nothing changes, and he approved the copy without supplying the specifics, so there is nothing to expand it from.

- [ ] **Step 4: Run the tests**

```bash
npm test
```

Expected: PASS. `source-integrity` derives its block list from `translations.en`, so `serviceGroups` is covered automatically — but each key needs a page reading it or the test fails, which is the intended behavior. `taiwan-register` checks cross-locale parity.

- [ ] **Step 5: Commit**

```bash
git add -- src/i18n/locales.ts src/pages/services.astro src/pages/zh-hant/services.astro src/pages/zh-hans/services.astro
git commit -m "content: group the services the way the practice describes them

Two groups, as the owner dictated: clinical services, and the social services
(I-693, N-648, medico-legal). Stem cell therapy gets a third heading because it
belongs to neither, and its copy is untouched.

Nothing is restored here. All six services the owner listed were already live —
this is grouping, not restoration, and saying otherwise would misreport it.

The form is N-648, the Medical Certification for Disability Exceptions filed
with the N-400. The owner dictated 'I 648'; no such form exists, and the page
already said N-648. Recorded so nobody corrects it into a defect.

Headings land in all three locales in this commit. 社會服務 rather than
社會福利, which names government welfare programs."
```

---

### Task 8: Verify in a browser, in both themes, including hover

Nothing above is done because it builds. This task is the one that produces evidence.

- [ ] **Step 1: Build and serve**

```bash
ALLOW_INDEXING=true npm run build && npx serve dist -l 4321
```

- [ ] **Step 2: Read computed colors out of the browser**

For each of these, in **light and dark**, at rest **and** on hover, record the computed value:

| Element | Where |
| --- | --- |
| Nav link | Every page header |
| Active nav link and its underline | Current page |
| Phone number / call button in the header | Every page |
| Hero ghost button | Home, About, Services, Location |
| Body copy links | About page, which has the most |
| Footer links | Every page |
| The charcoal band and its headings | Services |

The phone number on hover is the specific case that shipped at **1.67:1** — the practice's primary call to action, invisible in dark mode, found by eye on the third pass. Check it first.

- [ ] **Step 3: Check all 22 pages at two widths in both themes**

375px and 1440px. Confirm no horizontal scroll and no clipped nav.

- [ ] **Step 4: Confirm the controls still work**

- Text-size control scales type in the restyled header.
- Theme toggle flips both ways and persists.
- Language switcher reaches all three locales from every page.

- [ ] **Step 5: Confirm no English leaked onto a Chinese page**

```bash
grep -rn "Sheng Chang, M.D" dist/zh-hant/ dist/zh-hans/ | grep -v "JsonLd\|application/ld"
```

Search for the **shape** of the defect, not the strings you just fixed. Grepping for what you changed proves only that you changed it.

- [ ] **Step 6: Open the PR**

```bash
git push -u origin redesign-dililaw-direction
gh pr create --title "..." --body "..."
```

The body states what was verified, with the computed values, and what remains unconfirmed: the chop, the photographs, and the fact that both Chinese locales are still `reviewed: false` and therefore `noindex`.

---

## Self-Review

**Spec coverage.** Palette → Task 1. Class map → Task 2. Logo → Task 3. Nav and header → Task 4. Footer → Task 5. Heroes → Task 6. Services and trilingual copy → Task 7. Verification → Task 8. Dead tokens → Task 1 Step 3. `.gitignore` → already committed with the spec.

**Not covered by any task, deliberately:** the chop's design, the photographs, and a licensed seal-script font. All three are deferred in the spec with the owner's agreement.

**Type consistency.** `<Logo locale size />` is defined in Task 3 and consumed in Task 4 with the same prop names. `HeroSection`'s `image` / `imageAlt` are defined and consumed within Task 6. `.on-dark` is defined in Task 2 and used in Tasks 5, 6 and 7. `serviceGroups.clinical|social|other` is defined and consumed within Task 7.

**One risk this plan cannot remove.** Task 8 is the only task whose output is judgment rather than a passing command, and it is the one that matters most. A green suite here has coexisted with a site rendering zero CSS. Do not report it complete without the computed values written down.
