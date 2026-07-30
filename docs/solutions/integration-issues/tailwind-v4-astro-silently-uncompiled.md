---
title: 'Tailwind v4 utilities silently never compiled — Astro build passed with zero CSS'
date: 2026-07-29
category: integration-issues
problem_type: build_misconfiguration
component: astro-build-pipeline / tailwind-integration
severity: critical
symptoms:
  - 'site renders completely unstyled but npm run build succeeds'
  - 'no layout, colours, borders or spacing on any page'
  - 'desktop and mobile navigation both visible at once'
  - 'mobile-only sticky bar shows on desktop'
  - 'hidden and md:flex both in effect; responsive variants do nothing'
  - 'build reports zero errors and all pages built'
  - 'automated audits report perfect Lighthouse/WCAG scores on a broken site'
stack:
  - Astro 5
  - Tailwind CSS v4
  - Vite
  - TypeScript
time_to_diagnose: '~4 hours of downstream work built on the broken state; ~10 minutes once the page was actually looked at'
recurrence_risk: 'high — nothing in the toolchain warns, and any later edit to astro.config.mjs vite.plugins reintroduces it silently'
tags:
  - tailwindcss-v4
  - astro
  - vite-plugin
  - css-not-compiling
  - silent-build-failure
  - false-positive-audit
  - unstyled-page
  - tailwind-config-at-config
---

# Tailwind v4 utilities silently never compiled

> **Category note.** Filed under `integration-issues` rather than `build-errors`
> because nothing errored — the build exited 0 every time. The defect was a
> missing connection between two tools. If you came looking under
> `build-errors`, that was the runner-up classification.

## Symptom

Every page rendered as undressed HTML: no layout, no colour, no borders, no
spacing. Desktop and mobile navigation displayed simultaneously, and a
mobile-only sticky bar appeared on desktop — because the `hidden` / `md:flex`
pairs that toggle between them were inert.

Meanwhile `npm run build` exited 0, emitted 22 pages, and printed no warnings.
Nothing in the build output, logs, or dependency tree indicated a problem.

## Why it was hard to catch

- **No error is raised.** `@import 'tailwindcss';` is syntactically valid CSS.
  Without the `@tailwindcss/vite` plugin, nothing intercepts it — Astro's CSS
  pipeline has no idea that string is supposed to invoke a compiler, so it
  passes through inert.
- **It was in the wrong kind of block.** The import sat inside an Astro
  component's inline `<style is:global>` in `BaseLayout.astro`. Tailwind v4
  expects a real CSS entry file. Even correctly placed it would have needed the
  plugin, but the inline location made it look plausible on inspection.
- **Scoped component styles still worked.** Astro's own `<style>` blocks compile
  independently of Tailwind. So hand-written CSS in `location.astro`,
  `FontSizeControl.astro`, and others rendered fine, while everything styled
  with utilities did not. The page looked *half-designed* — which reads as
  work-in-progress, not as a systemic pipeline failure.
- **The build's success is not a claim about CSS content.** `astro build` checks
  that files compile and pages render. It has no opinion on whether
  `bg-primary-600` ever produced a rule.

## Investigation steps

1. Ran `npm run build`. Clean: 22 pages, no errors, no warnings. This ruled out
   a compile-time diagnosis and meant the failure could only be caught visually.
2. Took a browser screenshot of the running dev server. This was the decisive
   step. Confirmed no utility styling anywhere, and both navs visible at once —
   a strong tell that responsive variants weren't compiling.
3. Grepped the built CSS for a class the site definitely uses:
   ```bash
   grep -r "max-w-container" dist/_astro/*.css   # no match → utility layer absent
   ```
4. Checked `astro.config.mjs` for any Tailwind wiring:
   ```bash
   git show 6003825^:astro.config.mjs | grep -c tailwind   # → 0
   ```
5. Checked `package.json`: `tailwindcss: ^4.0.0` was in `devDependencies`. So
   installed, but not wired in.
6. Found `@import 'tailwindcss';` inside the inline `<style is:global>` block in
   `src/layouts/BaseLayout.astro` — present, but a no-op.

## Root cause

Tailwind changed its integration model between v3 and v4.

| | v3 | v4 |
|---|---|---|
| Wiring | PostCSS plugin, often auto-detected | **Explicit** bundler plugin required (`@tailwindcss/vite`) |
| Entry | `@tailwind base/components/utilities` | `@import 'tailwindcss'` in a real CSS file |
| JS config | `tailwind.config.js` auto-loaded | **Not** auto-discovered; legacy-only via `@config` |

This project had neither half. No plugin in `astro.config.mjs`, and no `@config`
directive, so `tailwind.config.ts` — holding the brand palette, the spacing
scale, and `max-w-container` — was orphaned as well.

Note the two independent failure modes here. A missing plugin kills everything.
A present plugin with a missing `@config` is subtler: base utilities work while
every custom token silently vanishes. Test for them separately.

## The fix

Commit `6003825`.

**1. Install and register the Vite plugin** — `astro.config.mjs`:

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // …
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**2. Move Tailwind's entry into a real stylesheet** — `src/styles/global.css`:

```css
@import 'tailwindcss';

/* Tailwind v4 is CSS-first, but this project's design tokens (the `primary`
   palette, spacing scale, `max-w-container`) live in tailwind.config.ts.
   `@config` loads that legacy JS config so those tokens resolve. */
@config '../../tailwind.config.ts';
```

**3. Import it from the layout** — `src/layouts/BaseLayout.astro`:

```astro
---
import '@/styles/global.css';
---
```

…and delete the old inline `<style is:global>@import 'tailwindcss'; …</style>`.

## Verification

