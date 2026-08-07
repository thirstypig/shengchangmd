---
title: 'Shared data module stored facts as English strings, leaking English into Chinese pages'
date: 2026-07-30
category: logic-errors
problem_type: missing_localization_layer
component: i18n / src/data/practice.ts / Chinese page rendering
severity: high
symptoms:
  - 'English phrases appear mid-sentence in Chinese body copy'
  - 'licence status, spoken languages and certification badges render in English on zh pages'
  - 'build passes and pages look visually correct but say the wrong thing'
  - 'institution name in English despite having an established name in the target language'
  - 'same English fragment appears on every localised page via a shared layout'
stack:
  - Astro 5
  - TypeScript
  - static site generation
  - trilingual i18n (en, zh-hant, zh-hans)
time_to_diagnose: 'invisible to build and to visual QA; found only by a reader of the target language'
recurrence_risk: 'medium — a new field added to practice.ts renders in English again unless the locale map is updated alongside it'
tags:
  - i18n
  - localization
  - astro
  - single-source-of-truth
  - locale-neutral-data
  - silent-failure
  - content-qa
  - verification-bias
---

# Shared data module stored facts as English strings

> **Category note.** Filed under `logic-errors`: the code ran correctly, compiled
> cleanly, and rendered without exception. The defect is a data-modelling
> mistake about locale-neutrality. `ui-bugs` was the runner-up — the wrong text
> was visible on screen — but the visible text was a symptom, not the cause.

## Symptom

Chinese pages rendered sentences that switched into English mid-clause. Real
examples, shipped:

| Context | Rendered |
|---|---|
| Under the heading 加州醫療執照 | `License Renewed & Current` |
| In the 語言 (Languages) card | `English`, `Mandarin` |
| Board-certification status badge | `Certified` |
| Mid-Chinese-sentence | `Three years of postgraduate training 在 … 接受家庭醫學與內科培訓` |
| Medical school | `National Taiwan University College of Medicine` |

That last one is the sharpest: the institution is Taiwanese and has its own
Chinese name, 國立臺灣大學醫學院. Showing the English form on a Chinese page
signals the page was never really localised.

**One instance was in the shared `BaseLayout` footer**, so it appeared on *every*
Chinese page, not just the About page where it was first spotted.

## Why it evaded detection

Four filters failed simultaneously:

- **The build passed.** These are valid interpolations of valid `string` values
  into valid templates. No type checker can know that a `string` field is
  semantically required to be locale-appropriate.
- **The pages looked correct.** Layout, spacing, cards, headings all rendered as
  designed. A screenshot diff would show no regression whatsoever.
- **The data was factually correct.** `License Renewed & Current` is true.
  `Certified` is true. This is not a data-integrity bug — it is a
  *presentation-language* bug: right fact, wrong language.
- **It needed a reviewer who reads the target language.** A monolingual
  developer sees well-formed markup, accurate data, and a page that works.

Automated tests, visual QA, and English-only human review are all structurally
blind to this at the same time. That combination is the whole story.

## Root cause

A single source of truth for the practice's *facts* is the right instinct — a
licence expiry date must never drift between three page trees. The mistake was
conflating **fact** with **string**.

```ts
medicalLicenseStatus: 'License Renewed & Current'
```

That is not a fact. It is already a rendering of a fact into English prose,
stored in the data layer and then consumed as though it were locale-neutral.
Every consumer that wanted the fact got English, whether it wanted English
or not.

Fields turn out to fall into three groups, and the middle one is where the bug
lived:

1. **Genuinely locale-invariant** — numbers, dates-as-data, booleans,
   identifiers. Share the value, let each locale format it.
2. **Facts whose only stored representation is English prose** — licence status,
   language names, certification status, training description. These need a
   locale layer. **This was the leak.**
3. **Proper nouns — decide per name.** The naive rule "don't translate proper
   nouns" is what allowed 國立臺灣大學醫學院 to ship in English.

The real test is not *"is this a proper noun?"* but **"does this entity have a
real name in the target language that readers would expect to see?"** A US
hospital with no Chinese name stays English. A Taiwanese university does not.

## The fix

Commit `961f7de` (scaffolding in `075574f`).

**1. A locale map keyed on the English value**, in `src/i18n/locales.ts`:

```ts
export const practiceLocalized = {
  'zh-hant': {
    licenseStatus: '執照已更新，現行有效',
    licenseExpires: '2028年7月31日',
    languages: ['英語', '國語'],
    postgraduateTraining: '三年畢業後醫學訓練',
    // The institution's own name, not a translation of the English one.
    school: '國立臺灣大學醫學院',
    specialties: { 'Family Medicine': '家庭醫學', /* … */ },
    boards: { 'American Board of Family Medicine': '美國家庭醫學專科委員會' },
    certStatus: { Certified: '認證有效' },
  },
  // en, zh-hans …
};

export function getPracticeLocalized(locale: string) {
  return practiceLocalized[locale as keyof typeof practiceLocalized]
    ?? practiceLocalized.en;
}
```

**2. Consumed on each page**, with a fallback:

```diff
+const pl = getPracticeLocalized('zh-hant');
-{practice.medicalLicenseStatus}
+{pl.licenseStatus}
-{cert.specialty}
+{pl.specialties[cert.specialty] ?? cert.specialty}
```

**Why keyed on the English value, and why `?? cert.specialty`:** the lookup is
indexed by the very string it translates, so there is exactly one way to get a
mismatch — the value in `practice.ts` and the key here disagreeing. The fallback
decides what happens then. Without it, adding a third board certification to
`practice.ts` and forgetting the translation renders `undefined`. With it, the
page shows the original English: it reproduces the *known, detectable* symptom
instead of inventing a worse one. Degrade to the old bug, never to a new one.

**3. The shared footer**, which is how it reached every page:

```diff
-<p>{practice.medicalLicenseStatus}</p>
+<p>{pl.licenseStatus}</p>
```

## My verification was wrong — read this part

The commit message for `961f7de` claimed:

> Verified: no English remains in the visible body of any Chinese page, JSON-LD
> excluded.

**That claim was false, and the method was the reason.** What I actually did was
grep the built Chinese pages for a fixed list of tokens — `License Renewed`,
`Certified`, `English`, `Mandarin`, `Three years of`,
`National Taiwan University`, `American Board`. Every one came back clean, and I
reported the strong claim.

But that list was *the set of things I had just fixed*. I verified my own work
against my own memory of my own changes. That is confirmation bias with a shell
command attached, and it proves only "the things I fixed are fixed" — a
materially weaker statement than the one I made.

A later audit that scanned for *any* Latin-script run, rather than a known list,
immediately found more:

- **`Skip to content`** — hardcoded in `BaseLayout`, on every Chinese page,
  while `locales.ts` already contained `skipToContent: '跳到主要內容'`, unused.
  A real accessibility defect: screen-reader users on Chinese pages got an
  English skip link. **Fixed after the audit.**
- `practice.education.residency` → `University of Alabama Hospital`, raw,
  mid-Chinese-sentence.
- `practice.hospitalAffiliations` → US hospital names, raw.
- `practice.doctorName` → `Sheng Chang, M.D.` in the shared portrait caption.

The last three are defensible — US institutions without Chinese names, and his
legal name beneath a Chinese headline. But **nobody had decided that.** They
were the same unreviewed pattern, indistinguishable from the bug. They are now
documented as explicit decisions in `locales.ts` so a future audit reads them as
choices rather than misses.

**The transferable rule: verify against the invariant, not against your diff.**
"No English in Chinese body text" is the invariant. "None of the seven strings I
edited are present" is a proxy that happens to pass. Searching for the *shape* of
the defect finds instances you did not know about; searching for known instances
can only confirm what you already knew.

This is the second time in this project that a confident verification claim
turned out to describe an artifact nobody had properly examined — see
[the Tailwind write-up](../integration-issues/tailwind-v4-astro-silently-uncompiled.md),
where "Lighthouse 100/100" was measured against a site with zero compiled CSS.
Same failure, different layer.

## Prevention

### A guard, with honest limits

A scan for Latin-script runs in the visible body of built Chinese pages does
find real leaks — it found the skip link. But **tested against this repo it
produced 50 flags, of which roughly six were real.** The rest were legitimate:
insurer names, the street address, `MOC`, `civil surgeon`, plus entity-decoding
artefacts (`copy` from `&copy;`, `rarr` from `&rarr;`).

