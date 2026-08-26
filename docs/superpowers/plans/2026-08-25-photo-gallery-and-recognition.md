# Personal Photo Gallery + About-Page Recognition Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish 8 curated certificate/civic photos on the About page (all 3 locales), and build one unlinked, noindex, English-only personal photo gallery page for the remaining ~92 personal photos — while permanently excluding the 3 Arcadia Public Library archive photos from both.

**Architecture:** Two independent content additions to the existing static Astro site. A one-time asset-prep script sorts, renames, and resizes source photos from `_Sheng Chang Photos/` into `public/images/`. The About-page section is server-rendered Astro + Tailwind, translated into all 3 locales via `locales.ts`. The gallery page is a standalone Astro page (does not use `BaseLayout`) with a small vanilla-JS lightbox, force-noindex, and excluded from the sitemap.

**Tech Stack:** Astro 5, Tailwind v4, `sips` (macOS, for HEIC→JPEG + resize), vitest.

**Spec:** [`docs/superpowers/specs/2026-08-25-photo-gallery-and-recognition-design.md`](../specs/2026-08-25-photo-gallery-and-recognition-design.md)

## Global Constraints

- **Never reproduce the 3 Arcadia Library archive photos** (`1475.jpg`, `1497.jpg`, `1508.jpg` in `_Sheng Chang Photos/`) anywhere — not the gallery, not the main site. No written permission yet.
- **Trilingual same-commit rule**: any new English copy (heading text reused, alt text) lands in `zh-hant` and `zh-hans` in the same commit, routed through `getTranslation()` / `locales.ts` — never hardcoded Chinese in a shared component.
- **American English** in all new English copy.
- **No fabricated facts.** Alt text describes only what is visibly printed/depicted on each item — do not assert anything the document itself doesn't state.
- **Gallery page is fully unlinked**: no nav/footer link anywhere, `noindex` regardless of `ALLOW_INDEXING`, excluded from the sitemap.
- **Theme tokens**: any Tailwind color utility class used on the About page must already be mapped in `src/styles/global.css` (verified below — stick to `gray-*`/`white`/`border` classes already used elsewhere on `about.astro`). The gallery page does not use Tailwind and is exempt (plain scoped CSS, not on-brand content).
- Run `npx tsc --noEmit` and `npm test` after every task; both must stay green.

---

### Task 1: Asset-prep script — resize and rename the selected photos

**Files:**
- Create: `scripts/prepare-photo-assets.sh` (one-time script, not part of the build; kept in the repo as a record of how the assets were derived)
- Create (script output): `public/images/recognition/*.jpg` (8 files)
- Create (script output): `public/images/gallery/thumb/*.jpg`, `public/images/gallery/full/*.jpg` (92 files each)
- Create: `src/data/galleryPhotos.ts`

**Interfaces:**
- Produces: `src/data/galleryPhotos.ts` exports `export const galleryPhotoCount: number` (92) and `export interface GalleryPhoto { id: string }` with `export const galleryPhotos: GalleryPhoto[]`, `id` values `'001'`..`'092'`, each corresponding to `public/images/gallery/thumb/{id}.jpg` and `public/images/gallery/full/{id}.jpg`.
- Produces: 8 fixed-name files under `public/images/recognition/` consumed directly by filename in Task 3 (no data file needed — there are only 8 and their names are stable).

- [ ] **Step 1: Write the script**

