# shengchangmd

Static website for a family medicine practice in San Gabriel, California.

**Live at [shengchangmd.com](https://shengchangmd.com)** — built with Astro 5,
deployed to GitHub Pages on every push to `main`.

The site is trilingual: English, Traditional Chinese (`zh-hant`) and Simplified
Chinese (`zh-hans`). **Both Chinese locales are currently `noindex`**, pending
review by a fluent reader — see `reviewed` in `src/i18n/locales.ts`, which
controls both the robots meta tag and sitemap membership so a page can never be
listed and de-indexed at the same time.

## Setup

```bash
npm install
npm run dev                          # http://localhost:3120
npm test                             # 70 tests
ALLOW_INDEXING=true npm run build    # 22 pages
```

**`npm run build` on its own fails locally, and that is expected.**
`ALLOW_INDEXING` is set only in `.github/workflows/deploy.yml`. Without it every
reviewed page builds `noindex` while the sitemap still lists it, and
`scripts/verify-build.mjs` correctly refuses a build whose sitemap and robots
meta contradict each other. It reports all ten English pages, which reads like a
real regression and is not. Pass the variable to reproduce what CI does.

## Where things live

| What | Where |
|---|---|
| Practice facts — hours, address, phone, credentials | `src/data/practice.ts` |
| Localized copy and Chinese translations | `src/i18n/locales.ts` |
| Pages | `src/pages/`, with `zh-hant/` and `zh-hans/` alongside |
| Design tokens and the theme colour map | `tailwind.config.ts`, `src/styles/global.css` |
| Tests | `tests/` |

`src/data/practice.ts` is the single source of truth for every practice fact.
The one-line address is derived from `addressParts` so the prose address and the
JSON-LD `PostalAddress` cannot drift apart, and a test fails the build if the
street address or phone number appears anywhere else in `src/`.

## Checks

CI runs `npx tsc --noEmit`, then `npm test`, then the build. `postbuild` runs
two scripts that assert against the built output rather than the source:

- `scripts/verify-css.mjs` — fails if the compiled CSS lacks real Tailwind
  output. This exists because the site once rendered with **zero compiled CSS**
  while a report claimed "52/52 audits passed".
- `scripts/verify-build.mjs` — checks that referenced assets exist, that the
  sitemap and robots meta agree, that JSON-LD's address matches `practice.ts`,
  and that no page references the retired host.

The test suite is deliberately narrow. Every test guards a regression that has
actually happened in this repo, and every one was verified by making it fail
before it was trusted.

## Before you change anything

Read **[`CLAUDE.md`](CLAUDE.md)**. It is the working agreement for this repo and
it is not boilerplate — it records specific failures that shipped here and the
rules that exist because of them. The three that catch people out:

- **`--brand` inverts between light and dark themes.** Never hardcode a colour
  or a Tailwind palette class on a branded surface, and check `hover:`/`focus:`
  variants too — they are emitted at higher specificity.
- **Never invent factual content.** Not credentials, insurance carriers, hours,
  addresses, map coordinates or URLs. This is a real medical practice; wrong
  information on it has real consequences. Unknown facts get a marked
  placeholder.
- **An English copy change is not finished until it reaches both Chinese
  locales**, in Taiwan Mandarin. See
  [`.claude/skills/trilingual-content/SKILL.md`](.claude/skills/trilingual-content/SKILL.md).

Longer write-ups of past failures live in `docs/solutions/`, and operational
history in `docs/runbooks/`.
