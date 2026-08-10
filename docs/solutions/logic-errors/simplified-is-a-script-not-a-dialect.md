---
title: 'Simplified is a script, not a dialect — a locale that kept the characters and lost the register'
date: 2026-08-09
category: logic-errors
problem_type: locale_variety_drift
component: src/i18n/locales.ts / src/pages/zh-hans/ / HeroSection.astro / StickyCallBar.astro / Header.astro
severity: high
symptoms:
  - 'the same profession is named 醫師 on every traditional page and 医生 on every simplified one'
  - 'a nav label and the heading of the page it links to use different words for the same thing'
  - 'a Chinese page is fluent, idiomatic and character-correct, and addresses the reader in the wrong region''s register'
  - 'a competence claim appears in both Chinese locales and in no English source string'
  - 'an English word is rendered by its dictionary gloss, so "care" becomes nursing and "surprise" becomes accident'
  - 'a shared component carries its own locale map, so every i18n guard reads a different file than the one that drifted'
  - 'a vocabulary sweep reports "clean" against a checklist while the same defect class remains live in seven other words'
  - 'typecheck, 74 vitest tests, verify-css and verify-build all pass with every instance live'
stack:
  - Astro 5
  - TypeScript
  - vitest
  - trilingual i18n (en, zh-hant, zh-hans)
  - GitHub Pages
time_to_diagnose: 'invisible to every automated check and to visual QA; each instance obvious in seconds once the two Chinese locales are counted side by side, which nothing in the workflow asked anyone to do'
recurrence_risk: 'high — no test in the repo distinguishes Taiwan wording from mainland wording, and three shared components still hold translations outside the i18n layer'
tags:
  - i18n
  - localization
  - taiwan-mandarin
  - locale-variety-drift
  - parallel-locale-map
  - content-integrity
  - fabricated-claim
  - silent-failure
  - verification-bias
---

# Simplified is a script, not a dialect

## The one-line version

`zh-hans` was treated as *Simplified Chinese*, so it drifted to **mainland**
wording, while `zh-hant` was treated as *Taiwanese* and stayed correct. Both
locales are supposed to be **Taiwan Mandarin** — one written in traditional
characters, one in simplified. For eleven days the site addressed the same
patient in two different regional registers depending on which link they clicked.

## What happened

The practice serves the San Gabriel Valley Taiwanese community. Dr. Chang trained
at National Taiwan University. Simplified script is offered for readers who find
those characters easier — **not** because they are from the mainland.

At the commit before the fix:

| scope | 醫師 | 醫生 | 医师 | 医生 |
|---|---|---|---|---|
| `src/pages/zh-hant/` | 40 | 0 | — | — |
| `src/pages/zh-hans/` | — | — | 9 | **31** |
| all of `src/` | 43 | 0 | 10 | 32 |

`醫師` is Taiwan's formal medical register; `医生` is the mainland default. The
Traditional pages used `醫師` exclusively. The Simplified pages used `医生`
overwhelmingly. **No script-conversion table produces that** — every table maps
`醫師 → 医师`. They are different lexemes, not different encodings of one lexeme.

The same shape appeared in `聯絡` vs `联系`, where the Simplified **nav label**
already said `联络` while the contact page heading said `联系` — the site
disagreeing with itself on one click.

## Root cause: a variety-modelling error, and the history says so out loud

Tracing the counts across every commit that touched either locale directory:

```
441f55e 07-28  hant 醫師=0  醫生=3  | hans 医师=0  医生=3    initial scaffold
f194410 07-29  hant 醫師=8  醫生=27 | hans 医师=8  医生=27   (still tracking each other)
961f7de 07-29  hant 醫師=36 醫生=0  | hans 医师=0  医生=36   "fix ~40 Chinese translation issues"
0ceaf6b 08-07  hant 醫師=40 醫生=0  | hans 医师=9  医生=31
37c4bab 08-09  hant 醫師=40 醫生=0  | hans 医师=40 医生=0    the fix
```

Three things follow:

1. **Both locales started wrong together** (3 and 3 at the scaffold; 8/27 and
   8/27 by `f194410`). This was never `zh-hans` drifting away from a correct
   `zh-hant`. It was a shared mainland-default starting point.
2. **One commit split them, deliberately.** `961f7de` took `zh-hant` 8→36 `醫師`
   and `zh-hans` 8→**0** `医师` in the same diff. Its own message states the
   intent verbatim: *"醫師 throughout zh-hant … **医生 throughout zh-hans**"*, and
   on the next concept, *"Simplified Chinese used the Taiwan term 国语 where
   mainland standard is 普通话."* It actively **downgraded** the eight correct
   instances already present.