Build success is not evidence. Assert on the artifact:

```bash
npm run build                                   # exit 0 — necessary, not sufficient
grep -c 'max-w-container' dist/_astro/*.css     # ≥1 → custom tokens compiled
grep -c 'md\\:flex'       dist/_astro/*.css     # ≥1 → responsive variants compiled
```

Then confirm visually in a browser, and check routes resolve:

```bash
for u in / /zh-hant/ /zh-hans/ /services/ /location/; do
  printf '%s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3120$u)"
done
```

## Prevention

### The build guard now in this repo

`scripts/verify-css.mjs` runs automatically via `postbuild` in `package.json`. It
fails the build if the compiled CSS lacks real Tailwind output, converting a
silent no-op into a hard error. It costs milliseconds and needs no browser.

**Verified in both directions** — passes on a healthy build; with
`vite.plugins` emptied it exits 1 and names what's missing.

**A sentinel is only trustworthy if its class name appears nowhere in
hand-written CSS.** `global.css` contains theme-remap rules like
`.bg-primary-600 { … }` and `--tw-gradient-from`, so those strings survive even
with the plugin removed and cannot detect the failure alone. Only `md\:flex` and
`max-w-container` actually flipped to missing in the negative test. If you add
sentinels, re-run the negative test to confirm each one genuinely fails.

### Rules this incident produced

1. **Exit-code success is not output correctness for any tool that can no-op.**
   Bundlers, codegen, migrations, cache warmers — anything that "succeeds" by
   doing nothing when misconfigured needs an assertion on what it *produced*.
   When wiring in a build step, add that assertion the same day.
2. **Never report UI work complete without looking at the rendered page.** A
   clean build log is not a substitute for pixels — doubly so after touching
   bundler or CSS-framework config.
3. **Never relay an automated agent's benchmark or compliance claim without
   reproducing it.** See the invalidated reports below for what this cost here.
4. **Re-verify after any edit to `astro.config.mjs`.** An unrelated change can
   drop the plugin entry and nothing will complain.

### Warning signs: suspect the pipeline, not your styles

- Responsive variants have no effect at any viewport.
- `hidden` and `md:flex` are both in effect; an element never disappears.
- Spacing utilities produce zero spacing; everything hugs the edges.
- The page looks like raw 2005 HTML — structurally undressed, not "slightly off".
- Custom tokens are absent while browser-default styling (link blue, default
  font) is still visible.
- Changing a utility class in source produces **no diff** in the compiled CSS.

### Framework-upgrade checklist

1. Confirm the plugin is **registered in the bundler config**, not merely in
   `package.json`.
2. Confirm the CSS entry file uses the new `@import` syntax **and is imported**
   somewhere in the component tree.
3. If keeping a legacy JS config, confirm `@config` is present and resolves.
   Test this separately — base utilities can work while custom tokens vanish.
4. Run the sentinel grep **before writing any markup** that depends on the
   framework.
5. Visually check one page you know should look designed.

## Secondary bugs this unmasked

Once utilities compiled, two latent problems became visible (fixed in `26a8c6c`):

1. **Dead colour utilities from a replaced palette.** `tailwind.config.ts` sets
   `theme.colors` directly rather than `theme.extend.colors`, which *replaces*
   the default palette. It defines only `black`, `white`, `gray`, `primary`,
   `success`, `warning`, `error`, `info`. Six pages used `bg-blue-50`,
   `border-blue-200`, `text-green-600`, `bg-red-100`, `bg-emerald-100`,
   `bg-amber-100` — none of which exist, so all emitted nothing. Remapped onto
   real tokens (`text-green-600` → `text-success`, `bg-blue-50` →
   `bg-primary-50`, and so on).
2. **`main { max-width: 1200px }`** in `BaseLayout.astro` was clamping the
   homepage's full-bleed banded sections into a floating inset panel. Removed;
   pages now own their own width.

## Reports invalidated by this bug

Verified timeline (`git log`, 2026-07-29). The fix landed at **15:05**. Every
report below was produced hours earlier, against a site with no compiled CSS:

| Commit | Time | Report | Status |
|---|---|---|---|
| `eeb1107` | 10:42 | `task-17-report.md` — "READY FOR DEPLOYMENT" | **Void** for any styling claim |
| `4f2566e` | 10:46 | `task-16-report.md` — "WCAG AAA", "52/52 passed" | **Void** — contrast measured on unstyled default text passes trivially and means nothing |
| `df6bab0` | 11:10 | `seo-optimization.md` | **Partly valid** — JSON-LD, robots.txt and breadcrumbs are CSS-independent; layout claims are not |
| `8dcd98e` | 11:16 | "Performance optimizations for Lighthouse scores" | **Void** — measured a page with no stylesheet to load |
| `6003825` | 15:05 | **The fix** | — |

One correction to note, since a research pass got it wrong: `task-15-report.md`
(font-size control) is **not** invalidated. `--font-scale` was set as an inline
attribute on `<html>` with the `calc()` in a plain passthrough style block, so
that feature genuinely did work before the fix. Only its interaction with
utility-driven layout was unverified.

The general lesson is the expensive one: **roughly four hours of work was built
on top of a broken base, and four "verified complete" reports described an
artifact nobody had looked at.**

## Related

- `CLAUDE.md` — records this incident and the resulting reporting rules
- `docs/superpowers/specs/2026-07-28-gp-website-redesign.md` — assumed Tailwind
  was wired; correct as a spec, wrong as an assumption
- `scripts/verify-css.mjs` — the guard described above
- Follow-up styling commits, only possible once CSS compiled: `26a8c6c`,
  `72573e6`, `b08f93a`
