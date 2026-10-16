---
status: pending
priority: p2
issue_id: 013
tags: [ci, tests, guards]
dependencies: []
---

# internal-links-exist never runs in CI

## Problem Statement

`tests/routes/internal-links-exist.test.ts` reads the built site in `dist/`
and calls `it.skip` when `dist/` does not exist. `.github/workflows/deploy.yml`
runs `npm test` **before** `npm run build`, so on every deploy the directory
is absent and the file is skipped. The check passes without ever running.

Verified 2026-10-15 by running the suite locally with `dist/` moved aside:
`Test Files 15 passed | 1 skipped`, `Tests 288 passed | 1 skipped`. With
`dist/` present: 290 passed.

This is the guard added on 2026-09-23 (PR #82) after the language switcher
offered 繁體/简体 links that 404'd on production. Since then it has protected
only local runs that happen to follow a build — the same "a check that cannot
see the defect" pattern this repo has written up several times
(`docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md`).

## Proposed Solutions

### Option A — add a post-build test step to the workflow
After `npm run build`, run
`npx vitest run tests/routes/internal-links-exist.test.ts`. The early `npm
test` keeps blocking locale regressions before the build; the new step runs
the one file that needs the output. Effort: Small. Risk: Low.

### Option B — make the test fail, not skip, when `CI` is set and `dist/` is missing
Keeps it from going silent again, but only paired with Option A; on its own
it would just fail every deploy.

### Option C — move the check into `scripts/verify-build.mjs`
It already runs post-build in CI. That is where the 2026-10-15 schema.org
vocabulary check went for exactly this reason. Loses vitest's reporting;
gains one place for every build-output assertion.

## Recommended Action

A + B: a post-build step, and a hard failure under `CI` when there is
nothing to check, so a future reordering cannot quietly reintroduce this.

## Acceptance Criteria

- [ ] The internal-links check executes on every deploy (confirm in the Actions log, not by assumption)
- [ ] Planting a broken internal link fails the deploy workflow
- [ ] A missing `dist/` under `CI` is a failure, not a skip
