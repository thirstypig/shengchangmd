---
status: decided
priority: p2
issue_id: 012
tags: [privacy, security, git-history, owner-decision, accepted-risk]
dependencies: []
---

# Two exposures were fixed going forward but remain in this public repo's history

## Problem Statement

Both were found on 2026-09-23 and fixed for everything served from now on. Neither
is fixed *retroactively*, because both live in commits that have been pushed to a
public repository. Rewriting that history breaks every existing clone, so it is a
decision the owner should take knowingly rather than inherit by silence.

## 1. The doctor's home address, as GPS EXIF in 90 images

Stripped from the working tree in PR #82. The pre-strip blobs are still reachable:

```bash
git log --all --oneline -- public/images/recognition/banquet-speech-1987.jpg
git show <pre-strip-sha>:public/images/recognition/banquet-speech-1987.jpg > /tmp/x.jpg
exiftool -GPSLatitude -GPSLongitude /tmp/x.jpg
```

~70 files carried ~34.1539, -118.0656 (a residence roughly four miles from the
office). Anyone who clones the repo can still read it.

**Options**
- **Leave it.** Casual discovery — someone downloading a photo from the site — is
  closed. Reading it now requires cloning a public repo and knowing to look.
- **Rewrite history** (`git filter-repo`, force-push, every clone invalidated, and
  GitHub may retain unreferenced objects until garbage collection; a support
  request can force that). Thorough, disruptive, and it rewrites the shared record
  of the project.
- **Make the repo private.** Removes public access to the history in one step and
  costs nothing but the open-source posture. CLAUDE.md already contemplates this
  for `src-photos/`.

## 2. The first schedule passphrase, and the ciphertext it opens

`wordpress` was published in PR #75's body (my error) and redacted by editing —
**GitHub keeps edit history, so redaction is not deletion**. The ciphertext that
passphrase opens is still at `6a6da79:src/data/schedule.enc.json`. Together they
yield the editorial calendar as it stood that day.

The current passphrase is different, is held only by the owner, appears in no
file, and a test fails the build if it ever does. The current ciphertext does not
open with the old passphrase (verified).

**Impact is low** — the content is an editorial calendar, not patient
information — but the page was described as private, and for that one snapshot it
is not.

**Options:** leave it (the content is not sensitive); or, if the repo is made
private for reason 1, this resolves at the same time.

## DECISION: leave it as-is (owner, 2026-09-23)

The owner chose **option A: leave both exposures in history**, after being shown
the verified facts below. This is an accepted risk, not an oversight. **Do not
reopen it, and do not rewrite history, without a new instruction from him.**

What the decision was made against, all verified on 2026-09-23:

- The address **is** still readable: `git show <pre-strip-sha>:<image>` piped to
  `exiftool` returns 34.1539, -118.0657. Two commands.
- The retired passphrase **is** still in PR #75's edit history (the 21:45 UTC
  edit), retrievable through the GraphQL `userContentEdits` field, and the
  ciphertext it opens is still at `6a6da79:src/data/schedule.enc.json`.
- The account is on **GitHub Free**, so making the repo private would have taken
  the website offline — Pages serves private repos only on Pro or above. That
  made "make it private" a ~$4/month decision rather than a free one, which is
  why it was not chosen.
- **No forks, no stars, no watchers.** No copies exist elsewhere, so nothing is
  proliferating.

What this means in practice: casual discovery is closed (nothing served from the
site carries the address), and reading it now takes cloning a public repository
and knowing to inspect old image blobs.

**If the calculus changes** — the owner upgrades to Pro for another reason, the
repo gains forks, or anything genuinely sensitive is ever committed — revisit
this file first. The cheapest fix remains making the repo private, which closes
both at once.

## Previously recommended action (superseded by the decision above)

Treat these as one decision, because **making the repo private resolves both at
once** and costs least. Ask the owner. Do not rewrite history without his explicit
instruction.

## Acceptance Criteria

- [x] The owner has chosen: **leave as-is** (2026-09-23)
- [x] The choice is recorded here with the date and the facts it was made against
- [x] The Pages-on-private constraint was checked before offering the option:
      the account is on GitHub Free, where a private repo would take the site
      offline. My first recommendation omitted this and was wrong; corrected
      before the decision was made

## Work Log

**2026-09-23** — Both found by the red team, both fixed going forward in PR #82
and PR #76 respectively. History untouched. Written up in
`docs/solutions/logic-errors/photo-content-outside-every-text-based-guard.md`.

**2026-09-23 (later)** — Owner chose option A. Both exposures are accepted,
recorded, and closed as a tracked task. Going forward the guards hold: no served
image carries metadata (`tests/assets/image-metadata.test.ts`), and the current
passphrase exists in no file, with a test that fails the build if it appears.
