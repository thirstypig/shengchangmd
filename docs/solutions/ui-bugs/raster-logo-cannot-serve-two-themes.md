---
title: "A supplied raster logo bakes in its own background, so it cannot serve two themes"
date: 2026-08-19
category: ui-bugs
problem_type: theme_incompatible_asset
component: src/components/Logo.astro / public/images/chop-mask.png / src/styles/global.css
severity: medium
symptoms:
  - 'a logo the owner supplied looks correct in one theme and wrong in the other'
  - 'the mark shows as a light rectangle on a dark header, because its own paper ground is opaque'
  - 'the artwork is a photograph of a physical object, so it has paper texture and no alpha channel'
  - 'the ink itself fails contrast against one of the two grounds even after the background is removed'
  - 'nothing throws, nothing fails to build, and no test resolves a color, so every check stays green'
  - 'the obvious fix — export two colored copies — silently creates a second copy of the artwork'
  - 'the file is orders of magnitude larger than the size it renders at'
stack:
  - Astro 5
  - CSS custom properties
  - CSS mask-image
  - Pillow (PIL)
time_to_diagnose: 'about 20 minutes, all of it measurement rather than debugging'
recurrence_risk: 'medium — it recurs whenever anyone supplies real-world artwork (a stamped seal, a scanned signature, a photographed sign) for a themed site, and the sibling practice sites have not been given logos yet'
tags:
  - theming
  - dark-mode
  - accessibility
  - contrast
  - assets
  - images
  - duplicated-facts
  - design-tokens
---

# A supplied raster logo bakes in its own background, so it cannot serve two themes

> **Category note.** Filed under `ui-bugs`: the defect is entirely visual, and
> the whole test suite, the typecheck and both `postbuild` verifiers pass with
> the broken asset in place. The runner-up was `logic-errors`, because the
> tempting fix — one PNG per theme — is the
> [duplicated-facts](../logic-errors/duplicated-facts-and-partial-fix-propagation.md)
> defect wearing a different hat.

## The problem

The site owner supplied a photograph of Dr. Chang's physical name chop —
張勝雄 carved in 篆書 seal script, stamped in cinnabar ink on cream paper — and
asked for it to be the site logo "for light mode and dark mode".

It could not be used as supplied. Not because it was bad artwork; it is the best
asset this site has. Because **a raster image of a stamped seal encodes two
things at once: the ink and the paper it was stamped on.** A themed site needs
both to vary, and a PNG can vary neither.

Measured against the site's two grounds:

| | Value | On `#ffffff` | On `#1a191d` |
| --- | --- | --- | --- |
| Paper ground | `#f6f3ec` | 1.11:1 | **15.78:1** |
| Mean ink | `#cd5b49` | 4.05:1 | 4.32:1 |
| Darkest ink | `#ab1003` | 7.48:1 | **2.34:1** |

Two separate failures, and they pull in opposite directions:

- The **paper** is nearly invisible on white and screamingly obvious on
  charcoal. On the dark header the logo would have rendered as a bright cream
  rectangle with a seal inside it.
- The **ink**, once you imagine the paper gone, is `2.34:1` on charcoal at its
  darkest — under the 3:1 that WCAG 1.4.11 asks of a non-text graphic.

Also: 1254×1254 and **2,795,825 bytes**, to render at 44px in a header.

## Why the obvious fixes are wrong

**Export a light version and a dark version.** This is the intuitive answer and
it is the trap. It creates two copies of one piece of artwork, and this repo has
a written history of what happens next: a fact stored twice drifts, and the fix
reaches one copy. Six instances of that in a single session are documented in
[duplicated-facts-and-partial-fix-propagation](../logic-errors/duplicated-facts-and-partial-fix-propagation.md).
Two logo files means the next crop, the next color correction, or the next
favicon regeneration lands on one of them.

**Use a CSS `filter` to lighten it in dark mode.** `filter: brightness(1.4)`
lightens the paper along with the ink, so the cream rectangle gets *worse*. It
also gives no control over the resulting hue.