3. **The rule did not exist yet.** `.claude/skills/trilingual-content/SKILL.md`
   was written on 2026-08-07 — nine days *after* that commit encoded the wrong
   model.

So the cause is not sloppiness. A consolidation pass applied the near-universal
default association — *Traditional = Taiwan, Simplified = mainland* — and then
enforced it **consistently**, which is exactly why the result was clean,
self-consistent and entirely wrong. It did the job its own commit message named.
It just had the wrong target variety for one of two locales.

The skill now lists that assumption by name as a rationalization to reject:

> | "Simplified means mainland readers" | Simplified is a script, not a dialect. This audience is Taiwanese; use Taiwan wording in both scripts. |

## Why every guard missed it

`npm test` was **74/74 green** with all of it live. This is not a near-miss — no
assertion in the repo can see this class.

**`tests/i18n/locale-coverage.test.ts`**
- Never opens a `.astro` file. It imports `translations` / `practiceLocalized`;
  31 of 32 drifted instances were inline in `src/pages/zh-hans/*.astro`.
- Its cross-locale assertions are **structural** — key sets and emptiness. Both
  `医生` and `醫師` are non-empty strings under correctly paired keys.
- Its "not identical to English" check requires Latin letters to fire
  (`/[A-Za-z]{3,}/`). A wrong-variety Chinese string is that check's exact
  complement.
- Its "is this Chinese?" check is `/[一-鿿]/`. `医生` is Han. It passes. The test
  asks *is this Chinese*, never *is this Taiwan Chinese*.
- **The deepest reason: every assertion compares a locale against `en` or against
  a key set. Not one compares `zh-hant` against `zh-hans`** — and that is the
  axis the defect lives on.

**`tests/i18n/shared-component-labels.test.ts`** — three independent reasons, any
one sufficient: its scope is `components`/`layouts` and deliberately excludes the
locale-forked pages; its regex matches `aria-label`/`title`/`alt`/`data-label`
attributes, not object properties; and its prose filter is `/[A-Za-z]{2,}/`,
which drops Chinese. It hunts *English in shared components*; this is *Chinese of
the wrong variety* — again the complement.

**Everything else** — `source-integrity`, `robots-gate`, `theme-token-coverage`,
`verify-css`, `verify-build`, `tsc` — makes no assertion about Chinese wording.

## The verification bias, which is the transferable part

PR #27 (2026-08-07) fixed the `信息 → 资讯` instance of this exact root cause and
its commit message verified: *"no 信息, 网络, 软件, 视频, 移动, 质量, 数据 or
健保 anywhere in src/."* That is the skill's red-flag list, and it was true.

It shipped with **31 instances of `医生` still live**, because `医生` is not on
that list.

Then PR #30 fixed `医生` and `联系` and verified against the same list plus the
two words it had just fixed — and shipped with **seven more concepts still
drifted**, found only while writing this document:

| Still live after PR #30 | zh-hant said | zh-hans said |
|---|---|---|
| Mandarin, ×4 incl. `practiceLocalized.languages` | `國語` | `普通话` |
| identity/status, ×2 | `身分` | `身份` |
| screening, ×2 | `篩檢` | `筛查` |
| record (noun), ×3 | `紀錄` | `记录` |
| insurance coverage, ×5 | `保險給付` | `保险范围` |
| prior authorisation | `事前授權` | `事先授权` |
| to attend clinic | `看診` | `就诊` |

The `普通话` one rendered under the homepage heading `看诊语言` — it told a
Taiwanese patient which languages the office speaks, using Beijing's word for the
language.

**A checklist can only enumerate what someone already thought of.** CLAUDE.md
already says *"verify against the invariant, not against your diff"*; this is
that rule one level up, and it is the harder case, because **the checklist was
the diff**. Verifying against a wordlist inherits the wordlist's blind spots and
returns a confident green.

## The technique that actually works: cross-locale parity

The two Chinese locales are script conversions of the same copy. So for every
concept, **the Taiwan form's count in `zh-hant` must equal its simplified twin's
count in `zh-hans`.** Any inequality means one locale says something the other
does not — whatever the words are, and whether or not anyone has heard of them.

This flags the *shape* of the defect rather than an instance, and it is what
found all seven residual concepts above.