```bash
#!/bin/bash
# scripts/prepare-photo-assets.sh
#
# One-time asset prep for the About-page recognition photos and the personal
# gallery. Run manually from the repo root; not part of `npm run build`.
#
# Source: `_Sheng Chang Photos/` (repo root, untracked). Excludes the 3
# Arcadia Public Library archive photos (no reproduction permission — see
# docs/superpowers/specs/2026-08-25-photo-gallery-and-recognition-design.md)
# and the 8 photos selected for the About page (handled separately below, at
# higher quality since they're few and framed/read-up-close).
set -euo pipefail

SRC="_Sheng Chang Photos"
RECOGNITION_DIR="public/images/recognition"
GALLERY_THUMB_DIR="public/images/gallery/thumb"
GALLERY_FULL_DIR="public/images/gallery/full"

mkdir -p "$RECOGNITION_DIR" "$GALLERY_THUMB_DIR" "$GALLERY_FULL_DIR"

# --- 8 selected photos for the About page, explicit source -> target name ---
declare -A RECOGNITION=(
  ["IMG_1220.HEIC"]="congressional-proclamation-1988.jpg"
  ["IMG_1222.HEIC"]="la-county-commendation-1988.jpg"
  ["IMG_1233.HEIC"]="certificate-of-commendation-1988.jpg"
  ["IMG_1240.heic"]="alumni-certificate-2005.jpg"
  ["IMG_1181 copy.HEIC"]="banquet-speech-1987.jpg"
  ["IMG_1227 copy.HEIC"]="welcome-delegation.jpg"
  ["IMG_1259 copy.HEIC"]="plaque-presentation-1989.jpg"
  ["IMG_1182 copy.HEIC"]="culture-symposium.jpg"
)
for src_name in "${!RECOGNITION[@]}"; do
  target="${RECOGNITION[$src_name]}"
  sips -s format jpeg -Z 1200 "$SRC/$src_name" --out "$RECOGNITION_DIR/$target" >/dev/null
  echo "recognition: $src_name -> $target"
done

# --- Everything else, minus the 3 blocked archive photos and the 8 above ---
BLOCKED=("1475.jpg" "1497.jpg" "1508.jpg")
SELECTED=("${!RECOGNITION[@]}")
EXCLUDE=("${BLOCKED[@]}" "${SELECTED[@]}" ".DS_Store")

is_excluded() {
  local name="$1"
  for x in "${EXCLUDE[@]}"; do
    [ "$name" = "$x" ] && return 0
  done
  return 1
}

i=0
> src/data/galleryPhotos.ts.ids
for f in "$SRC"/*; do
  name=$(basename "$f")
  is_excluded "$name" && continue
  i=$((i+1))
  id=$(printf "%03d" "$i")
  sips -s format jpeg -Z 480 "$f" --out "$GALLERY_THUMB_DIR/$id.jpg" >/dev/null
  sips -s format jpeg -Z 1400 "$f" --out "$GALLERY_FULL_DIR/$id.jpg" >/dev/null
  echo "$id" >> src/data/galleryPhotos.ts.ids
done

count=$(wc -l < src/data/galleryPhotos.ts.ids | tr -d ' ')
echo "gallery: $count photos"

{
  echo "// Generated by scripts/prepare-photo-assets.sh — do not hand-edit."
  echo "export interface GalleryPhoto { id: string }"
  echo ""
  echo "export const galleryPhotos: GalleryPhoto[] = ["
  while read -r id; do
    echo "  { id: '$id' },"
  done < src/data/galleryPhotos.ts.ids
  echo "];"
  echo ""
  echo "export const galleryPhotoCount = galleryPhotos.length;"
} > src/data/galleryPhotos.ts

rm src/data/galleryPhotos.ts.ids
echo "wrote src/data/galleryPhotos.ts with $count entries"
```

- [ ] **Step 2: Run it**

```bash
chmod +x scripts/prepare-photo-assets.sh
./scripts/prepare-photo-assets.sh
```

