---
title: "A QR code shipped with a cut-off crop, a 6.3 MB SVG export, and a squashed aspect ratio — three visual bugs no automated check could see"
date: 2026-08-24
category: ui-bugs
problem_type: unverified_visual_transform
component: src/components/WeChatQR.astro / public/images/wechat-qr-light.svg / src-photos/wechat-qr-original.jpg
severity: medium
symptoms:
  - 'a QR code renders with one corner finder pattern cut off, reported only by a human looking at the page'
  - 'a QR code renders visibly squashed/stretched, because an <img> width/height pair does not match the source aspect ratio'
  - 'crop coordinates were chosen by eye against a screenshot and never checked against the rendered result'
  - 'width/height attributes were typed from memory rather than read from the actual source file dimensions'
  - 'a naive per-pixel SVG export produces a 6.3 MB file for what should be a small icon'
  - 'every test, typecheck, and build check passes in both broken states'
stack:
  - Astro 5
  - Pillow (PIL)
  - hand-authored SVG (rect-per-run encoding)
time_to_diagnose: 'round 1: minutes, once the user flagged it visually. round 2: caught by chance during an unrelated re-read of the component, not by deliberate testing'
recurrence_risk: 'medium — recurs whenever an image is cropped or resized using eyeballed numbers instead of values read back from the file, which is the default way to work with images in a chat-driven workflow'
tags:
  - qr-codes
  - image-cropping
  - aspect-ratio
  - svg
  - verification-before-completion
  - dark-mode
  - assets
---

# A QR code shipped with a cut-off crop, a 6.3 MB SVG export, and a squashed aspect ratio — three visual bugs no automated check could see

> **Category note.** Filed under `ui-bugs`, alongside
> [raster-logo-cannot-serve-two-themes](raster-logo-cannot-serve-two-themes.md):
> both are rendering defects invisible to every automated check in this repo.
> Not `logic-errors` — that category here is reserved for false assumptions
> about facts and program state, not an unverified manual transform applied
> to an image.

## The problem

Getting a scannable, themeable WeChat QR code into the footer took three
passes to get right, and each failure looked plausible enough to ship before
it was caught.

**Pass 1 — the crop cut off a corner.** The QR pattern lives inside a larger
screenshot (`src-photos/wechat-qr-original.jpg`, 888×1191). The bounding box
was chosen by eye:

```python
img.crop((140, 310, 745, 810))  # y-range too short by ~110px
```

This clipped the bottom-left finder pattern — one of the three corner squares
a scanner uses to orient the code — off the bottom edge. It shipped anyway,
and the user reported it broken twice: first as "the wechat QR did not come
out," then, after a first attempted fix, as "the QR code is cropped too
much."

**Pass 2 — the vector export was 6.3 MB.** The user asked for a vector
format so the code would stay crisp at any size. The first SVG generator
iterated every pixel and emitted one `<rect>` per black pixel:

```python
for y in range(height):
    for x in range(width):
        if is_black(x, y):
            svg += f'<rect x="{x}" y="{y}" width="1" height="1"/>'
```

On a ~600×500 crop this produced **6,395,027 bytes** of SVG — technically
correct, practically unshippable.

**Pass 3 — the component squashed it.** Once wired into
`src/components/WeChatQR.astro`, the `<img>` tag carried a height that
didn't match the source:

```html
<img src="/images/wechat-qr-light.svg" width="160" height="127" />
```

The actual crop was 610×615 — essentially square. `height="127"` would have
rendered the code visibly squashed vertically. None of the 202 automated
tests, the typecheck, or either `postbuild` verification script caught this
— it was found only when, working on an unrelated follow-up (adding a
theme-aware card around the QR), the component's own numbers were re-read
and didn't reconcile with the known source dimensions.

## Root cause

