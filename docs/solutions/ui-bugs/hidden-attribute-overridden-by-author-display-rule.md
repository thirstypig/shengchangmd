---
title: "A lightbox's own CSS blocked every click on the page it belonged to — an author `display` rule silently beats the browser's `[hidden]` default"
date: 2026-08-25
category: ui-bugs
problem_type: css_cascade_origin_precedence
component: src/pages/family-photos-2026.astro
severity: high
symptoms:
  - 'clicking any element on the page does nothing, with no console error'
  - 'a full-viewport overlay is visibly present from first page load, before any interaction that should have shown it'
  - 'the element responsible for the overlay has the `hidden` attribute set, yet its computed `display` is not `none`'
  - 'an early screenshot looks unexpectedly dark even though the page background color, read via getComputedStyle, is confirmed correct'
  - 'automated browser testing (Playwright) times out on a click with "element intercepts pointer events"'
stack:
  - Astro 5
  - vanilla CSS (scoped `<style>` block)
  - Playwright (used by the implementer to verify the fix, not part of the app)
time_to_diagnose: 'minutes, once a subagent implementer actually exercised the page in a real browser rather than reading the markup and assuming it worked'
recurrence_risk: 'medium — recurs any time a `<style>` block sets `display` on an element that also carries the `hidden` attribute for show/hide state; the class of bug is invisible to code review because the CSS and the HTML both look correct in isolation'
tags:
  - css
  - cascade
  - specificity
  - hidden-attribute
  - lightbox
  - verification-before-completion
  - dark-mode
---

# A lightbox's own CSS blocked every click on the page it belonged to — an author `display` rule silently beats the browser's `[hidden]` default

## The problem

A new personal-photo gallery page (`src/pages/family-photos-2026.astro`) used
the standard pattern for a click-to-enlarge lightbox: a `<div id="lightbox"
class="lightbox" hidden>` toggled by JavaScript setting `.hidden = true /
false`, paired with CSS that styled `.lightbox` as a full-viewport dark
overlay:

```css
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  padding: 24px;
}
```

This looks correct — and typechecks, builds, and passes every existing test
in the repo — but the page it shipped on was completely unusable. Every
click, anywhere on the page, from the moment it loaded, hit the lightbox
overlay instead of the thumbnail underneath it. No console error, no build
warning: the overlay was simply *there*, dimming and intercepting the whole
page before a single photo had ever been clicked.

## Root cause

The browser's own UA (user-agent) stylesheet already has a rule for the
`hidden` attribute:

```css
[hidden] {
  display: none;
}
```

The natural assumption is that an author's own `.lightbox` class, being more
specific than a bare attribute selector, would win when both apply. It does
not — because specificity is not the first thing the CSS cascade compares.
**Origin and importance are compared before specificity.** A normal-priority
*author* declaration always beats a normal-priority *user-agent* declaration,
regardless of which selector is more specific or which rule appears later in
the source. `.lightbox { display: flex }` is an author rule; `[hidden] {
display: none }` is a UA rule. The author rule wins unconditionally, so as
soon as `class="lightbox"` was present the element was `display: flex`
whether or not `hidden` was also present.

The result: `lightbox.hidden` (the JS/DOM property, and the reflected HTML
attribute) was accurately `true` before the first click — but the
*rendered* `display` was `flex` the entire time, because the class-based
rule had already won the origin comparison before specificity was ever
consulted.

This is a real gotcha specifically because both halves look right on their
own: the HTML correctly starts with `hidden`, and the CSS correctly styles
`.lightbox` as an overlay. Nothing in either file, read separately, suggests
a conflict. The conflict only exists in how the browser resolves the two
together, and no test in this repository resolves computed styles — `tsc`,
`vitest`, and the two `postbuild` verification scripts all passed cleanly
with the bug shipped.

## The solution

Add one rule that raises the "hidden" state to author-origin, so it now
competes with `.lightbox` on the terms the cascade actually uses
(specificity, both being author rules of equal importance):

```css
.lightbox[hidden] {
  display: none;
}
```

`.lightbox[hidden]` (specificity 0-2-0) beats `.lightbox` alone (0-1-0)
whenever `hidden` is present, and no longer applies at all once the click
handler clears the attribute (`lightbox.hidden = false`), at which point
`.lightbox { display: flex }` takes back over correctly. Nothing else —
markup, script, or any other CSS rule — needed to change.

## Prevention

**The trigger to watch for:** any element that (a) uses the `hidden`
attribute for its show/hide state, and (b) has an author CSS rule that sets
`display` on the same selector (or a selector matching the same element)
for any *other* reason — sizing, flex/grid layout, positioning. The two
purposes collide the instant both exist, and neither file looks wrong on
its own.

**Habit — exercise interactive elements in a real browser before calling a
feature done, not just read the markup and assume the described behavior
follows from it.** This bug was caught because an implementer's
verification step for "clicking one opens the lightbox, clicking it closes
it" actually drove a browser (Playwright) and inspected `getComputedStyle`,
rather than treating the presence of correct-looking markup, an `onclick`
handler, and matching CSS as sufficient evidence. A page that builds, type-
checks, and passes every test can still be completely non-interactive; none
of those checks resolve a computed style.

**What would make this mechanically checkable:** none of the automated
checks in this repository resolve computed CSS today (see
`tests/styles/contrast.test.ts` and `tests/styles/theme-token-coverage.test.ts`
for the two that come closest — both parse tokens out of `global.css`
textually, neither renders anything). A rule like "any selector combining
`[hidden]` with a class also styled by an unqualified `display` declaration
is a defect" is pattern-matchable by static analysis, but the more reliable
guard for this specific shape is the habit above: any new show/hide toggle
built on the `hidden` attribute should be clicked, in a browser, before
being called done — not just once, but through both states (open and
close), since a fix that only handles one transition can look complete on a
single screenshot.

## Related

- [green-checks-that-cannot-see-the-defect](../logic-errors/green-checks-that-cannot-see-the-defect.md)
  — same structural shape: a defect invisible to every automated check this
  repo runs, because none of them resolve rendered/computed output. That
  write-up covers a literal-English-string check and a locale-emptiness
  check with analogous blind spots; this one adds "no check here resolves
  CSS" to the same list.
- [qr-code-crop-svg-bloat-and-aspect-ratio-squash](qr-code-crop-svg-bloat-and-aspect-ratio-squash.md)
  — a different bug from a different feature, but the same prevention habit
  applies: a rendered result was never actually looked at until well after
  the code "looked right," and looking at the rendered result is what
  found it.

Introduced and fixed in the same commit
(`c98ebe9`, `feat: add unlinked personal photo gallery page`,
`add-photo-gallery-and-recognition` branch) — caught during the
implementer's own pre-report verification, before task review, so it never
shipped in a broken state on `main`.