Expected: prints 8 `recognition:` lines, then `gallery: 92 photos` (count may
differ slightly if the source folder changed since the design review —
sanity-check it's in the 85–95 range, not e.g. 3 or 103), then `wrote
src/data/galleryPhotos.ts with 92 entries`.

- [ ] **Step 3: Verify no blocked photo leaked through**

```bash
grep -l "1475\|1497\|1508" public/images/recognition/* public/images/gallery/thumb/* public/images/gallery/full/* 2>/dev/null
```

Expected: no output. (This greps filenames, which is sufficient — the loop
above renames every source file to a numeric id or a fixed target name, so no
output file's *name* will ever contain these strings; this step is a sanity
check that the exclude list actually took effect, i.e. the photo count is not
95.)

- [ ] **Step 4: Spot-check one recognition photo and one gallery photo render correctly**

```bash
sips -g pixelWidth -g pixelHeight public/images/recognition/congressional-proclamation-1988.jpg
sips -g pixelWidth -g pixelHeight public/images/gallery/thumb/001.jpg
sips -g pixelWidth -g pixelHeight public/images/gallery/full/001.jpg
```

Expected: all three report non-zero, sane dimensions (recognition ~1200px on
the long edge, thumb ~480px, full ~1400px).

- [ ] **Step 5: Commit**

```bash
git add scripts/prepare-photo-assets.sh public/images/recognition public/images/gallery src/data/galleryPhotos.ts
git commit -m "feat: derive recognition and gallery photo assets from source scans"
```

---

### Task 2: `communityPhotos` alt-text translations

**Files:**
- Modify: `src/i18n/locales.ts` — add a `communityPhotos` block to each of `translations.en`, `translations['zh-hant']`, `translations['zh-hans']`, alongside the existing `serviceCards`/`patientScope`/`coverage` blocks (same nesting level, same file).
- Test: `tests/i18n/locale-coverage.test.ts`, `tests/i18n/taiwan-register.test.ts`, `tests/data/source-integrity.test.ts` (all existing — no new test file needed; these already generically cover any new nested block, per their "derive from `translations.en`" design).

**Interfaces:**
- Produces: `communityPhotos.photo1` .. `communityPhotos.photo8`, readable via `getTranslation(locale, 'communityPhotos.photoN')`, consumed by Task 3.

- [ ] **Step 1: Add the English block**

In `src/i18n/locales.ts`, inside `translations.en`, add after `coverage`:

```ts
    communityPhotos: {
      photo1:
        'Congressional Proclamation of Excellence, Achievement and Commitment presented to Dr. Sheng H. Chang, November 4, 1988',
      photo2:
        'County of Los Angeles Commendation to Dr. Sheng H. Chang as founding president of the Arcadia Chinese Association, 1988',
      photo3: 'Certificate of Commendation presented to Dr. Sheng H. Chang, 1988',
      photo4:
        'Certificate of Appreciation from the Alumni Association of Tainan First High School of Southern California, 2005',
      photo5: 'Dr. Chang speaking at a Chinese community banquet, 1987',
      photo6: 'Dr. Chang at a welcome reception for overseas Chinese community leaders',
      photo7: 'Dr. Chang presenting a plaque at a community event, 1989',
      photo8: 'Dr. Chang speaking at a Chinese culture and education symposium',
    },
```

- [ ] **Step 2: Add the zh-hant block**

Inside `translations['zh-hant']`, same position:

```ts
    communityPhotos: {
      photo1: '美國國會眾議院於1988年11月4日頒發張勝雄醫師傑出成就與貢獻褒揚狀',
      photo2:
        '洛杉磯郡政府於1988年頒發張勝雄醫師褒揚狀，表彰其擔任 Arcadia Chinese Association 創會會長之貢獻',
      photo3: '1988年頒發張勝雄醫師之褒揚狀',
      photo4: '2005年南加州台南一中校友會頒發張勝雄醫師感謝狀',
      photo5: '張醫師於1987年在僑界宴會上致詞',
      photo6: '張醫師出席歡迎僑團首長回國致敬活動',
      photo7: '張醫師於1989年在社區活動中頒發獎牌',
      photo8: '張醫師於中華文化推廣中心文教育研討會上致詞',
    },
```

- [ ] **Step 3: Add the zh-hans block**

Inside `translations['zh-hans']`, same position (Taiwan wording in simplified
characters — `医师` not `医生`, no `信息`/`网络`/`健保`, per this repo's
`writing-taiwan-mandarin-copy` rule):

```ts
    communityPhotos: {
      photo1: '美国国会众议院于1988年11月4日颁发张胜雄医师杰出成就与贡献褒扬状',
      photo2:
        '洛杉矶郡政府于1988年颁发张胜雄医师褒扬状，表彰其担任 Arcadia Chinese Association 创会会长之贡献',
      photo3: '1988年颁发张胜雄医师之褒扬状',
      photo4: '2005年南加州台南一中校友会颁发张胜雄医师感谢状',
      photo5: '张医师于1987年在侨界宴会上致词',
      photo6: '张医师出席欢迎侨团首长回国致敬活动',
      photo7: '张医师于1989年在社区活动中颁发奖牌',
      photo8: '张医师于中华文化推广中心文教育研讨会上致词',
    },
```

- [ ] **Step 4: Run the i18n and source-integrity tests**

```bash
npx tsc --noEmit
npm test -- tests/i18n tests/data/source-integrity.test.ts
```

Expected: `locale-coverage` and `taiwan-register` pass as-is (the new keys
are non-empty in all 3 locales and carry no banned words). The
`source-integrity` "locale data is actually consumed by a page" test for
block `communityPhotos` will **fail right now** — nothing reads
`communityPhotos.photoN` yet. That's expected; Task 3 fixes it. Confirm the
failure message names exactly `communityPhotos` and lists `photo1`..`photo8`
as unread, so you know Task 2 itself introduced no typo.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales.ts
git commit -m "feat: add communityPhotos alt-text translations for all 3 locales"
```

---

### Task 3: About-page recognition photo strip (all 3 locales)

**Files:**
- Modify: `src/pages/about.astro` — inside the existing "Community & Public Service Section" (`<section class="py-16 md:py-24 bg-gray-50">`, currently lines 67–121), after the closing `</div>` of the `prose` block and before `</div></div></section>`.
- Modify: `src/pages/zh-hant/about.astro` — same section (search for `社區與公共服務`).
- Modify: `src/pages/zh-hans/about.astro` — same section.

**Interfaces:**
- Consumes: `getTranslation(locale, 'communityPhotos.photoN')` from Task 2; the 8 filenames written by Task 1 into `public/images/recognition/`.

- [ ] **Step 1: Add the strip markup to `src/pages/about.astro`**

Immediately after the `</div>` that closes `<div class="prose ...">` (the
one right before the section's outer closing tags, i.e. right after the
paragraph ending "...new Arcadia police headquarters." and its closing
`</p>`), insert:

```astro
        <div class="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <img src="/images/recognition/congressional-proclamation-1988.jpg" alt={getTranslation('en', 'communityPhotos.photo1')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/la-county-commendation-1988.jpg" alt={getTranslation('en', 'communityPhotos.photo2')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/certificate-of-commendation-1988.jpg" alt={getTranslation('en', 'communityPhotos.photo3')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/alumni-certificate-2005.jpg" alt={getTranslation('en', 'communityPhotos.photo4')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/banquet-speech-1987.jpg" alt={getTranslation('en', 'communityPhotos.photo5')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/welcome-delegation.jpg" alt={getTranslation('en', 'communityPhotos.photo6')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/plaque-presentation-1989.jpg" alt={getTranslation('en', 'communityPhotos.photo7')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
          <img src="/images/recognition/culture-symposium.jpg" alt={getTranslation('en', 'communityPhotos.photo8')} class="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200" loading="lazy" />
        </div>
```

Add the import at the top of the file's frontmatter (it currently has no
`getTranslation` import):

```astro
import { getTranslation } from '@i18n/locales';
```

(next to the existing `import { practice } from '@data/practice';` line)

- [ ] **Step 2: Add the identical block to `src/pages/zh-hant/about.astro`**

Same markup, same position (this file already imports `getTranslation`),
with `getTranslation('zh-hant', 'communityPhotos.photoN')` for each `alt`.

- [ ] **Step 3: Add the identical block to `src/pages/zh-hans/about.astro`**

Same markup, same position, `getTranslation('zh-hans', 'communityPhotos.photoN')`.

- [ ] **Step 4: Typecheck and run the full suite**

```bash
npx tsc --noEmit
npm test
```

Expected: all 202+ tests pass now, including the `source-integrity`
`communityPhotos` block check that failed at the end of Task 2 — every key
is now read by all 3 about pages.

- [ ] **Step 5: Visual check in both themes, all 3 locales**

```bash
npm run dev
```

Open `http://localhost:3120/about/`, `http://localhost:3120/zh-hant/about/`,
`http://localhost:3120/zh-hans/about/`. For each: scroll to "Community &
Public Service" / "社區與公共服務" / "社区与公共服务", confirm the 8-photo
grid renders, toggle dark mode (top-right icon) and confirm the photos and
their border are still legible (photos themselves don't need to invert —
only check nothing looks broken, e.g. no missing alt-text box, no layout
overflow).

- [ ] **Step 6: Commit**

```bash
git add src/pages/about.astro src/pages/zh-hant/about.astro src/pages/zh-hans/about.astro
git commit -m "feat: add Community & Public Service recognition photo strip"
```

---

### Task 4: Personal gallery page

**Files:**
- Create: `src/pages/family-photos-2026.astro`
- Test: `tests/data/source-integrity.test.ts` (existing — no change expected, but re-run to confirm the new page doesn't trip the "no file other than practice.ts states a clock time" or similar broad guards; it contains no such content)

**Interfaces:**
- Consumes: `galleryPhotos` and `galleryPhotoCount` from `src/data/galleryPhotos.ts` (Task 1).

- [ ] **Step 1: Write the page**

```astro
---
// Deliberately NOT using BaseLayout: this page carries no medical-practice
// content (no Header nav, no StickyCallBar/CallButton CTAs, no WeChat QR,
// no trilingual obligation — see the spec's asset-handling section). It is
// unlinked from every other page and forced noindex regardless of the
// ALLOW_INDEXING build flag or locale review status, unlike every other page
// on this site.
import { galleryPhotos } from '@data/galleryPhotos';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Family Photos</title>
  </head>
  <body>
    <h1>Family Photos</h1>
    <div class="grid">
      {galleryPhotos.map((photo) => (
        <a href={`/images/gallery/full/${photo.id}.jpg`} class="thumb" data-full={`/images/gallery/full/${photo.id}.jpg`}>
          <img src={`/images/gallery/thumb/${photo.id}.jpg`} alt="" loading="lazy" />
        </a>
      ))}
    </div>

    <div id="lightbox" class="lightbox" hidden>
      <img id="lightbox-img" src="" alt="" />
    </div>

    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f5f5f5;
        color: #222;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #111;
          color: #eee;
        }
      }
      h1 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
      }
      .thumb img {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 6px;
        display: block;
        cursor: zoom-in;
      }
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
      .lightbox img {
        max-width: 100%;
        max-height: 100%;
        border-radius: 4px;
      }
    </style>

    <script>
      const lightbox = document.getElementById('lightbox') as HTMLDivElement;
      const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement;

      document.querySelectorAll<HTMLAnchorElement>('.thumb').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const full = link.dataset.full;
          if (!full) return;
          lightboxImg.src = full;
          lightbox.hidden = false;
        });
      });

      lightbox.addEventListener('click', () => {
        lightbox.hidden = true;
        lightboxImg.src = '';
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Verify it builds and force-noindex holds**

```bash
ALLOW_INDEXING=true npm run build
grep -o 'noindex[^"]*' dist/family-photos-2026/index.html
```

Expected: prints `noindex, nofollow"` — confirming the meta tag survives
even with `ALLOW_INDEXING=true`, which is the whole point of hand-writing
this page instead of using `BaseLayout` (whose `noIndex` logic would have
made this page indexable in a production build, since `locale="en"` is
`reviewed: true`).

- [ ] **Step 3: Confirm no other page links to it**

```bash
grep -rl "family-photos-2026" src/components src/layouts src/pages/*.astro src/pages/zh-hant src/pages/zh-hans 2>/dev/null
```

Expected: no output (the page file itself lives at
`src/pages/family-photos-2026.astro`, which this grep doesn't match since
it only searches `.astro` files elsewhere — if it does print something,
that's an accidental link and must be removed).

- [ ] **Step 4: Visual check**

```bash
npm run dev
```

Open `http://localhost:3120/family-photos-2026/`. Confirm the grid renders
with all photo thumbnails, clicking one opens the full-size lightbox, and
clicking the lightbox closes it. Check both light and dark system theme
(macOS System Settings > Appearance, or Chrome DevTools rendering emulation)
since this page has no in-page toggle.

- [ ] **Step 5: Commit**

```bash
git add src/pages/family-photos-2026.astro
git commit -m "feat: add unlinked personal photo gallery page"
```

---

### Task 5: Exclude the gallery page from the sitemap

**Files:**
- Modify: `astro.config.mjs` — the `sitemap({ filter: ... })` callback.

**Interfaces:** none (build-config only).

- [ ] **Step 1: Add the exclusion**

In `astro.config.mjs`, inside the `filter` function, before the existing
`const segment = ...` line, add:

```js
        if (pathname.startsWith('/family-photos-2026')) return false;
```

So the function reads:

```js
      filter: (page) => {
        const pathname = new URL(page).pathname;

        if (pathname.startsWith('/404')) return false;
        if (pathname.startsWith('/family-photos-2026')) return false;

        const segment = pathname.split('/')[1];
        const locale = LOCALE_KEYS.includes(segment) ? segment : 'en';

        return locales[locale]?.reviewed === true;
      },
```

- [ ] **Step 2: Build with indexing on and verify the sitemap**

```bash
ALLOW_INDEXING=true npm run build
grep -c "family-photos-2026" dist/sitemap-0.xml || true
```

Expected: `0` (grep with `-c` prints `0` and exits 1 when there are no
matches; the `|| true` keeps the command from failing the shell here — this
is a manual check, not a script that needs to survive a non-match).

- [ ] **Step 3: Run `verify-build.mjs` directly**

```bash
node scripts/verify-build.mjs
```

Expected: `[verify-build] OK — <N> pages, ...`. This is the check that would
have caught a `noindex` page wrongly left in the sitemap, or an indexable
page wrongly left out of it — both directions are exercised here (the
gallery page is noindex + absent from the sitemap, which is the only
combination `verify-build.mjs` accepts for a noindex page).

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "fix: exclude the personal gallery page from the sitemap"
```

---

### Task 6: Retire the source photo dump from the repo root

**Files:**
- Modify: `.gitignore` — add `_Sheng Chang Photos/`
- Delete: nothing yet tracked (the folder was never committed — confirm with
  `git status` before this task; if `git status` shows it as untracked, this
  task is just the `.gitignore` line, no `git rm` needed)

**Interfaces:** none.

- [ ] **Step 1: Confirm the folder was never committed**

```bash
git log --all --oneline -- "_Sheng Chang Photos"
```

Expected: no output (nothing to date has committed it). If this prints
commits, stop and re-plan this task — it means the full unsorted dump,
including the 3 blocked archive photos, is already in git history, which
`git rm` alone will not fix (history rewrite would be needed, and that is a
destructive operation requiring explicit user sign-off, not something to do
as part of this task).

- [ ] **Step 2: Add the gitignore entry**

In `.gitignore`, add a line:

```
_Sheng Chang Photos/
```

(matching the existing `src-photos/` entry's comment style if one exists —
check the file for precedent first.)

- [ ] **Step 3: Confirm it's now ignored**

```bash
git status --short | grep "Sheng Chang Photos" || echo "not tracked — good"
```

Expected: `not tracked — good`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore the source photo dump now that assets are derived"
```

---

### Task 7: Final full-suite verification and PR

**Files:** none (verification only).

- [ ] **Step 1: Full clean verification**

```bash
npx tsc --noEmit
npm test
ALLOW_INDEXING=true npm run build
```

Expected: typecheck clean, all tests pass (202 existing + none new — this
feature added no new test files, only new content covered by existing
generic i18n/source-integrity/asset tests), build succeeds including
`postbuild`'s `verify-css.mjs` and `verify-build.mjs`.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin add-photo-gallery-and-recognition
gh pr create --title "feat: add community recognition photos and personal gallery" --body "$(cat <<'EOF'
## Summary
- Adds 8 curated certificate/civic photos to the About page's existing
  "Community & Public Service" section, in all 3 locales
- Adds an unlinked, noindex, sitemap-excluded personal photo gallery at
  /family-photos-2026/ for the remaining ~92 personal photos
- Permanently excludes the 3 Arcadia Public Library archive photos from both
  (no reproduction permission — see the linked spec)

Spec: docs/superpowers/specs/2026-08-25-photo-gallery-and-recognition-design.md
Plan: docs/superpowers/plans/2026-08-25-photo-gallery-and-recognition.md

## Test plan
- [ ] Confirm the 8 About-page photos and their captions are what you expect, in all 3 locales
- [ ] Confirm /family-photos-2026/ is reachable and none of the 3 blocked photos appear in it
- [ ] Confirm no nav/footer link reaches /family-photos-2026/ from anywhere on the live site

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Report the PR URL back to the user**
