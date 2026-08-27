# Unlisted admin page for the About-page recognition photos

Date: 2026-08-26
Status: approved by owner in chat 2026-08-26

## Why

The owner corrects the recognition strip (About page, "Certificates &
Recognition") often enough — reorder, recaption, add, remove — that going
through Claude each time is overhead. He wants a URL only he knows, no login,
where he can make these corrections himself.

This site is 100% static (Astro → GitHub Pages via `.github/workflows/deploy.yml`
on push to `main`). There is no server and no database. Anything that looks
like "admin" here has to actually be: a client-side page that edits the repo
through GitHub's API and opens a PR, same shape as any other change to this
site — tests and CI still run before anything reaches production.

Three decisions were made explicitly, because each had a less-safe cheaper
alternative:

- **Writes go through a PR, not a direct push to `main`.** A direct push would
  skip `tsc`, the 208 tests, and the trilingual/contrast/source-integrity
  guards this repo has been burned into needing. A PR keeps every one of them
  in the loop.
- **Scope is the recognition strip only** (reorder / caption / add / remove
  photos in the existing 22-photo grid on `about.astro`). Not the personal
  gallery, not other pages' images or copy. Smaller surface, smaller chance of
  an edit landing somewhere it breaks a layout assumption.
- **Chinese captions are not auto-generated.** New/edited captions are English
  only. `locale-coverage.test.ts` and `source-integrity.test.ts` already fail
  the build if a `communityPhotos` key exists in `en` but not in `zh-hant` /
  `zh-hans`, or is byte-identical across locales — so a PR that adds an
  English-only caption is structurally blocked from merging clean until the
  Chinese is added. That enforcement already exists; this design leans on it
  rather than re-implementing it.

## Data model change: one source of truth for the photo list

Today the 22-photo order + filename list is written out literally, three
times, once per locale page (`src/pages/about.astro`,
`src/pages/zh-hant/about.astro`, `src/pages/zh-hans/about.astro`) — the exact
"duplicated fact, partial-fix propagation" shape documented in
`docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md`.
An admin tool that has to patch three near-identical arrays in three files to
stay consistent is a worse version of the same risk. Consolidate first:

New file `src/data/recognitionPhotos.ts`:

```ts
export interface RecognitionPhoto {
  /** Locale key: communityPhotos.<key> in src/i18n/locales.ts */
  key: string;
  /** Filename in public/images/recognition/ */
  file: string;
}

export const recognitionPhotos: RecognitionPhoto[] = [
  { key: 'photo5', file: 'banquet-speech-1987.jpg' },
  { key: 'photo2', file: 'la-county-commendation-1988.jpg' },
  // ... all 22, in the curated PR #58 visual order
];
```

All three `about.astro` pages change from a hand-written array to:

```ts
import { recognitionPhotos } from '@data/recognitionPhotos';

const galleryPhotos = recognitionPhotos.map((p) => ({
  src: `/images/recognition/${p.file}`,
  alt: getTranslation(locale, `communityPhotos.${p.key}`),
}));
```

(`locale` is already a per-page constant/prop in each of the three files.)

English captions stay exactly where they are today — `translations.en
.communityPhotos.photoN` in `locales.ts` — as do the `zh-hant`/`zh-hans`
values. Only the order + filename list moves.

### Test change this requires, and why it's not a weakening

`tests/data/source-integrity.test.ts`'s "every key is read by at least one
page" check currently does `allCode.includes('communityPhotos.photo5')` —
literal-substring search across every `.astro` file. After this change, no
page contains that literal string for `communityPhotos` keys anymore; they're
built from `recognitionPhotos.ts` + a template string.

Fix: teach that one check, for the `communityPhotos` block specifically, to
treat "key appears in `recognitionPhotos.ts`'s `key` list" as equivalent to
"read by a page" — because it now genuinely is, indirectly through the shared
data file, the same way the test's own history already moved from a
hand-maintained block list to one derived from `translations.en` (see the
comment already in that file about `patientScope`/`coverage`). Every other
block's check (footer, serviceCards, patientScope, coverage) is untouched —
they still work exactly as they do today, since they have no equivalent data
file. This is the one deliberate test edit in this design; call it out
explicitly when it lands.

## The admin page

New route: `/manage-recognition-9f2k/` (unguessable-ish, not secret — nothing
happens without a valid token, so obscurity is a courtesy, not the security
boundary). Owner can rename the slug later; it's a one-line change.

Built the same way as `src/pages/family-photos-2026.astro`: no
`BaseLayout`/`Header`/`Footer` import, hardcoded `<meta name="robots"
content="noindex, nofollow">`, excluded from the sitemap filter in
`astro.config.mjs`, not linked from any nav or page. English-only UI chrome —
this is a tool, not site content, so the trilingual-content rule doesn't apply
to its own labels (only to the captions it edits, which are site content).

`tests/routes/gallery-unlisted.test.ts` already exists to guard exactly this
shape for `family-photos-2026.astro`. Generalize it (or add a sibling test)
to also cover `manage-recognition-9f2k.astro`, so the same regression it
guards against — a page that renders `noindex` but still gets auto-discovered
into the sitemap — can't happen here either.

### UI

- On load: fetch `src/data/recognitionPhotos.ts` and the `communityPhotos`
  block of `src/i18n/locales.ts` from the `main` branch via GitHub's Contents
  API (unauthenticated `GET` works for a public repo, rate-limited more
  strictly without a token — fine for one person's occasional use). Parse out
  the current order, filenames, and English captions.
- Grid of the 22 photos, drag-to-reorder (native HTML5 drag-and-drop, no
  library — matches this repo's zero-npm-UI-dependency convention).
- Each photo: thumbnail, an English caption `<textarea>`, a remove button.
- An "Add photo" control: file picker, accepts images. On selection, each
  image is drawn to an off-screen `<canvas>` and re-exported as JPEG — this
  **bakes in physical pixel orientation and strips EXIF**, which is the exact
  bug class fixed by hand earlier this session (a stale `Orientation: Rotate
  90 CW` tag surviving a `sips -r 90` pixel rotation and getting
  double-applied by the browser). Uploads through this tool can't carry that
  defect forward. New entries need a caption filled in before they can be
  saved (client-side required-field check, not a build-time guard).
- "Save changes" button, disabled until there's at least one real change
  (compare current state to the fetched baseline).

### Token

- A password-style input, "GitHub token," shown once at the top if
  `localStorage` has none yet. Stored in `localStorage` under a page-specific
  key, scoped to this page's origin only — never transmitted anywhere except
  as an `Authorization` header to `api.github.com`.
- The page includes a short inline note on how to mint the right token:
  Settings → Developer settings → Fine-grained personal access tokens → new
  token scoped to only the `thirstypig/shengchangmd` repository, permissions
  **Contents: Read and write** and **Pull requests: Read and write**, nothing
  else.
- A "forget token" link clears it from `localStorage`.

### Save flow (client-side, via GitHub REST API)

1. Create a new branch from the tip of `main`: `admin/recognition-photos-<timestamp>`.
2. For each newly added photo: `PUT
   /repos/thirstypig/shengchangmd/contents/public/images/recognition/<file>`
   (base64 content) on that branch.
3. For each removed photo: `DELETE .../contents/public/images/recognition/<file>`.
4. `PUT .../contents/src/data/recognitionPhotos.ts` with the reordered/edited
   array, serialized to match the existing file's formatting.
5. `PUT .../contents/src/i18n/locales.ts` with only the `en.communityPhotos`
   block's keys touched (new keys added, edited captions changed, removed
   keys deleted) — the `zh-hant`/`zh-hans` blocks are left untouched by this
   tool. A removed photo's key is deleted from `en` **and** from `zh-hant`/
   `zh-hans` in the same write, because leaving it in either Chinese block
   with no page referencing it would fail `source-integrity.test.ts`'s
   "defined but rendered by no page" check — that's a correctness
   requirement, not optional cleanup.
6. Open a PR from that branch into `main` via the Pulls API. Title:
   `Recognition photos: <n> change(s) via admin page`. Body auto-lists what
   changed (added/removed/reordered/recaptioned, by filename), and — if any
   new or edited English key has no corresponding `zh-hant`/`zh-hans`
   change — an explicit `⚠️ zh-hant/zh-hans caption for <key> needs
   translation before merging` line per affected key.
7. Show the PR URL on the page. The owner reviews CI and merges on GitHub
   himself, same as any other PR — this tool does not auto-merge.

### Error handling

- Any API call failing (bad token, network, 409 conflict from a stale branch)
  shows the raw error inline and leaves local edits intact in the page (not
  lost) so the owner can retry without re-entering everything.
- No optimistic local persistence beyond the current page load — this is a
  one-shot editing session, not a draft-saving tool. Scope explicitly
  excludes autosave/drafts for v1.

## Explicitly out of scope for this pass

- The personal gallery (`/family-photos-2026/`) — not editable from this tool.
- Any page/section other than the About page recognition strip.
- Auto-drafted or machine-translated Chinese captions.
- Auto-merge, or any write path that bypasses CI.
- Multi-user auth, activity log, undo history beyond normal git/PR history.
