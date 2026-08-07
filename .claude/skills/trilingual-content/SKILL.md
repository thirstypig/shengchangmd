---
name: trilingual-content
description: Use when changing any user-facing English text on this site — page copy, headings, button labels, aria-labels, alt text, meta descriptions, or a string in locales.ts. Also use when reviewing whether a change reached all three locales.
---

# Trilingual content

This site ships in three locales: `en`, `zh-hant` (Traditional) and `zh-hans`
(Simplified). **An English change that does not reach both Chinese locales is an
incomplete change, not a finished one.**

Two rules, and the second is the one people get wrong:

1. Every user-facing English string change lands in `zh-hant` and `zh-hans` in
   the same commit.
2. **Both Chinese locales use Taiwan Mandarin** — vocabulary and usage, not just
   characters. Simplified here means Taiwan wording written in simplified
   script, **not** mainland wording.

## Why Taiwan Mandarin, in both scripts

The practice serves the San Gabriel Valley Chinese community, and its own About
page records that the Arcadia Chinese Association was founded to help immigrants
"most of them from Taiwan." Dr. Chang trained at National Taiwan University. The
readership is Taiwanese.

Simplified script is offered for readers who find those characters easier — not
because they are from the mainland. Writing 信息 or 软件 on the Simplified page
would sound foreign to the intended reader while gaining nothing.

## Do not skip the translation because you are not fluent

This is the failure this skill exists to stop, and it arrives dressed as
caution. A baseline test produced exactly this:

> "I left them alone rather than guess at a Chinese translation myself... the
> wording should come from you or a fluent reviewer rather than me inventing the
> phrasing."

It sounds responsible. It is not, and here is why:

- **The safety gate already exists and is not you.** Both Chinese locales are
  `reviewed: false` in `locales.ts`, which renders every Chinese page `noindex`
  and keeps it out of the sitemap. That gate is what makes an unreviewed
  translation safe to ship. Declining to translate does not add safety; it
  removes content.
- **An English-only change makes the Chinese page actively wrong, not merely
  incomplete.** If English gains "we do not accept walk-ins" and Chinese does
  not, a Chinese reader is not missing a sentence — they are being told, by
  omission, that they may walk in. Silence is a claim.
- **Skipping it is invisible.** A missing English string is obvious. A missing
  Chinese string looks exactly like a finished page. Six English accessibility
  labels sat on all 12 Chinese pages for months for this reason.

**Translate it. Flag it for review. Do not leave it out.** If a term genuinely
has no settled Chinese form, translate the sentence and leave a
`{/* 用語待確認: … */}` comment naming the term — do not leave the whole change
out.

**The one real exception:** proper nouns with no established Chinese name. See
"What stays in English" below. Guessing at characters for an organisation's name
invents a fact, which is a different failure and a worse one.

## Taiwan vs mainland vocabulary

The Simplified column is Taiwan vocabulary in simplified characters. It is not
the mainland word.

| English | zh-hant (Taiwan) | zh-hans (Taiwan wording, simplified) | NOT (mainland) |
|---|---|---|---|
| information | 資訊 | 资讯 | ~~信息~~ |
| network / internet | 網路 | 网路 | ~~网络~~ |
| software | 軟體 | 软体 | ~~软件~~ |
| video | 影片 | 影片 | ~~视频~~ |
| mobile | 行動 | 行动 | ~~移动~~ |
| quality | 品質 | 品质 | ~~质量~~ |
| programme / project | 專案 | 专案 | ~~项目~~ |
| printer | 印表機 | 印表机 | ~~打印机~~ |
| database | 資料庫 | 资料库 | ~~数据库~~ |
| data | 資料 | 资料 | ~~数据~~ |

Medical and clinic terms, which matter more here than the tech ones:

| English | zh-hant | zh-hans | Note |
|---|---|---|---|
| doctor / physician | 醫師 | 医师 | Taiwan prefers 醫師 over 醫生 in formal use |
| clinic | 診所 | 诊所 | |
| to see a doctor | 看診 | 看诊 | |
| appointment | 預約 | 预约 | |
| to register at reception | 掛號 | 挂号 | |
| office hours / clinic hours | 門診時間 | 门诊时间 | |
| family medicine | 家庭醫學科 | 家庭医学科 | |
| health insurance | 保險 | 保险 | Do **not** write 健保 — that means Taiwan's NHI |
| medical record | 病歷 | 病历 | |
| referral | 轉診 | 转诊 | |

