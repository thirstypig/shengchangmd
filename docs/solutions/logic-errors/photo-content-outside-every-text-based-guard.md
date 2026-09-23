---
title: "A home address, three people's private letters, and a campaign-donation record almost shipped to a public repo — all as pixels inside JPEGs, invisible to every guard that scans text"
date: 2026-08-25
category: logic-errors
problem_type: verification_scope_mismatch
component: scripts/prepare-photo-assets.sh / public/images/gallery/ / tests/data/source-integrity.test.ts
severity: critical
symptoms:
  - 'a fact-duplication guard exists specifically to catch the address appearing outside practice.ts, and it stays green while the address ships'
  - 'six task-scoped code reviews, each reading a diff, all pass cleanly'
  - 'typecheck, the full test suite, and both postbuild verification scripts are all green'
  - 'the defect is only visible by opening the image files and reading what is printed on the page inside them'
  - 'an exclusion list built for one narrow reason (a single archive's watermark) is silently trusted to cover a much broader constraint (do not republish private/third-party/rights-encumbered material)'
  - 'the same address ships again a month later as EXIF GPS, where the fix for the first incident — a human looking at the picture — structurally cannot see it'
stack:
  - Astro 5
  - sips (macOS image processing)
  - vitest
  - subagent-driven development (per-task review + final whole-branch review)
time_to_diagnose: 'zero for five task-scoped reviews and every automated check; minutes for the final whole-branch review, once it actually rendered and read the images instead of reviewing the diff'
recurrence_risk: 'high — recurs any time a batch of scanned documents or photographs is run through an automated selection/exclusion pipeline and nobody looks at what is actually printed on each one, which is the default way to work with a folder of 100+ images in a chat-driven workflow'
tags:
  - privacy
  - pii
  - image-content
  - verification-before-completion
  - code-review-scope
  - subagent-driven-development
  - photographs
---

# A home address, three people's private letters, and a campaign-donation record almost shipped to a public repo — all as pixels inside JPEGs, invisible to every guard that scans text

## The problem

A 103-photo personal archive was sorted into two destinations: 8 curated
certificate/civic photos for a medical practice's public About page, and
~92 remaining personal photos for a separate, unlinked gallery page. The
sorting logic was a single explicit rule: exclude the 3 photos watermarked
by the Arcadia Public Library archive (the one rights holder this repo had
already identified as requiring written permission — see
`CLAUDE.md`'s "Arcadia History Collection" section), select 8 named files
for the About page, and route everything else — unread — into the gallery.

That pipeline ran, was implemented across five separate tasks, and every
one of those tasks passed its own task-scoped code review: diffs were
read, file counts were checked, the 3 blocked filenames were confirmed
absent by filename grep, `npx tsc --noEmit` was clean, and all 203 tests
passed at every step, including `tests/data/source-integrity.test.ts` —
the exact test written to fail the build if the practice's street address
appears anywhere outside `practice.ts`.

None of that caught it. Three of the ~92 "safe" gallery photos were scans
of letters **addressed to the doctor's home** — a 1986 letter from the
Governor of California, a 1988 letter from an LAUSD board member, and a
1988 letter from a congressional campaign — each with the full residential
street address printed in the letterhead, legible at full resolution. The
same three letters, plus a fourth, also carried other named individuals'
original signatures and private correspondence, and one explicitly
documented a political campaign donation. A different, separately-selected
certificate for the About page turned out to be signed by a U.S. Senator
"in support of my 1988 reelection campaign and the ideals of \[a
political party\]" — content the site owner had approved by description
("a certificate signed by \[name\]"), not by its actual text.

## Root cause

**Every guard in this repository that protects the practice's address
operates on text.** `source-integrity.test.ts` reads `.astro` and `.ts`
source files with `readFileSync` and searches for the literal street
string. It is airtight against a second copy of the address being typed
into a page, a component, or a JSON-LD block — which is the exact
historical defect it was built for (see
`duplicated-facts-and-partial-fix-propagation.md`). It has no mechanism
to see a JPEG, because the address in this incident was never text in any
file the test reads. It was ink, photographed, on a letter, resized by
`sips`, and shipped as a binary asset. The test's scope — "source files
containing the address as a string" — is narrower than the actual
constraint — "the address must not be published anywhere this repo
serves," which includes image content.