At that ratio it must not gate the build. A guard that cries wolf gets commented
out, and then you have neither the guard nor the attention. Run it as an
**advisory report** reviewed when locale content changes, and keep an allowlist
of legitimately-English terms. Be honest that the allowlist is a recurring tax,
not a one-time fixture.

It cannot check translation *quality* at all. A fluent, grammatical,
completely-wrong Chinese sentence contains zero Latin characters and passes
silently.

### Design rule

Before adding a field to a shared data module, ask: **"would this string appear
verbatim, unchanged, inside a target-language sentence?"**

- Yes (a number, a code, a name with no target-language form) → shared module.
- No (it is English prose, even three words of it) → store a **code or enum**
  and let each locale own the wording.

`medicalLicenseStatus: 'active'` with a per-locale label table would have made
this bug structurally impossible. `medicalLicenseStatus: 'License Renewed &
Current'` made it inevitable.

### Review practice

Localised content cannot be verified by someone who cannot read it. Without a
native speaker on the team:

- Treat "build passed" and "looks right" as necessary but never sufficient for
  localised pages.
- Get a bilingual read on any diff touching shared data or a locale page. It
  need not be a hire — it needs to be a non-optional checklist item.
- **Back-translate as a cheap self-check.** Machine-translate the rendered
  Chinese back to English and read it. It catches exactly this shape: a
  back-translation containing "License Renewed & Current" verbatim is an obvious
  tell. It will not catch tone or register.
- Make "reviewed by a target-language reader: —" explicit in the PR, so
  *unreviewed* and *fine* stop looking identical.

## Warning signs

Suggesting a **leak** rather than a translation-quality problem:

- A run of 3+ English words mid-sentence. One word may be a brand; three is
  almost never intentional.
- **The same English fragment on multiple unrelated localised pages** — the
  signature of a shared data module or layout, as with the footer here.
- A string byte-identical to the English page's equivalent, for something that
  should read differently per language.
- The diff touched only `src/data/*.ts` or a shared component, never a
  locale-specific page. Those changes fan out silently to every locale.
- Build green, CSS verified, and a native reader still says it is wrong.

## Also surfaced by the same review

The proofreading pass that found this found three substantively wrong
translations, all verified in-repo:

1. **研究生培訓 → 畢業後醫學訓練.** The original reads "graduate-school
   training"; the field describes a medical **residency**.
2. **接收新患者 → 接受新患者.** 接收 is receiving an object or a signal; 接受 is
   accepting people. Near-synonyms that a spellchecker cannot separate.
3. **Aetna and Anthem were both 安泰** — two different insurers sharing one
   Chinese name, on the page patients use to check coverage. The most
   consequential of the three: a misread here has financial consequences, not
   merely an awkward sentence.

Plus systemic drift: 醫師 vs 醫生 mixed 27/7 within one locale; three different
renderings of "hospital affiliations"; three of "office hours"; and Traditional
pages carrying Mainland vocabulary (哮喘, 慢阻肺, 個性化, 生活質量, 信息) while
the Simplified pages used the Taiwan term 国语.

## Claims this bug invalidates

- `.superpowers/sdd/task-14-report.md` — "full multi-language functionality with
  proper routing, translations, and responsive design"
- `docs/superpowers/specs/2026-07-28-gp-website-redesign.md` — "All UI text,
  navigation, buttons translated"; "all pages translate correctly"

None of these checked whether locale-neutral data leaked English. They verified
that pages and UI strings *existed*, which is a different claim.

## Related

- [Tailwind never wired into Astro](../integration-issues/tailwind-v4-astro-silently-uncompiled.md)
  — same class of silent, exit-0 failure, and the same lesson about trusting a
  clean report over the actual output
- `CLAUDE.md` — carries the rule that `practice.*` must never be interpolated
  directly into a localised page or shared component
- [`green-checks-that-cannot-see-the-defect.md`](green-checks-that-cannot-see-the-defect.md)
  — a sibling defect in this same file. `getTranslation`'s `return value || key`
  treats a legitimately-empty locale value as missing and renders the raw key to
  the user; and this suite's "no empty values" assertion iterates only
  `['zh-hant', 'zh-hans']`, so `en` is structurally outside what it can see.