**Never write 健保.** It is Taiwan's National Health Insurance. A patient in San
Gabriel reading 健保 would think this practice takes a programme that does not
operate in California.

Punctuation: use full-width Chinese punctuation — `，。、（）：` — not ASCII.

## Where the strings live

| Kind | File | How |
|---|---|---|
| UI strings, nav, footer | `src/i18n/locales.ts` → `translations` | Add the key to **all three** locales |
| Chinese forms of `practice.ts` values | `src/i18n/locales.ts` → `practiceLocalized` | Board names, specialties, statuses, languages, school |
| Page copy | `src/pages/zh-hant/*.astro`, `src/pages/zh-hans/*.astro` | Mirror the English page's structure |

**Never interpolate `practice.*` directly into a Chinese page or a shared
component.** Those fields are English strings. Route through
`getPracticeLocalized()` or `getTranslation()`. This shipped once via the shared
footer and hit every Chinese page.

**A new `practiceLocalized` entry needs a counterpart in both Chinese locales.**
`getPracticeLocalized` falls back to English on a missing key, so a gap does not
throw — it prints an English board name mid-Chinese-sentence.

## What stays in English

Translate the sentence around them, not these:

- **Organisations and institutions with no supplied Chinese name.** Garfield
  Medical Center, Arcadia Chinese Association. They have Chinese names in local
  usage, but none were supplied by the owner, and choosing characters invents a
  name. `src/pages/zh-hant/about.astro` documents this.
- **USCIS form numbers** — I-693, N-648. A patient writes the same string on the
  form.
- **`practice.doctorName`** in the portrait caption, shown beside the Chinese
  headline. Showing both is the point.
- **The language switcher's own labels** — "English" labels the English link.

`education.school` **is** translated: 國立臺灣大學醫學院 is the institution's own
name, not a translation of the English one. The test is not "is it a proper
noun" but "does this entity have a real name in the target language that readers
would expect."

## Verify

`npm test` catches structural gaps — a key missing from a locale, a Chinese
value left byte-identical to English, a `practiceLocalized` entry with no
counterpart. It cannot tell you the Chinese is good.

Tests and typecheck are not enough on their own. Check the built output:

```bash
ALLOW_INDEXING=true npm run build
grep -c '<your new Chinese string>' dist/zh-hant/<page>/index.html
```

Then sweep for English that leaked into a Chinese page:

```bash
node -e '
const fs=require("fs"),path=require("path");
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):(e.name.endsWith(".html")?[path.join(d,e.name)]:[]));
const seen=new Set();
for (const f of walk("dist/zh-hant").concat(walk("dist/zh-hans")))
  for (const m of fs.readFileSync(f,"utf8").matchAll(/\b(aria-label|title|alt|placeholder|data-label)="([^"]+)"/g))
    if (/^[\x20-\x7E]+$/.test(m[2]) && /[A-Za-z]{3}/.test(m[2])) seen.add(m[1]+"="+m[2]);
[...seen].forEach(s=>console.log(s));'
```

Only `title=English` and `aria-label=English` should appear.

**Do not flip `reviewed: true`** for either Chinese locale. That is a fluent
reader's call, and it is what currently keeps unreviewed Chinese out of search.

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'm not fluent, a native speaker should write it" | The `reviewed: false` gate is the safety mechanism, not your abstention. Translate and flag it. |
| "They asked for 'the services page', singular" | This site has three services pages. A copy request means the content, in every locale that carries it. |
| "The Chinese pages are noindex anyway" | They are still served, still linked, and still read by patients who pick 繁體中文. Noindex is not unpublished. |
| "It's just an aria-label / alt text" | That is the text a screen-reader user hears. Six of them sat in English on every Chinese page for months. |
| "I'll do the Chinese in a follow-up" | Nothing tracks it, and a missing Chinese string looks like a finished page. Same commit. |
| "Simplified means mainland readers" | Simplified is a script, not a dialect. This audience is Taiwanese; use Taiwan wording in both scripts. |
| "Google Translate gave me this" | It defaults to mainland vocabulary. Check the tables above before accepting 信息, 网络, 软件, 视频. |

## Red flags — stop

- A diff touching `src/pages/*.astro` with no `zh-hant`/`zh-hans` counterpart
- A new key in `translations.en` with no sibling in the other two locales
- 信息, 网络, 软件, 视频, 移动, 质量, 数据 anywhere in `zh-hans`
- 健保 anywhere
- ASCII `,` `(` `)` `:` inside a Chinese sentence
- `{practice.something}` inside a `zh-hant`/`zh-hans` page
