---
title: "A reused attachment filename silently swapped the favicon's source image for a QR code fragment, and every check stayed green"
date: 2026-08-24
category: logic-errors
problem_type: stale_path_assumed_stable_content
component: public/favicon.png / public/favicon-dark.png / public/apple-touch-icon.png / src-photos/
severity: medium
symptoms:
  - 'the favicon "does not look like it exists" — reported only by a human looking at the live site'
  - 'the built favicon is a black-and-white fragment (a QR code corner finder pattern), not the seal it was supposed to be'
  - 'every test, typecheck, and build verification passes with the wrong image shipped'
  - 'the file copied from disk was not the file the user most recently sent for that purpose'
  - 'a second, unrelated attachment sent later in the same conversation silently overwrote the first at the same filesystem path'
stack:
  - Claude Code attachment handling
  - macOS Downloads folder
  - Pillow (PIL)
  - Astro 5 static assets
time_to_diagnose: 'a few minutes once the user flagged it visually; the root cause (path reuse) took one more re-inspection of the file to confirm'
recurrence_risk: 'high — any workflow that reads an attached file by a harness-assigned path rather than verifying its content at the moment of use is exposed to this, and this repo receives frequent one-off image attachments (chop crops, favicons, QR codes)'
tags:
  - attachments
  - file-identity
  - race-condition
  - assets
  - images
  - verification-before-completion
  - ai-generated-content
---

# A reused attachment filename silently swapped the favicon's source image for a QR code fragment, and every check stayed green

> **Category note.** Filed under `logic-errors`, alongside
> [green-checks-that-cannot-see-the-defect](green-checks-that-cannot-see-the-defect.md):
> both are "a false assumption shipped a wrong artifact while every automated
> check stayed green." The runner-up was `integration-issues`, but that
> category is about build-tool/framework wiring failing silently (Tailwind
> never compiling) — this isn't a tooling failure. Nothing was misconfigured.
> A filesystem path just stopped meaning what it meant a few messages earlier,
> and nothing in the pipeline could have known that.

## The problem