**The exclusion list encoded one instance of a constraint and was trusted
as if it covered the whole constraint.** The asset-prep script's blocklist
contained exactly 3 filenames, for exactly one reason: those were the
photos this project had already identified as carrying a specific rights
restriction (the Arcadia Library's watermark). Every other file — ~92 of
them — was treated as cleared for publication by default, because nothing
in the pipeline asked a broader question: *does this specific photo
contain private information, a third party's material, or content the
owner has not actually seen the full text of?* A list built to solve "we
know these 3 are off-limits" was never a list that could also catch "we
haven't checked whether any of the other 92 are off-limits" — those are
different claims, and only the first one was ever verified.

**Five task-scoped reviews, each reading a diff, structurally cannot see
this.** A code review of a diff that adds 92 binary image files sees
filenames, byte counts, and dimensions — not what is printed on the pages
inside them. Diff-scoped review is precisely engineered to catch scope,
interface, and logic errors in the *code* that moves the files; it has no
purchase on the *content* of the files themselves. This is the same shape
documented in `green-checks-that-cannot-see-the-defect.md`, extended one
level further: that write-up is about checks whose scope stops at parsed
source text; this incident is about checks (and reviews) whose scope
never included pixels at all.

## The solution

**The final whole-branch review actually opened and read the images**,
rather than treating "diff is clean, tests are green, sitemap is
consistent" as sufficient evidence. It read all ~92 gallery thumbnails at
contact-sheet scale and a sample of files at full resolution — the same
technique used earlier in this same project to catch a fabricated map
embed URL and an invented Chinese name (see `CLAUDE.md`'s incident
history) — and found the address, the third-party correspondence, and the
donation record by literally reading what was printed on each document.

The fix was content triage, not code: the owner was shown exactly what
each flagged photo contained (not "a letter," but the specific address,
the specific signatures, the specific sentence about a campaign donation),
and made the call per item — 4 photos removed entirely (image files and
their data-file entries), 1 certificate kept once its actual wording was
seen, 2 press clippings kept by explicit decision despite the plan's
original blanket exclusion. No code fix could have produced this outcome
correctly; the review's job here was surfacing ground truth for a human
decision, not remediating a bug.

## Prevention

**The trigger to watch for:** any pipeline that runs a batch of scanned
documents, photographs, or other image content through automated
selection/exclusion logic, where the exclusion criteria were derived from
a *known* problem (a specific watermark, a specific rights holder) rather
than from actually reviewing each item's content. The gap is largest
exactly when the automation makes the batch feel reviewed — a script ran,
named files, checked filenames — because that produces every signal of
diligence except the one that matters.

**Habit — the final review of any image-bearing change must open the
images, not just diff the file list.** This is now demonstrated twice in
this repository (this incident, and the Arcadia Library watermark check
in the same review) to be the only method that actually catches
content-level defects. A per-task review scoped to one task's diff cannot
do this reliably at scale — it is exactly why a *separate*, final,
whole-branch review exists in this project's development process, with
explicit instructions to verify claims rather than trust them. Skipping
that final pass, or treating per-task review as sufficient for an
image-heavy change, is the single change that would have let this ship.

**Habit — before trusting an exclusion list to mean "cleared for
publication," write down what question it actually answers.** "Not on
this list of 3 known-bad files" answers a much narrower question than
"safe to publish." When a batch of source material has never been
individually reviewed for content, the default for anything not
explicitly vetted should be exclusion, not inclusion — the pipeline built
here inverted that (default in, 3 named exceptions out) for content that
had never been read at all, which is the same *shape* of error as
`CLAUDE.md`'s repeated warning that "publishing a fact does not remove
the claim that contradicts it": an unreviewed default is not a neutral
default, it just hides the risk until someone finally looks.

**What's mechanically checkable, and what isn't.** The 3-watermark
exclusion is exactly the kind of thing a test can guard forever, and this
repo already has the pattern for it (`source-integrity.test.ts`'s
filename/place-id/coordinate bans). A general "no PII in any image" check
is not something this stack can automate — nothing here does OCR or
content classification, and even if it did, judgment calls like "is this
person's signature on a 1989 letter a privacy problem" or "is this
certificate's actual wording acceptable for a medical practice site" are
inherently owner decisions, not test assertions. The durable prevention is
procedural: no image-bearing batch ships without someone having actually
looked at the images, and the final review is the checkpoint that
enforces that, not any test.

## 2026-09-23: the same address again, in bytes nobody renders

A red-team pass found **GPS EXIF in 90 of 189 published images**. About seventy
shared one coordinate pair, roughly four miles from the office:

```
34.1539, -118.0656   ~70 files   (a residence)
34.1022, -118.1035    several    (the office — harmless)
```

Fourteen of them were on `/about/`, which is indexed. Anyone could download a
certificate photo and read the doctor's home address out of the file.

**This is the same fact, the same repo, and a different medium.** August's
incident was a home address *printed on the page* inside a JPEG; the fix was a
human privacy review of what each picture shows. That review ran, and it was
sound — and it could not possibly have caught this, because there is nothing to
see. `Read` renders the image. Preview renders the image. A reviewer looks at
the image. The coordinates are in a header no renderer displays.

So the lesson from August generalises further than it was written:

> A guard that scans text cannot see pixels.

becomes

> **A guard sees one representation of a file. A fact can live in any of them.**

Text rules could not see pixels; a pixel review could not see headers.

### Why the existing guards were all green

- `tests/data/source-integrity.test.ts` forbids the street address and
  coordinates *outside `practice.ts`* — and reads `.ts`/`.astro` source as text.
  A JPEG is not in its corpus, and EXIF is not text.
- `scripts/verify-build.mjs` checks that referenced assets **exist**, never what
  they contain.
- `tests/assets/css-referenced-assets.test.ts` reads PNG magic bytes and alpha
  channels — the closest any guard came to opening a binary, and it looks at a
  different format for a different reason.
- The `BLOCKED` list in `scripts/prepare-photo-assets.sh` encodes four files
  excluded after the August review. It is a record of what was checked, not a
  rule about what may ship — as this document already warned.

### The fix

1. **Strip everything**, not just GPS: `exiftool -all=` over `public/images/`.
   Camera serial numbers, owner names, capture timestamps and software tags are
   all identifying.
2. **Strip at the source**: `scripts/prepare-photo-assets.sh` now strips after
   every `sips` export, so a future run cannot reintroduce it.
3. **Guard it**: `tests/assets/image-metadata.test.ts` parses JPEG segments
   directly for an EXIF GPS IFD — no `exiftool` shell-out, because CI may not
   have it. Shown red against the 90 offending files before the strip.
4. **Verify the pixels are untouched**: all 191 images were hashed by decoded
   pixel data, before and after. 188 were byte-identical. **Three were not, and
   that is the interesting part**: they carried an EXIF `Orientation` tag, so
   deleting metadata would have silently rotated them in the browser. The
   rotation was baked into the pixels first, and the dimension swap
   (1200×900 → 900×1200) confirms it. That is the August 2026 sideways-photo
   bug, arriving through a new door.

### Still exposed, deliberately

The images with GPS remain in the public repo's **git history**. Stripping the
working tree does not rewrite published commits, and rewriting them breaks every
existing clone. The practical exposure drops a lot — casual discovery is what
matters here — but it is not zero, and it is a decision the owner should make
knowingly rather than inherit silently.


## Related

- [green-checks-that-cannot-see-the-defect](green-checks-that-cannot-see-the-defect.md)
  — the direct ancestor of this incident's shape: five checks, each green
  for a reason specific to what it could see. This incident adds a sixth
  category — checks that never had visual content in scope at all — to
  that same family.
- [duplicated-facts-and-partial-fix-propagation](duplicated-facts-and-partial-fix-propagation.md)
  — `source-integrity.test.ts`'s address guard, which this incident
  slipped past, was built in direct response to that write-up. It remains
  correct and load-bearing for its actual scope (text in source files); it
  was never designed to, and cannot, see image content.
- [../ui-bugs/hidden-attribute-overridden-by-author-display-rule](../ui-bugs/hidden-attribute-overridden-by-author-display-rule.md)
  — a much lower-stakes defect from the same feature branch, also found
  only by actually exercising the rendered result rather than trusting
  code that looked correct.
- CLAUDE.md's "Photographs" section already establishes the underlying
  discipline this incident reinforces: personal originals stay out of the
  public repo by default (`src-photos/`, and now the equivalent handling
  for this batch's source folder), and anything promoted to `public/` for
  deliberate publication is a decision, not a default.

Found during the final whole-branch review of the
`add-photo-gallery-and-recognition` branch, before any of the affected
commits were pushed — `git ls-remote` confirmed the remote was still at
the pre-image commit at the time of discovery, so remediation happened
entirely in local history and never required rewriting published commits.