**Set the PNG as a `background-image` and hope.** Same problem — the paper is
inside the image, so nothing in CSS can reach behind it.

**Hand-trace it as SVG paths.** Correct in principle and wrong for this asset:
the seal's character is in its *erosion* — the broken, grainy stroke edges a
physical chop leaves. Vectorizing it would produce clean strokes that no longer
look stamped, and hand-tracing 篆書 glyphs risks malforming a person's name.

## Root cause

**An image carries shape and color as one inseparable thing. A themed
interface needs them to be two separate things.**

That is the whole diagnosis. Everything downstream follows from it: the paper
can't be removed because it's the same pixels as the ink; the ink can't be
recolored because it's the same pixels as the shape.

## The solution

Split shape from color. The PNG keeps only the **shape**, as an alpha channel;
a **design token** supplies the color.

### 1. Reduce the photograph to an alpha mask

Paper becomes transparent, ink becomes opaque, and the eroded stroke edges
survive as *partial* alpha rather than being thresholded into jaggies.

The threshold was measured, not guessed. Sampling the image on a grid and
bucketing each pixel's "inkiness" — how far its luminance falls below the paper
— gave a clean separation:

```
inkiness  share of pixels
  0.0      70.81%     <- clean paper
  0.1       3.07%
  ...
  0.7      10.85%     <- strokes
  0.8       4.98%

margin strip, max inkiness:  0.061   <- the worst paper grain in the image
known-blank gap, max:        0.047
```

Paper grain tops out at **0.061** and the strokes sit at **0.6–0.8**, so the
cut goes at **0.10** — inside the gap, with room on both sides. A first attempt
used `0.06` and produced an ink bounding box of nearly the whole frame, because
it was catching grain.

```python
from PIL import Image

im = Image.open('shengchangchop.png').convert('RGB')
w, h = im.size
def lum(p): return 0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2]
src = im.load()

# Paper from the four corners, so one stray dark pixel cannot skew it.
paper = sum(lum(im.getpixel(p)) for p in ((4,4),(w-5,4),(4,h-5),(w-5,h-5)))/4

FLOOR, CEIL = 0.10, 0.75          # grain maxes at 0.061; ink sits at 0.6-0.8
mask = Image.new('L', (w, h)); mk = mask.load()
for y in range(h):
    for x in range(w):
        a = (paper - lum(src[x, y])) / paper
        a = 0.0 if a < FLOOR else min(1.0, (a - FLOOR)/(CEIL - FLOOR))
        mk[x, y] = int(a * 255)

# Crop to the ink, pad evenly, square it so the seal never renders stretched.
bbox = mask.getbbox()
pad = int(max(bbox[2]-bbox[0], bbox[3]-bbox[1]) * 0.04)
cropped = mask.crop((max(0,bbox[0]-pad), max(0,bbox[1]-pad),
                     min(w,bbox[2]+pad), min(h,bbox[3]+pad)))
side = max(cropped.size)
sq = Image.new('L', (side, side), 0)
sq.paste(cropped, ((side-cropped.size[0])//2, (side-cropped.size[1])//2))

out = sq.resize((256, 256), Image.LANCZOS)
rgba = Image.new('RGBA', (256, 256), (255, 255, 255, 0))
rgba.putalpha(out)
rgba.save('public/images/chop-mask.png', optimize=True)
```

**2,795,825 bytes → 44,159 bytes.** 63× smaller, and now one file instead of
the two a per-theme export would have needed.

### 2. Give the seal its own token

```css
:root {
  /* The seal. Cinnabar, not --brand: a name chop is an artifact with its own
     traditional ink color, and forcing it to the UI's burgundy would make it
     look like a recolored logo rather than a seal. Like --brand it keeps its
     hue between themes and moves only lightness. */
  --seal: #c1392b;   /* 5.40:1 on --surface */
}

html[data-theme='dark'] {
  --seal: #e0685a;   /* 5.24:1 on --surface */
}
```