**Every one of these three bugs is the same shape: a number was asserted
instead of measured, and nothing downstream checked it against the source.**
A crop box, a per-pixel SVG emission strategy, and an `<img>` height
attribute are all just numbers copied from a mental model of the asset
rather than read off the asset itself. None of the three is a logic error in
the traditional sense — the code does exactly what it says — the *input* to
each was simply wrong, and nothing in the pipeline compares a rendered
result back to its source dimensions or content.

The design decision below is a fourth instance of the same discipline
applied correctly: instead of assuming "dark mode support" means "invert the
colors" (the pattern used elsewhere on this site via CSS custom
properties), the actual constraint — QR scan reliability — was checked
first.

## The solution

**Fix 1 — recrop generously, then verify by rendering, not by re-deriving
new coordinates.**

```python
img.crop((140, 305, 750, 920))  # wider box on all sides than the estimate
```

The critical step wasn't the wider box — it was rendering the crop and
visually confirming all three finder patterns were fully present with even
margins before moving on, rather than trusting the new numbers the same way
the old ones had been trusted.

**Fix 2 — run-length encode the SVG instead of emitting one rect per
pixel.**

```python
def row_to_rects(row, y):
    rects, x = [], 0
    while x < len(row):
        if row[x] == BLACK:
            start = x
            while x < len(row) and row[x] == BLACK:
                x += 1
            rects.append(f'<rect x="{start}" y="{y}" width="{x-start}" height="1"/>')
        else:
            x += 1
    return rects
```

Grouping consecutive same-color pixels along each scanline into a single
wide `<rect>` dropped output from 6.3 MB to under 500 KB, pixel-identical.

**Fix 3 — match the `<img>` dimensions to the actual source, and give the
QR a themed card instead of inverting it.**

```html
<img src="/images/wechat-qr-light.svg" width="160" height="160" />
```

For dark mode, the QR itself stays black-on-white — inverting a QR code's
polarity risks breaking scan reliability on phone cameras tuned for
dark-modules-on-light, and WeChat's own official codes are always
black-on-white regardless of app theme. Theme adaptation moved to the frame
instead:

```css
.qr-card {
  background: white; /* always, regardless of theme */
  border: 1px solid var(--border-subtle);
}

@media (prefers-color-scheme: dark) {
  .qr-card {
    border-color: transparent;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); /* reads as intentional card,
                                                    not unstyled fallback */
  }
}
```

## Prevention

**The trigger to watch for:** any image crop, resize, or format conversion
whose parameters — crop box coordinates, target dimensions, aspect ratio —
come from eyeballing a screenshot or recalling a number from earlier in the
conversation, rather than from measuring the actual source file or computing
the value programmatically. All three defects here trace back to this one
trigger: a crop box guessed from looking at a screenshot, an `<img>`
width/height pair typed from memory instead of read off the file, and an
export approach chosen without checking what it would produce at scale.

**Habit 1 — render and look, every time, not just when something feels
risky.** The QR crop was wrong once, "fixed" with new estimated coordinates,
and shipped again — the history does not show that second attempt being
rendered and inspected before it was called done; it shows the same category
of guess repeated. What actually closed the defect was a later pass that
explicitly rendered the cropped SVG and visually confirmed all three finder
patterns were present with even margins on all sides. That confirmation step
— not the improved coordinates — is the part worth institutionalizing: after
any crop or dimension change, the task isn't done when the numbers look
plausible, it's done when the rendered output has been displayed and checked
against what the asset needs to contain. A crop is a claim about what's
inside a rectangle; only looking at the result verifies the claim.

**Habit 2 — derive `width`/`height` attributes from the file, or omit the
guess.** The `<img>` tag's hardcoded dimensions didn't match the SVG's real
aspect ratio and silently squashed it, and this was caught by accident while
working on something else, not by a deliberate check. Two fixes both avoid
the failure mode: either read the source file's actual dimensions
programmatically and use those exact numbers, or drop the guessed dimension
entirely and let `height: auto` (or CSS `aspect-ratio`) derive it from the
file at render time. Either way, the fix is to stop typing a remembered
number where a measured one is available for free.

