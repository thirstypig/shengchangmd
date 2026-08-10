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
| treatment item, service item | 項目 | 项目 | — see note below |
| printer | 印表機 | 印表机 | ~~打印机~~ |
| database | 資料庫 | 资料库 | ~~数据库~~ |
| data | 資料 | 资料 | ~~数据~~ |

**The `項目` exception, because two skills appear to disagree.** `項目` is the
mainland form for *project* (Taiwan: 專案) and for *programme of study* (Taiwan:
課程). It is **correct** for *treatment item* / *service item*, which is the only
sense this site uses: 診療項目, 篩檢項目, 服務項目. Verified 2026-08-10 against
`.tw` sources — it is the heading used by 衛生福利部苗栗醫院 and a formal term
throughout the Taiwan Medical Association's NHI payment-standard document. Do not
"fix" it, and do not add it to the register test's banned list; a context-blind
rule would fire ten times per locale on correct copy.

Medical and clinic terms, which matter more here than the tech ones:

This table used to have a *Note* column instead of *NOT (mainland)*, and the
doctor row read "Taiwan prefers 醫師 over 醫生 in formal use". That phrasing cost
two incidents: it reads as a preference rather than a rule, and it wrote 醫生
only in traditional, so anyone grepping the skill for the simplified form found
nothing. **31 instances of 医生 shipped to the Simplified pages.** The banned
forms are now spelled out in both scripts so they can be searched for.

| English | zh-hant | zh-hans | NOT (mainland) |
|---|---|---|---|
| doctor / physician | 醫師 | 医师 | ~~醫生~~ / ~~医生~~ |
| to contact | 聯絡 | 联络 | ~~聯繫~~ / ~~联系~~ |
| Mandarin (the language) | 國語 | 国语 | ~~普通話~~ / ~~普通话~~ |
| identity / status | 身分 | 身分 | ~~身份~~ |
| screening | 篩檢 | 筛检 | ~~篩查~~ / ~~筛查~~ |
| record (noun, e.g. 疫苗紀錄) | 紀錄 | 纪录 | ~~記錄~~ / ~~记录~~ |
| insurance benefit / coverage | 給付 | 给付 | |
| prior authorisation | 事前授權 | 事前授权 | ~~事先~~ |
| clinic | 診所 | 诊所 | |
| to see a doctor | 看診 | 看诊 | |
| appointment | 預約 | 预约 | |
| to register at reception | 掛號 | 挂号 | |
| office hours / clinic hours | 門診時間 | 门诊时间 | |
| family medicine | 家庭醫學科 | 家庭医学科 | |
| health insurance | 保險 | 保险 | ~~健保~~ — that means Taiwan's NHI |
| medical record | 病歷 | 病历 | |
| referral | 轉診 | 转诊 | |

Every banned form above **actually shipped on this site**, except the last two,
which are in the skill's original list. `紀錄` is the noun and `記錄` the verb, so
`疫苗紀錄` takes 紀錄.

**Never write 健保.** It is Taiwan's National Health Insurance. A patient in San
Gabriel reading 健保 would think this practice takes a programme that does not
operate in California.

Punctuation: use full-width Chinese punctuation — `，。、（）：` — not ASCII.

## Calque traps — and why no table can catch these

The words below are all correctly spelled, correct Taiwan register, and were all
**wrong**. The defect is not in the word; it is in the relation between the word
and the English sentence it renders. Every one of these shipped here.

| English written as | Renders as | Actually means | Use |
|---|---|---|---|
| care → 護理 | family medicine **nursing** | nursing, specifically | 照護 |
| partner → 合作夥伴 | a commercial partnership | business partner | rephrase |
| compassionate → 富有同情心 | full of **pity** | pity, faintly condescending | 用心 / 細心 / 親切 |
| via phone → 通過電話 | by **passing** a phone | 通過 = to pass (a test, a law) | 來電 / 透過 |
| surprise → 意外 | so nothing **bad happens** | accident | 預期之外的支出 |
| recorded as → 獲譽為 | was **acclaimed** as | acclaimed, a stronger claim | 經記載為 |

**`通過` is why this cannot be swept.** `通過…認證` — "passed certification" — is
**correct** and appears on the same page. A blanket ban would break it. These
must be found by reading, one at a time.

The register test catches a calque only when it appears in one locale and not
the other. When both locales carry the same calque, parity is satisfied and the
test is silent. **Parity catches divergence, never shared wrongness.**

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

**That sweep matches `/^[\x20-\x7E]+$/` — ASCII only — so it is structurally
incapable of seeing wrong-variety Chinese.** It finds English that leaked onto a
Chinese page. It cannot tell 医生 from 医师, because both are CJK. Do not read a
clean run of it as "the Chinese is fine".

**What does check register: `tests/i18n/taiwan-register.test.ts`**, via `npm
test`. It asserts two things — a banned-word table, and **cross-locale parity**:
for each concept, the Taiwan form's count in `zh-hant` must equal its simplified
twin's count in `zh-hans`. Parity needs no vocabulary knowledge, so it catches
words nobody listed, which is exactly how the last three incidents got through.
When it fails, **find the sentence that differs — never pad the count.**

Neither the sweep nor the test tells you the Chinese is *good*. They tell you it
is consistent and free of known-mainland forms. Fluency is still a reader's job.

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
| "Google Translate gave me this" | It defaults to mainland vocabulary. Check the tables above before accepting 信息, 网络, 软件, 视频, 医生, 联系, 普通话. |
| "I checked it against the red-flag list and it was clean" | So did the two sweeps that shipped 31 `医生` and then seven more concepts. The list contains only what someone thought of. Run `npm test`. |
| "It's the same word, just simplified" | Check the count in the other locale. If `zh-hant` says it 8 times and `zh-hans` says it 3, they are not the same copy. |

## Red flags — stop

- A diff touching `src/pages/*.astro` with no `zh-hant`/`zh-hans` counterpart
- A new key in `translations.en` with no sibling in the other two locales
- 信息, 网络, 软件, 视频, 移动, 质量, 数据 anywhere in `zh-hans`
- 医生, 联系, 普通话, 身份, 筛查, 记录 anywhere in `zh-hans` — and their
  traditional forms 醫生, 聯繫, 普通話, 篩查, 記錄 in `zh-hant`
- 健保 anywhere
- ASCII `,` `(` `)` `:` inside a Chinese sentence
- `{practice.something}` inside a `zh-hant`/`zh-hans` page
- **Chinese anywhere in `src/components/` or `src/layouts/`.** Three components
  hold their own translations parallel to `locales.ts` — `HeroSection.astro`,
  `StickyCallBar.astro` and `Header.astro` — and that is where 医生 survived a
  sweep of the pages. `Header` uses ternaries rather than an object map, so it
  was missed twice. Search for the *shape*, Chinese outside the translation
  layer, never for the syntax.

**And the most important one: do not verify against this list.** It is a
starting point, not a test. Two sweeps in a row verified against it, reported
clean, and were wrong — the first shipped with 31 `医生`, the second with seven
further concepts. **A checklist only ever contains what someone already thought
of.** Use `npm test` (see Verify below), which counts rather than enumerates.