A favicon shipped to production (`public/favicon.png`, `favicon-dark.png`,
`apple-touch-icon.png`, PR #41) was not a chop at all — it was a cropped
fragment of a WeChat QR code's black-and-white corner finder pattern.

The source was an attachment saved by the harness to a fixed path,
`~/Downloads/IMG_7366.JPG`. Between the user sending the chop reference image
and the assistant reading that path, the user sent a second, unrelated
attachment — a WeChat QR code screenshot — that reused the same filename and
silently overwrote it. The assistant read the path, not the content: it had
no signal that the bytes underneath had changed, and it cropped a region it
remembered as "the seal" from when the image was first described. That
region, in the new file, was a QR finder square.

All 202 tests, the typecheck, and both `postbuild` verifiers passed. None of
them inspect whether an image's *content* matches what it's claimed to be —
that check doesn't exist and can't be automated. The defect was only caught
when the user opened the live site and said "the favicon does not look like
it exists," which sent the assistant back to re-open the saved file and see,
by looking at it, that it was a QR fragment.

## Root cause

**A file path is not a content guarantee, and nothing between "user attaches
an image" and "assistant reads it from disk" enforces that it still is what
it was when described.**

The harness's fixed-filename save behavior — reusing `IMG_7366.JPG`-style
names across separate attachments in the same conversation — means a path can
point at entirely different bytes than it did a few messages earlier.
Trusting the path, rather than re-verifying the content at the moment of use,
is the whole failure. The crop coordinates weren't wrong; they were applied
to the wrong image.

## The solution

Two layers: an immediate stopgap that removed the bad asset without waiting
on a fresh attachment, and a verification discipline applied to every
subsequent image before it was trusted.

### 1. Stopgap: rebuild from a known-good source, not from the unverified crop

Rather than re-attempt a crop from the same (still-unverified) file, the
favicon was regenerated from `public/images/chop-mask.png` — the already
approved, already-shipped alpha mask of the real chop (see
[raster-logo-cannot-serve-two-themes](../ui-bugs/raster-logo-cannot-serve-two-themes.md)) —
composited onto solid per-theme backgrounds with PIL, using the site's
existing `--seal` design tokens rather than inventing new colors:

```python
from PIL import Image

mask = Image.open('public/images/chop-mask.png')  # known-good alpha mask
alpha = mask.split()[-1]

def make_favicon(bg_hex, ink_hex, size, out_path):
    bg = Image.new('RGBA', mask.size, bg_hex)
    fg = Image.new('RGBA', mask.size, ink_hex)
    composed = Image.composite(fg, bg, alpha)  # alpha selects ink vs. background
    composed.resize((size, size), Image.LANCZOS).convert('RGB').save(out_path)

make_favicon('#ffffff', '#c1392b', 32, 'public/favicon.png')       # --seal, light
make_favicon('#1a1512', '#e0685a', 32, 'public/favicon-dark.png')  # --seal, dark
```

This restored a correct favicon immediately, without depending on a fresh
attachment arriving.

### 2. Verify content before trusting any future image, every time

When the user later supplied a genuinely new chop and favicon crop — as
distinctly-named files, `scmd.chop.png` / `scmd.favicon.png`, avoiding the
collision — each was checked before use rather than assumed correct because
the filename was new:

- **Alpha sanity**: corner pixels sampled to confirm `alpha == 0`
  (transparent) and center pixels to confirm `alpha ≈ 254` (opaque) — proof
  of a genuine transparent cutout, not a flattened image that only looks
  transparent.
- **Edge quality**: the alpha histogram checked for a wide spread of
  intermediate values (~214 distinct levels), confirming soft graduated
  stroke edges rather than a hard 0/255 cutout that would read as jaggy or
  fake.
- **Character correctness by eye**: the new chop was cropped and compared
  side-by-side against the previously-approved mask to confirm the same
  three characters (張勝雄) in the same arrangement, undistorted.

The same discipline caught a separate bad asset in the same session *before*
it was ever used: an AI-generated candidate, rejected because zooming into
its embedded favicon preview showed **雄 duplicated** (張勝/雄雄 instead of
張勝雄), and boosting contrast 3× on its "seal" artwork revealed no texture
underneath — a flat red field with no real carving. Neither defect was
visible without zooming in and looking; nothing in the pipeline would have
caught either automatically.

## Prevention

**The trigger to watch for:** more than one image attachment arriving in the
same conversation, especially through a screenshot or paste flow rather than
a deliberately-named file upload. macOS's screenshot/paste-to-file mechanism
(and similar flows elsewhere) frequently reuses a single filename —
`IMG_7366.JPG`, `Screenshot.png`, `Clipboard.png` — for every new capture.
The path is stable; the bytes behind it are not. Any workflow that reads "the
file at that path" instead of "the bytes attached to this message" is exposed
the moment a second image arrives before the first has been consumed.

**The habit that would have prevented this:** copy every supplied attachment
to a distinctly-named, timestamped file in the project **immediately on
receipt** — before describing it, before discussing it, before doing anything
else. Never defer the copy to "when I get to that task," and never trust that
a path mentioned earlier in the conversation still holds the same content it
held when it was mentioned. The moment a second attachment lands, any
unclaimed reference to the first one by path is already stale. The second
chop image in this session was handled correctly this way — copied to a
timestamped file in the same turn it arrived — and the first one wasn't,
which is the entire difference between the two outcomes.

**The verification habit that's still missing without this:** before
promoting any supplied image to a production asset — logo, favicon, icon,
anything that ships — open and look at the actual file about to be used,
right before it's used. Not a description of it from earlier in the
conversation, not an assumption carried forward from when it was first
mentioned. A remembered summary ("that's the chop mockup with the favicon
preview") is a claim about a point in time; the file on disk right now is the
only thing that's actually true. A five-second look at the cropped favicon
before shipping — comparing it against what a chop seal actually looks like —
would have caught a black QR-code corner square standing in for red seal
script.

**Why no automated test catches this class of bug.** Every check in this
repo's suite — `npm test`, `tsc --noEmit`, `verify-css.mjs`,
`verify-build.mjs` — asks structural questions: does the file exist, is it a
valid PNG, does it have an alpha channel, is it referenced from the HTML it
should be referenced from. None of them can ask "is this the image the human
meant to send," because that's not a property of the file — it's a property
of a conversation that happened outside the repository. A hash-pinning test
(fail the build if `favicon.png`'s hash changes without a matching manifest
entry) would catch an *accidental* regeneration, but it wouldn't have helped
here: the asset was regenerated deliberately, from what the assistant
believed — wrongly — was the correct source. There is no test for "the input
to a correct pipeline was itself wrong." The only defense here is procedural,
not automated: verify inputs at the moment of use, not the moment they were
described.

**What worked, and is worth repeating deliberately.** A separate candidate
image in this same session — AI-generated, offered as a possible chop
replacement — was checked and rejected before it ever reached the repository,
because the assistant zoomed into the embedded Chinese characters and read
them stroke-by-stroke rather than trusting the overall shape of the image. It
found 雄 duplicated where the correct name is 張勝雄 — a known failure mode of
AI image generators, which reliably get CJK character count and structure
wrong even when the overall composition looks plausible at a glance. On a
site where a name has to be exactly right, "zoom in and read the actual
characters, every time a new source image is proposed" is a cheap habit that
caught a real defect here and should be applied to every future asset with
text in it, generated or otherwise.

## Related

- [raster-logo-cannot-serve-two-themes](../ui-bugs/raster-logo-cannot-serve-two-themes.md)
  — same asset (`chop-mask.png`, the favicon), same open question restated
  from a different angle: that document ends by saying the favicon "is still
  the old placeholder, and that is why." This incident is the actual attempt
  to fill that gap, and shows the attempt failing for a reason that has
  nothing to do with masks or contrast — the *source file itself* was wrong
  before any image processing began.
- [green-checks-that-cannot-see-the-defect](green-checks-that-cannot-see-the-defect.md)
  — directly on-point structurally: another case where the full test suite,
  typecheck, and build all stayed green while the shipped artifact was wrong.
  Adds a failure mode that document's taxonomy doesn't yet have: none of its
  three shapes (entangled oracle / scope-narrow / unasked) covers "the input
  itself silently became a different file between being referenced and being
  read" — this is arguably a fourth shape, upstream of all three, since no
  check on the code could ever see a swapped *source asset* that was never
  committed to the repo.
- [duplicated-facts-and-partial-fix-propagation](duplicated-facts-and-partial-fix-propagation.md)
  — a weaker, thematically-adjacent fit: that doc is about a fact stored in
  two *repo* locations drifting apart, not about an external, untracked input
  path being silently reused. Worth a passing mention, not a strong
  cross-reference.

Introduced in PR #41 (`feat: update favicon to use Dr. Chang's name chop`),
diagnosed and stopgapped in PR #44 (`fix: correct QR code crop and revert
favicon to approved chop`), resolved with a verified source in PR #46 (`feat:
new chop and favicon from verified source images`). All three merged to
`main` and live on shengchangmd.com.