**Habit 3 — file size is a signal, but only if someone reads it.** The 6.3
MB SVG wasn't a test failure — nothing in this stack asserts an upper bound
on asset size, so a naive one-`<rect>`-per-pixel export could balloon
indefinitely without anything turning red. It was caught because someone
happened to look at the file size. That's not a coincidence to rely on: a
glance at generated output's size belongs in the same "did I actually check
the result" habit as rendering an image, not as an optional extra step.

**What went right, and why it's worth repeating deliberately.** Keeping the
QR code's modules black-on-white in both themes — rather than inverting it
to match how other assets on this site adapt to dark mode — came from asking
what the asset is actually *for*: a phone camera has to scan it reliably,
and inverted QR codes are a known way to break that in the real world.
That's a different question than "does this look visually consistent with
the theme system," and it's the question that matters here. The general
habit: before applying a site-wide visual convention to a new asset, check
whether that asset has a functional contract (machine-readability,
legibility at a fixed physical size, accessibility) that a purely aesthetic
rule could violate. Theme consistency is the default; it isn't automatically
correct for every asset type.

**What can actually be automated here — and this is genuinely testable, not
a shrug.** A test can assert that an SVG's `viewBox` aspect ratio matches
the aspect ratio implied by any `<img width height>` pair that references
it, for every such reference in the codebase. That's a crisp, mechanical
invariant — parse the SVG's `viewBox`, parse the `<img>` tag's attributes,
compare the ratios, fail if they diverge beyond a small tolerance. It would
have caught the squashed-image defect directly, and it's cheap to write. The
crop-completeness problem (does the QR code contain all three finder
patterns) and the file-size-ballooning problem are harder to automate in
general — the first requires actually decoding QR structure, the second is a
judgment call about acceptable size — but the aspect-ratio mismatch is not in
that category. It should be a test, not a habit.

## Related

- [raster-logo-cannot-serve-two-themes](raster-logo-cannot-serve-two-themes.md)
  — a useful **contrast** case from the same site: that asset (the chop/seal
  logo) does invert per theme, painted through a CSS mask and a `--seal`
  custom property, because it's genuinely single-ink artwork where color is
  free to vary. The QR code deliberately makes the opposite call — modules
  stay black-on-white in both themes — because inverting a QR code risks
  breaking scan reliability on phone cameras tuned for dark-on-light codes.
  Same site, same "should this asset invert per theme" question, two
  different assets with two different correct answers for two different
  reasons.
- [green-checks-that-cannot-see-the-defect](../logic-errors/green-checks-that-cannot-see-the-defect.md)
  — same structural blind spot: the crop that cut off a QR finder pattern,
  the 6.3 MB naive SVG export, and the squashed aspect ratio all passed the
  full 202-test suite, the typecheck, and both `postbuild` verifiers. None of
  those checks resolve pixels or look at a rendered image, so none of them
  could see any of these three defects.
- [stale-filesystem-path-treated-as-stable-identity](../logic-errors/stale-filesystem-path-treated-as-stable-identity.md)
  — a different bug from the same session's QR/favicon feature work, not the
  same defect: that one was a wrong *source file* (an attachment path
  silently overwritten); this one is a wrong *crop and encoding* of the
  correct source file. Sibling incidents from the same feature, not the same
  root cause.

Introduced in PR #40 (`feat: add WeChat QR code to footer`) and PR #43
(`fix: proper favicon and full-resolution QR code SVG`, where the naive-pixel
SVG and the first crop attempt landed), fixed in PR #44 (`fix: correct QR
code crop and revert favicon to approved chop`) and PR #45 (`fix:
theme-aware WeChat QR card, fix aspect-ratio bug`). All merged to `main` and
live on shengchangmd.com.