Hue `5.6°` and `6.3°` — a **0.7° gap**, so it is recognizably one ink at two
lightnesses rather than two colors.

### 3. Paint the mask with the token

```css
.chop {
  width: var(--chop-size, 40px);
  height: var(--chop-size, 40px);

  background-color: var(--seal);
  -webkit-mask-image: url('/images/chop-mask.png');
  mask-image: url('/images/chop-mask.png');
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

/* Without mask support this span is an empty colored block — worse than
   nothing beside a wordmark. Hide it; the wordmark already names the practice. */
@supports not ((-webkit-mask-image: url('')) or (mask-image: url(''))) {
  .chop { display: none; }
}
```

The element is a `<span>` with `role="img"` and an `aria-label` read through
`getTranslation`, so it carries no literal string and satisfies
`tests/i18n/shared-component-labels.test.ts` by construction.

### 4. Keep the original out of the repo

`src-photos/` is gitignored. Only the derived 44 KB mask is committed — the same
rule the doctor's portrait already follows.

## What this bought beyond the fix

- **One asset, two themes, no second copy.** The drift hazard never exists.
- **Resolution independence in practice.** The same 256px mask renders at 44px
  in the header and 340px in the hero and stays crisp, because a mask scales as
  coverage rather than as pixels.
- **The texture survives.** Partial alpha preserves the eroded stroke edges that
  make it read as a physical stamp rather than a font.

## Prevention

**The trigger to watch for:** someone supplies real-world artwork — a stamped
seal, a scanned signature, a photographed sign, a logo exported from a print
file — for a site that has more than one theme. That artwork will have an opaque
ground, and the ground is the whole problem.

**The question to ask first:** *is this artwork one color?* If yes, it belongs in
a mask, not an `<img>`. Multi-color artwork genuinely needs per-theme exports and
a `<picture>` with `media="(prefers-color-scheme: dark)"` — but a single-ink mark
does not, and single-ink is the common case for logos.

**Measure before designing.** Every decision here came from a number: the paper
at 15.78:1 said the ground had to go, the ink at 2.34:1 said one color could not
serve both themes, and the 0.061/0.6 grain-to-ink gap set the threshold. None of
it was visible by looking at the file.

**Don't let a test's silence reassure you.** No check in this repo resolves a
color on a rendered page. The suite, the typecheck, `verify-css` and
`verify-build` all pass with a cream rectangle in the dark header. This is the
same blind spot recorded in
[green-checks-that-cannot-see-the-defect](../logic-errors/green-checks-that-cannot-see-the-defect.md).

**What can be tested.** `tests/styles/contrast.test.ts`, added the same day,
parses the token blocks out of `global.css` and asserts contrast and hue
stability. It covers `--seal` as a token pair. It **cannot** see whether the mask
is applied, whether the artwork is the right artwork, or whether the paper was
actually removed — that still needs eyes on both themes.

### A related trap in the same area

The favicon **cannot** use this technique. A favicon is a real image file with
baked-in pixels; it cannot take a custom property. It needs either two exported
PNGs behind `media="(prefers-color-scheme: dark)"`, or one color chosen to work
on both browser chromes. At the time of writing the favicon is still the old
placeholder, and that is why.

## Related

- [tailwind-palette-classes-bypass-theme-tokens](tailwind-palette-classes-bypass-theme-tokens.md)
  — the same root shape one layer up: a color that does not reach the token
  layer keeps one theme's value in both.
- [duplicated-facts-and-partial-fix-propagation](../logic-errors/duplicated-facts-and-partial-fix-propagation.md)
  — why two theme-specific PNGs would have been the wrong fix.
- [green-checks-that-cannot-see-the-defect](../logic-errors/green-checks-that-cannot-see-the-defect.md)
  — why a full green suite said nothing about this.

Shipped in `e984d05`, merged to `main` in PR #37 and live on shengchangmd.com
since 2026-08-20. Verified against production: the mask returns HTTP 200 and
both `--seal` values are present in the served stylesheet.
