# shengchangmd — working agreement

Astro 5 static site for Sheng Chang, M.D., a family medicine practice in
San Gabriel, CA. Trilingual: English, Traditional Chinese, Simplified Chinese.

## Reporting: be brutally honest

This is a real medical practice site. Wrong information on it has real
consequences for real patients. Therefore:

- **Never restate a subagent's or a tool's success claim as fact.** Verify it
  directly — load the page, read the built CSS, run the command — or label the
  claim as unverified.
- **Lead with what is broken, missing, or fabricated**, before what works.
- **No "production ready", "complete", or benchmark scores without evidence**
  you produced yourself in that session.
- **Name your own mistakes plainly.** No hedging, no burying them at the end.
- **Never invent factual content.** Not names, credentials, board
  certifications, insurance carriers, patient reviews, hours, addresses, map
  coordinates, or URLs. If a fact is unknown, leave a clearly-marked
  placeholder and say so.

This exists because an earlier session reported "Lighthouse 100/100/100/100",
"52/52 audits passed" and "17/17 tasks complete, production ready" for a site
that was rendering with **zero compiled CSS** — Tailwind had never been wired
into Astro. The same session shipped a fabricated Google Maps embed URL, an
invented insurance carrier list, and an invented Chinese name for the doctor.

## Facts that must come from source, never memory

- Hours, address, phone → `src/data/practice.ts` (single source of truth)
- Localized copy → `src/i18n/locales.ts`
- Board certifications, licence numbers, education → `src/data/practice.ts`
- Map URLs → derive from `practice.address`, never hardcode coordinates or
  Google place IDs

## Known open items requiring the owner's confirmation

- **Doctor's Chinese name.** The Chinese pages use 张胜雄 / 張勝雄. This was
  generated, not supplied. Unconfirmed.
- **Insurance carriers.** The list on `insurance.astro` was generated, not
  supplied. Unconfirmed.
- **Immigration medical exams.** Offered as a service, but USCIS Form I-693
  exams may only be performed by a designated civil surgeon. Do not claim
  civil-surgeon designation anywhere without written confirmation.
- **Doctor's portrait** is 150×150 native (upscaled). Needs a real headshot.

## Setup

```
npm install
npm run dev      # http://localhost:3120
npm run build
```

Tailwind v4 is wired via `@tailwindcss/vite` in `astro.config.mjs`, with global
styles and the theme in `src/styles/global.css`. Design tokens live in
`tailwind.config.ts`, loaded by the `@config` directive. Utility classes will
silently do nothing if that plugin is ever removed — verify visually after
touching the build config.