```bash
node -e '
const fs=require("fs");
const strip=s=>s.replace(/\{\/\*[\s\S]*?\*\/\}/g,"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*\/\/.*$/gm,"");
const corpus=l=>fs.readdirSync("src/pages/"+l).map(f=>strip(fs.readFileSync("src/pages/"+l+"/"+f,"utf8"))).join("\n");
const H=corpus("zh-hant"), S=corpus("zh-hans"), n=(h,x)=>h.split(x).length-1;
const pairs=[["醫師","医师"],["醫生","医生"],["聯絡","联络"],["聯繫","联系"],["資訊","资讯"],
  ["國語","国语"],["普通話","普通话"],["身分","身分"],["身份","身份"],["給付","给付"],
  ["看診","看诊"],["紀錄","纪录"],["記錄","记录"],["篩檢","筛检"],["篩查","筛查"],
  ["門診","门诊"],["預約","预约"],["診所","诊所"],["病歷","病历"],["事前","事前"]];
let bad=0;
for(const [a,b] of pairs){const x=n(H,a),y=n(S,b);if(x!==y){console.log("MISMATCH "+a+"="+x+" "+b+"="+y);bad++;}}
console.log(bad?bad+" out of parity":"all "+pairs.length+" concepts at parity");'
```

**Comment-stripping is load-bearing.** Every write-up here quotes the offending
word in a comment explaining it. Counting those would fail the check on the
documentation of its own fix.

## What a test cannot catch, and this matters

Three of the defects in this episode are permanently outside any assertion:

**1. Calques.** `護理` for "care" (it means *nursing*), `合作夥伴` for "partner"
(a *business* partner), `富有同情心` for "compassionate" (`同情心` is *pity*),
`意外` for "surprise" (it means *accident* — on a medical site), `獲譽為` for
"recorded as" (it means *acclaimed as*). Every one is correctly spelled,
correctly scripted, correct Taiwan register. The defect is in the relation
between the word and the English sentence it renders. `通過` is decisive:
`通過…認證` — "passed certification" — is **correct** elsewhere in the same file,
so even a blanket ban would be wrong. It was fixed by hand for exactly that
reason.

Parity helps only when the calque appears in one locale and not the other. When
both carry the same calque, parity is perfectly satisfied and silent. **Parity
catches divergence, never shared wrongness.**

**2. A claim that exists only in the Chinese copy.** Both Chinese insurance pages
asserted 「本診所工作人員熟悉保險事務」 — *the staff are knowledgeable about
insurance*. The English has never said that. Well-formed key, present in all
three locales, properly translated between the two Chinese ones, not identical to
English, semantically fluent. Every guard passes. This is the same wall as
[`publishing-a-fact-does-not-remove-its-contradiction.md`](publishing-a-fact-does-not-remove-its-contradiction.md),
and it is the more alarming half of this episode: **locale drift can invent
facts, not merely mistranslate them.** It is the same class as the fabricated
carrier list, on the same page, reaching only the readers least able to
cross-check it against the English.

**3. Whether the Chinese is any good.** None of this is fluency. `reviewed:
false` on both Chinese locales remains the actual safety mechanism. A green suite
makes that easier to forget.

## The structural hazard — RESOLVED 2026-08-10

> **Update.** Everything in this section describes the state before the fix. All
> eight strings moved into `locales.ts` on 2026-08-10. The rendered output was
> byte-identical across all 22 pages, the suite went **101 → 104 tests with no
> test written** — `source-integrity` derives its locale-consumed check from the
> nested blocks of `translations.en`, so the three new blocks each picked up a
> guard automatically — and reintroducing either defect now fails: the
> `HeroSection` one on *two* assertions (banned vocabulary and cross-locale
> parity), the `Header` one on banned vocabulary. Both were previously invisible
> to the entire suite, which was demonstrated first by putting a mainland word
> in `Header` and watching 101 tests and the build pass.
>
> The section is kept as written because the reasoning is the useful part.


Three shared components carry their **own** translations, parallel to
`locales.ts`:

| Component | Form | Renders on |
|---|---|---|
| `HeroSection.astro` | object map | home + about, all locales |
| `StickyCallBar.astro` | object map | every page |
| `Header.astro` | **ternaries** | every page, every locale |

`HeroSection` is where `医生` survived the sweep, because the sweep read the
pages and `locales.ts`. Neither i18n guard can see any of them:
`locale-coverage` imports `translations`, and `shared-component-labels` matches
literal attributes, not string maps.

