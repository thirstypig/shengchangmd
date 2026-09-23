---
status: pending
priority: p2
issue_id: 012
tags: [privacy, security, git-history, owner-decision]
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

## Recommended Action

Treat these as one decision, because **making the repo private resolves both at
once** and costs least. Ask the owner. Do not rewrite history without his explicit
instruction.

## Acceptance Criteria

- [ ] The owner has chosen: leave as-is / rewrite history / make the repo private
- [ ] Whatever he chooses is recorded here with the date
- [ ] If the repo goes private, confirm GitHub Pages still serves the site (Pages
      works from a private repo on the current plan — verify before switching)

## Work Log

**2026-09-23** — Both found by the red team, both fixed going forward in PR #82
and PR #76 respectively. History untouched. Written up in
`docs/solutions/logic-errors/photo-content-outside-every-text-based-guard.md`.