**`Header.astro` was itself missed twice** — by PR #30 and by the comment PR #30
left behind, which named `LanguageSwitcher.astro` instead (wrongly: its only CJK
is in a comment). Header does the same thing with a ternary rather than an object
literal, so a rule shaped like `'zh-han[ts]':` does not match it. **Search for
the shape — Chinese prose living outside the translation layer — not for the
syntax.** A syntax-shaped rule loses to the next author's choice of syntax; a
Han-character rule cannot, because there is no way to write Chinese without
writing Chinese.

**Recommended fix: move all three into `locales.ts`, and land a guard in the same
PR.** Not one or the other. A guard alone would need an exemption entry for all
three offenders on day one, and an exemption map seeded with the exact defect it
exists to prevent is how a hazard becomes permanent — `shared-component-labels`
ships with an empty exempt list precisely because the six bad labels were fixed
first.

The payoff is verified, not assumed: moving `HeroSection`'s `boardCertified` into
`locales.ts` with the `医生` drift intact makes the parity check catch it
immediately. That is what "the existing guards cover them for free" means.

## Related

- [`shared-data-module-locale-strings.md`](shared-data-module-locale-strings.md)
  — **the closest sibling, and it predicted this.** On 2026-07-30 it recorded
  *"醫師 vs 醫生 mixed 27/7 within one locale"* as a subordinate bullet, and
  stated that the Latin-script guard *"cannot check translation quality at all. A
  fluent, grammatical, completely-wrong Chinese sentence contains zero Latin
  characters and passes silently."* It was observed, written down, **given no
  owner and no guard**, and was still live ten days later at 31 instances. That
  doc is *right fact, wrong language*; this one is *right language, wrong
  register* — strictly harder, because back-translation defeats it: `医生` and
  `医师` both back-translate to "doctor".
- [`green-checks-that-cannot-see-the-defect.md`](green-checks-that-cannot-see-the-defect.md)
  — the three components are a further instance of its *scope-narrow* shape.
- [`duplicated-facts-and-partial-fix-propagation.md`](duplicated-facts-and-partial-fix-propagation.md)
  — the parallel locale maps are copy number two of the *mechanism*, not merely
  of a fact; and PR #27 fixing `信息` while leaving `医生` is textbook partial
  propagation.
- [`publishing-a-fact-does-not-remove-its-contradiction.md`](publishing-a-fact-does-not-remove-its-contradiction.md)
  — the same "no invariant exists to assert" property, for the fabricated
  competence claim.
- [`../ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md`](../ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md)
  — structurally analogous, not topically: a hand-maintained map anything can
  bypass, found in three passes, closed by a test that **derives** its domain
  rather than enumerating it. That is the argument for parity over a wordlist.

## Gaps this leaves in the skill

`.claude/skills/trilingual-content/SKILL.md` needs, in priority order:

1. `医生` and `联系` added to **Red flags** — that is the list people actually
   grep, and it is what PR #27 verified against.
2. A **NOT (mainland)** column on the medical table, matching the tech table. It
   currently has a *Note* column, so `医生` never appears as a bannable token —
   and it is written only as `醫生`, so a grep derived from the skill for the
   simplified form finds nothing.
3. New rows: contact `聯絡/联络` NOT `聯繫/联系`; Mandarin `國語/国语` NOT
   `普通話/普通话`; status `身分` NOT `身份`; screening `篩檢/筛检` NOT `筛查`;
   record `紀錄/纪录` NOT `记录`.
4. A **calque-trap section** — `護理`, `合作夥伴`, `同情心`, `通過`, `意外`,
   `獲譽為` — explicitly marked *not sweepable*, with `通過…認證` as the worked
   counter-example.
5. A red flag for a shared component containing Chinese at all.
6. A correction to the Verify section, whose sweep is `/^[\x20-\x7E]+$/` —
   ASCII-only, and therefore structurally incapable of seeing register drift.

The strongest version, following the `theme-token-coverage` precedent: a test
that **derives** its banned list from the skill's own tables, so the table and
the guard cannot diverge.

## Corrections to the record

Both were found while writing this, and both are mine:

- **The counts published in `37c4bab` and PR #30 are wrong.** They say `醫師` 42;
  the real figure is 40 in the pages scope or 43 across `src/`, never 42 — and
  the same sentence quotes `医生` 31 (pages) beside `医师` 10 (`src/`), mixing
  scopes between two clauses. The fix was correct; the arithmetic reported
  alongside it was not. "40/40 after" was right.
- **The comment PR #30 left in `HeroSection.astro` named the wrong file.** It
  cited `LanguageSwitcher.astro`; the actual third offender is `Header.astro`.
  Corrected in place.
