# Immigration Medical Exam Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dedicated Form I-693 page at `/immigration-medical-exam/` in English, 繁體 and 简体, whose facts all derive from `practice.ts`, and cut the I-693 section of the services page down to a summary and a link.

**Architecture:** Facts live in a new `practice.immigrationExam` block. A pure TypeScript module (`src/data/immigrationExam.ts`) turns them plus `locales.ts` strings into a list of fact lines (dropping any whose value is `null`), a FAQ list, and the `FAQPage` JSON-LD. A shared `ExamFacts.astro` component and three locale-forked pages render those. `verify-build.mjs` gains a post-build check that the FAQ JSON-LD text equals the visible FAQ text.

**Tech Stack:** Astro 5, Tailwind v4 (token-mapped classes only), Vitest 4, Node post-build scripts.

**Spec:** `docs/superpowers/specs/2026-09-21-immigration-medical-exam-page-design.md`

## Global Constraints

- **Never invent a fact.** Unknown values stay `null` in `practice.ts`, and a `null` value hides its line.
- Known facts (owner, 2026-09-21): appointment only; one flat fee; fee amount unknown. Existing site policy: adults 18 and over only. The doctor explains results in English or Mandarin.
- `vaccinesOnSite` and `typicalVisits` are **unknown**. Do not state either anywhere, including the services summary.
- Every user-facing string exists in `en`, `zh-hant` and `zh-hans` in the same commit.
- Chinese is Taiwan Mandarin in both scripts. 简体 = the same Taiwan wording in simplified characters (医师, 资讯, 身分, 联络, 国语, 纪录). Never 医生/信息/联系/普通话/身份/记录/健保. Full-width punctuation.
- No Chinese in a shared component. All strings go through `getTranslation()` / `getPracticeLocalized()`.
- No literal `aria-label`, `title`, `alt` or `data-label` in a shared component.
- Never render `practice.*` English strings on a Chinese page, with one exception: the street address (`practice.address`), which the footer and location pages already render in English on purpose.
- Chinese `<title>`, meta description and `og:site_name` must contain CJK and must not contain "Sheng Chang" (`verify-build.mjs` enforces this).
- American English in all English copy and comments.
- Only Tailwind classes already token-mapped in `src/styles/global.css`, including `hover:` forms. `tests/styles/theme-token-coverage.test.ts` enforces this.
- Every new test is shown to fail before it counts: introduce the mutation, see red, restore.
- Form numbers (I-693) stay as-is in every locale.
- Branch → PR. Never commit to `main`. Create the branch as its own step.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/data/practice.ts` (modify) | `immigrationExam` facts: the single source of truth |
| `src/i18n/locales.ts` (modify) | `immigrationExam` string block ×3 locales: labels, values, FAQ |
| `src/data/immigrationExam.ts` (create) | Pure functions: `getExamFacts`, `getExamFaq`, `examFaqSchema` |
| `tests/data/immigration-exam.test.ts` (create) | Null-hides-line, FAQ shape, and schema tests |
| `src/components/ExamFacts.astro` (create) | Renders the quick facts box; no literal text |
| `src/pages/immigration-medical-exam.astro` + `zh-hant/` + `zh-hans/` (create) | The three pages |
| `src/pages/services.astro` ×3 (modify) | The I-693 section becomes a summary and a link |
| `src/pages/index.astro` ×3 (modify) | The I-693 card links to the new page |
| `src/components/JsonLd.astro` (modify) | The I-693 `MedicalService` `@id` and `url` point to the new page |
| `scripts/verify-build.mjs` (modify) | FAQ JSON-LD equals visible FAQ; all three I-693 pages built |

---

### Task 0: Branch

- [ ] **Step 1:** Starting from an up-to-date `main`:

```bash
git switch main && git pull --ff-only
git switch -c feat/immigration-medical-exam-page
git branch --show-current   # must print feat/immigration-medical-exam-page
```

---

### Task 1: Facts, strings and the pure data module

**Files:**
- Modify: `src/data/practice.ts` (interface `PracticeInfo`, and the `practice` object after `civilSurgeon: true,`)
- Modify: `src/i18n/locales.ts` (add an `immigrationExam` block to each of `translations.en`, `translations['zh-hant']`, `translations['zh-hans']`, placed right after each locale's `coverage` block)
- Create: `src/data/immigrationExam.ts`
- Test: `tests/data/immigration-exam.test.ts`

**Interfaces:**
- Produces:
  - `interface ImmigrationExamFacts { appointmentOnly: boolean; flatFee: boolean; feeAmount: string | null; vaccinesOnSite: boolean | null; typicalVisits: number | null; }`
  - `interface FactLine { key: string; label: string; value: string }`
  - `getExamFacts(locale: string, exam?: ImmigrationExamFacts): FactLine[]`
  - `interface FaqItem { question: string; answer: string }`
  - `getExamFaq(locale: string): FaqItem[]`
  - `examFaqSchema(locale: string, pageUrl: string): Record<string, unknown>`

- [ ] **Step 1: Write the failing test** at `tests/data/immigration-exam.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { practice } from '@data/practice';
import {
  getExamFacts,
  getExamFaq,
  examFaqSchema,
  type ImmigrationExamFacts,
} from '@data/immigrationExam';

const LOCALES = ['en', 'zh-hant', 'zh-hans'] as const;
const known: ImmigrationExamFacts = {
  appointmentOnly: true,
  flatFee: true,
  feeAmount: null,
  vaccinesOnSite: null,
  typicalVisits: null,
};

describe('getExamFacts', () => {
  it.each(LOCALES)('%s: a null fact renders no line', (locale) => {
    const keys = getExamFacts(locale, known).map((f) => f.key);
    expect(keys).not.toContain('vaccines');
    expect(keys).not.toContain('visits');
  });

  it.each(LOCALES)('%s: a supplied fact renders its line', (locale) => {
    const keys = getExamFacts(locale, { ...known, vaccinesOnSite: true, typicalVisits: 2 }).map(
      (f) => f.key,
    );
    expect(keys).toContain('vaccines');
    expect(keys).toContain('visits');
  });

  it.each(LOCALES)('%s: an unknown fee says to call, a known fee shows the amount', (locale) => {
    const unknownFee = getExamFacts(locale, known).find((f) => f.key === 'fee')!;
    const knownFee = getExamFacts(locale, { ...known, feeAmount: '$999' }).find(
      (f) => f.key === 'fee',
    )!;
    expect(unknownFee.value).not.toContain('$');
    expect(knownFee.value).toContain('$999');
  });

  it.each(LOCALES)('%s: every line has a non-empty label and value', (locale) => {
    for (const f of getExamFacts(locale, { ...known, vaccinesOnSite: false, typicalVisits: 2 })) {
      expect(f.label.trim(), f.key).not.toBe('');
      expect(f.value.trim(), f.key).not.toBe('');
      expect(f.value, f.key).not.toMatch(/\{\w+\}/); // no unreplaced placeholder
    }
  });

  it('the live data publishes nothing the owner has not confirmed', () => {
    // Flip this only when the office confirms the value in writing.
    expect(practice.immigrationExam.vaccinesOnSite).toBeNull();
    expect(practice.immigrationExam.typicalVisits).toBeNull();
    expect(practice.immigrationExam.feeAmount).toBeNull();
  });

  it('Chinese lines carry no English practice strings', () => {
    for (const locale of ['zh-hant', 'zh-hans']) {
      for (const f of getExamFacts(locale)) {
        if (f.key === 'address') continue; // English by design, as in the footer
        expect(f.value, `${locale}.${f.key}`).not.toMatch(/Mandarin|English|Sheng Chang|appointment/);
      }
    }
  });
});

describe('getExamFaq and examFaqSchema', () => {
  it.each(LOCALES)('%s: four questions, none empty', (locale) => {
    const faq = getExamFaq(locale);
    expect(faq).toHaveLength(4);
    for (const q of faq) {
      expect(q.question.trim()).not.toBe('');
      expect(q.answer).not.toMatch(/\{\w+\}/);
    }
  });

  it.each(LOCALES)('%s: the schema is built from the same FAQ the page shows', (locale) => {
    const schema = examFaqSchema(locale, 'https://example.com/x/') as {
      '@type': string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(
      getExamFaq(locale).map((q) => [q.question, q.answer]),
    );
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/data/immigration-exam.test.ts`
Expected: FAIL, because `@data/immigrationExam` cannot be resolved.

- [ ] **Step 3: Add the facts to `practice.ts`**

In the `PracticeInfo` interface, directly after `civilSurgeon: boolean;`, add:

```ts
  /**
   * Form I-693 exam facts. `null` means UNKNOWN, and an unknown fact renders
   * nothing: see getExamFacts() in immigrationExam.ts. Do not fill a null in
   * without the office confirming it in writing.
   */
  immigrationExam: ImmigrationExamFacts;
```

Above `export interface PracticeInfo`, add:

```ts
export interface ImmigrationExamFacts {
  appointmentOnly: boolean;
  flatFee: boolean;
  /** Display string including currency, e.g. '$350'. */
  feeAmount: string | null;
  vaccinesOnSite: boolean | null;
  typicalVisits: number | null;
}
```

In the `practice` object, directly after `civilSurgeon: true,`, add:

```ts
  immigrationExam: {
    // Owner, 2026-09-21. No page or JSON-LD said otherwise (walk-in, same-day,
    // 現場, 免預約 searched in every locale before publishing).
    appointmentOnly: true,
    // Owner, 2026-09-21: one flat fee. The amount was not known.
    flatFee: true,
    feeAmount: null,
    // UNKNOWN as of 2026-09-21. services.astro used to claim both ("missing
    // doses given", "one visit wherever possible") from the scaffold era; that
    // copy was removed when this page shipped, not confirmed.
    vaccinesOnSite: null,
    typicalVisits: null,
  },
```

- [ ] **Step 4: Add the string blocks to `locales.ts`**

After the `coverage: { … },` block in `translations.en`:

```ts
    immigrationExam: {
      factsHeading: 'At a glance',
      physicianLabel: 'Physician',
      designationLabel: 'Designation',
      designationValue: 'USCIS-designated civil surgeon',
      addressLabel: 'Address',
      hoursLabel: 'Hours',
      appointmentsLabel: 'Appointments',
      appointmentOnly: 'By appointment only',
      feeLabel: 'Fee',
      feeUnknown: 'One flat fee. Call for the current price.',
      feeKnown: 'One flat fee of {amount}',
      languagesLabel: 'Languages',
      languagesValue: 'Dr. Chang explains results in English or Mandarin. Our office speaks {languages}.',
      whoLabel: 'Who we see',
      vaccinesLabel: 'Vaccines',
      vaccinesYes: 'Given in the office',
      vaccinesNo: 'Not given in the office',
      visitsLabel: 'Visits',
      visitsValue: 'Usually {n} visits',
      faqHeading: 'Frequently asked questions',
      faqAppointmentQ: 'Do I need an appointment?',
      faqAppointmentA: 'Yes. Immigration medical exams are by appointment only. Please call the office to book.',
      faqLanguagesQ: 'Which languages can I use?',
      faqLanguagesA: 'Dr. Chang explains your results in English or Mandarin. Our office speaks {languages}.',
      faqCostQ: 'How much does the exam cost?',
      faqCostA: 'The exam is one flat fee. Please call the office for the current price.',
      faqChildrenQ: 'Do you examine children?',
      faqChildrenA:
        'No. We see adults 18 and over. For a child, use the USCIS Find a Civil Surgeon tool to find a civil surgeon who sees children.',
    },
```

After the `coverage` block in `translations['zh-hant']`:

```ts
    immigrationExam: {
      factsHeading: '重點資訊',
      physicianLabel: '醫師',
      designationLabel: '資格',
      designationValue: '美國移民局指定體檢醫師（civil surgeon）',
      addressLabel: '地址',
      hoursLabel: '看診時間',
      appointmentsLabel: '預約',
      appointmentOnly: '採預約制',
      feeLabel: '費用',
      feeUnknown: '單一固定費用，目前價格請來電洽詢。',
      feeKnown: '單一固定費用 {amount}',
      languagesLabel: '語言',
      languagesValue: '張醫師以英語或國語為您說明結果。診所可使用的語言：{languages}。',
      whoLabel: '看診對象',
      vaccinesLabel: '疫苗',
      vaccinesYes: '診所可施打',
      vaccinesNo: '診所不提供施打',
      visitsLabel: '看診次數',
      visitsValue: '通常需看診 {n} 次',
      faqHeading: '常見問題',
      faqAppointmentQ: '需要預約嗎？',
      faqAppointmentA: '需要。移民體檢採預約制，請來電預約。',
      faqLanguagesQ: '可以使用哪些語言？',
      faqLanguagesA: '張醫師以英語或國語為您說明結果。診所可使用的語言：{languages}。',
      faqCostQ: '體檢費用是多少？',
      faqCostA: '移民體檢採單一固定費用，目前價格請來電洽詢。',
      faqChildrenQ: '可以為孩童做體檢嗎？',
      faqChildrenA:
        '很抱歉，本診所只看 18 歲以上成人。孩童的移民體檢，請使用美國移民局的 Find a Civil Surgeon 工具，尋找有看孩童的體檢醫師。',
    },
```

After the `coverage` block in `translations['zh-hans']`:

```ts
    immigrationExam: {
      factsHeading: '重点资讯',
      physicianLabel: '医师',
      designationLabel: '资格',
      designationValue: '美国移民局指定体检医师（civil surgeon）',
      addressLabel: '地址',
      hoursLabel: '看诊时间',
      appointmentsLabel: '预约',
      appointmentOnly: '采预约制',
      feeLabel: '费用',
      feeUnknown: '单一固定费用，目前价格请来电洽询。',
      feeKnown: '单一固定费用 {amount}',
      languagesLabel: '语言',
      languagesValue: '张医师以英语或国语为您说明结果。诊所可使用的语言：{languages}。',
      whoLabel: '看诊对象',
      vaccinesLabel: '疫苗',
      vaccinesYes: '诊所可施打',
      vaccinesNo: '诊所不提供施打',
      visitsLabel: '看诊次数',
      visitsValue: '通常需看诊 {n} 次',
      faqHeading: '常见问题',
      faqAppointmentQ: '需要预约吗？',
      faqAppointmentA: '需要。移民体检采预约制，请来电预约。',
      faqLanguagesQ: '可以使用哪些语言？',
      faqLanguagesA: '张医师以英语或国语为您说明结果。诊所可使用的语言：{languages}。',
      faqCostQ: '体检费用是多少？',
      faqCostA: '移民体检采单一固定费用，目前价格请来电洽询。',
      faqChildrenQ: '可以为孩童做体检吗？',
      faqChildrenA:
        '很抱歉，本诊所只看 18 岁以上成人。孩童的移民体检，请使用美国移民局的 Find a Civil Surgeon 工具，寻找有看孩童的体检医师。',
    },
```

- [ ] **Step 5: Create `src/data/immigrationExam.ts`**

Every `immigrationExam.<key>` is written out literally, because
`tests/data/source-integrity.test.ts` checks that each locale key appears
verbatim in some source file. A template-built key would fail it.

```ts
/**
 * Form I-693 page data, derived from practice.ts and locales.ts.
 *
 * The rule this module exists to enforce: a fact that is null in practice.ts
 * renders NO line. The page cannot claim a price, a vaccine service or a visit
 * count until someone records the real value, which is how "never invent a
 * fact" stops depending on memory.
 */
import { practice, type ImmigrationExamFacts } from './practice';
import { getTranslation, getPracticeLocalized } from '../i18n/locales';

export type { ImmigrationExamFacts };

export interface FactLine {
  key: string;
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

function languageList(locale: string): string {
  const sep = locale === 'en' ? ', ' : '、';
  return getPracticeLocalized(locale).languages.join(sep);
}

export function getExamFacts(
  locale: string,
  exam: ImmigrationExamFacts = practice.immigrationExam,
): FactLine[] {
  const t = (k: string) => getTranslation(locale, k);
  const lines: (FactLine | null)[] = [
    { key: 'physician', label: t('immigrationExam.physicianLabel'), value: t('header.wordmark') },
    {
      key: 'designation',
      label: t('immigrationExam.designationLabel'),
      value: t('immigrationExam.designationValue'),
    },
    { key: 'address', label: t('immigrationExam.addressLabel'), value: practice.address },
    { key: 'hours', label: t('immigrationExam.hoursLabel'), value: t('hoursWeekday') },
    exam.appointmentOnly
      ? {
          key: 'appointments',
          label: t('immigrationExam.appointmentsLabel'),
          value: t('immigrationExam.appointmentOnly'),
        }
      : null,
    exam.flatFee
      ? {
          key: 'fee',
          label: t('immigrationExam.feeLabel'),
          value:
            exam.feeAmount === null
              ? t('immigrationExam.feeUnknown')
              : t('immigrationExam.feeKnown').replace('{amount}', exam.feeAmount),
        }
      : null,
    {
      key: 'languages',
      label: t('immigrationExam.languagesLabel'),
      value: t('immigrationExam.languagesValue').replace('{languages}', languageList(locale)),
    },
    { key: 'who', label: t('immigrationExam.whoLabel'), value: t('patientScope.adults') },
    exam.vaccinesOnSite === null
      ? null
      : {
          key: 'vaccines',
          label: t('immigrationExam.vaccinesLabel'),
          value: exam.vaccinesOnSite
            ? t('immigrationExam.vaccinesYes')
            : t('immigrationExam.vaccinesNo'),
        },
    exam.typicalVisits === null
      ? null
      : {
          key: 'visits',
          label: t('immigrationExam.visitsLabel'),
          value: t('immigrationExam.visitsValue').replace('{n}', String(exam.typicalVisits)),
        },
  ];
  return lines.filter((l): l is FactLine => l !== null);
}

export function getExamFaq(locale: string): FaqItem[] {
  const t = (k: string) => getTranslation(locale, k);
  return [
    { question: t('immigrationExam.faqAppointmentQ'), answer: t('immigrationExam.faqAppointmentA') },
    {
      question: t('immigrationExam.faqLanguagesQ'),
      answer: t('immigrationExam.faqLanguagesA').replace('{languages}', languageList(locale)),
    },
    { question: t('immigrationExam.faqCostQ'), answer: t('immigrationExam.faqCostA') },
    { question: t('immigrationExam.faqChildrenQ'), answer: t('immigrationExam.faqChildrenA') },
  ];
}

/** Built from getExamFaq so crawlers read exactly what patients read. */
export function examFaqSchema(locale: string, pageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: locale === 'en' ? 'en-US' : locale === 'zh-hant' ? 'zh-Hant' : 'zh-Hans',
    mainEntity: getExamFaq(locale).map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
```

- [ ] **Step 6: Run the new test and confirm it passes**

Run: `npx vitest run tests/data/immigration-exam.test.ts`
Expected: PASS.

- [ ] **Step 7: Prove the null rule can fail**

Temporarily change the `vaccinesOnSite` branch in `getExamFacts` to always
return the line (replace `exam.vaccinesOnSite === null ? null :` with
`false ? null :`). Run the test and confirm that "a null fact renders no line"
goes RED for all three locales. Restore the code, and confirm it is green again.

Temporarily set `feeAmount: '$350'` in `practice.ts`. Confirm "the live data
publishes nothing the owner has not confirmed" goes RED. Restore it.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: all tests pass. `source-integrity`'s "every key is read by at least
one page" check scans every `.astro`/`.ts` file under `src/` (verified:
`sourceFiles()` recurses from `SRC`), so the literal keys in
`immigrationExam.ts` satisfy it. If it fails, a key was built from a template
rather than written out; write it out. If `taiwan-register` parity fails, a
zh-hant/zh-hans pair above is not parallel: fix the wording, not the test.

- [ ] **Step 9: Commit**

```bash
git add src/data/practice.ts src/i18n/locales.ts src/data/immigrationExam.ts tests/data/immigration-exam.test.ts
git commit -m "Add I-693 facts and strings; unknown facts render no line"
```

---

### Task 2: The quick facts component and the three pages

**Files:**
- Create: `src/components/ExamFacts.astro`
- Create: `src/pages/immigration-medical-exam.astro`
- Create: `src/pages/zh-hant/immigration-medical-exam.astro`
- Create: `src/pages/zh-hans/immigration-medical-exam.astro`

**Interfaces:**
- Consumes: `getExamFacts`, `getExamFaq`, `examFaqSchema` from Task 1; `BaseLayout` props `{ title, description, locale, canonicalUrl, breadcrumbs, pageSchema }`; `HeroSection` props `{ headline, subheadline, locale, illustration }`; `CallButton` props `{ text, size }`.
- Produces: routes `/immigration-medical-exam/`, `/zh-hant/immigration-medical-exam/` and `/zh-hans/immigration-medical-exam/`. Visible FAQ markup `<dl class="exam-faq"><dt>…</dt><dd>…</dd></dl>` (Task 5 parses this).

- [ ] **Step 1: Create `src/components/ExamFacts.astro`**

```astro
---
/*
  The I-693 quick facts box. No literal text: every label and value comes from
  getExamFacts(), which drops any fact that is null in practice.ts.
*/
import { getExamFacts } from '@data/immigrationExam';
import { getTranslation } from '@i18n/locales';

interface Props {
  locale: string;
}
const { locale } = Astro.props;
const facts = getExamFacts(locale);
---

<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
  <h2 class="font-serif text-2xl font-bold mb-4 text-gray-900">
    {getTranslation(locale, 'immigrationExam.factsHeading')}
  </h2>
  <dl class="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
    {facts.map((f) => (
      <>
        <dt class="font-semibold text-gray-900">{f.label}</dt>
        <dd class="sm:col-span-2 text-gray-700">{f.value}</dd>
      </>
    ))}
  </dl>
</div>
```

- [ ] **Step 2: Create the English page** at `src/pages/immigration-medical-exam.astro`

Sections 3–5 ("What the exam includes", "What to bring", "How it works") get
their content in Task 3. Here they are written with only the section heading
and a single sentence pointing to the source, so the page builds and the
structure can be reviewed.

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import HeroSection from '@components/HeroSection.astro';
import CallButton from '@components/CallButton.astro';
import ExamFacts from '@components/ExamFacts.astro';
import { practice } from '@data/practice';
import { getExamFaq, examFaqSchema } from '@data/immigrationExam';
import { getTranslation } from '@i18n/locales';

const locale = 'en';
const title = `Immigration Medical Exam (Form I-693) in San Gabriel | ${practice.doctorNameShort}`;
const description =
  'Form I-693 immigration medical exams in San Gabriel, CA, by a USCIS-designated civil surgeon. By appointment only. Results explained in English or Mandarin.';
const canonicalUrl = new URL('/immigration-medical-exam/', Astro.site).href;
const faq = getExamFaq(locale);

const breadcrumbs = [
  { label: getTranslation(locale, 'home'), href: '/' },
  { label: getTranslation(locale, 'services'), href: '/services/' },
  { label: 'Immigration Medical Exam', href: '/immigration-medical-exam/' },
];
---

<BaseLayout
  title={title}
  description={description}
  locale={locale}
  canonicalUrl={canonicalUrl}
  breadcrumbs={breadcrumbs}
  pageSchema={examFaqSchema(locale, canonicalUrl)}
>
  <HeroSection
    headline="Immigration Medical Exam (Form I-693) in San Gabriel"
    subheadline="Dr. Chang is a USCIS-designated civil surgeon. Exams are by appointment only."
    locale={locale}
    illustration="immigration"
  />

  <section class="py-12 md:py-16">
    <div class="max-w-container mx-auto px-4 md:px-6">
    <div class="max-w-3xl mx-auto space-y-12">
      <ExamFacts locale={locale} />

      <div>
        <h2 class="font-serif text-2xl md:text-3xl font-bold mb-4 text-gray-900">What the exam includes</h2>
        <!-- Task 3 fills this section from the CDC Technical Instructions. -->
      </div>

      <div>
        <h2 class="font-serif text-2xl md:text-3xl font-bold mb-4 text-gray-900">What to bring</h2>
        <!-- Task 3 fills this section from the USCIS Form I-693 instructions. -->
      </div>

      <div>
        <h2 class="font-serif text-2xl md:text-3xl font-bold mb-4 text-gray-900">How it works</h2>
        <!-- Task 3 fills this section from uscis.gov/i-693. -->
      </div>

      <div>
        <h2 class="font-serif text-2xl md:text-3xl font-bold mb-4 text-gray-900">
          {getTranslation(locale, 'immigrationExam.faqHeading')}
        </h2>
        <dl class="exam-faq space-y-6">
          {faq.map((q) => (
            <div>
              <dt class="font-semibold text-gray-900">{q.question}</dt>
              <dd class="mt-2 text-gray-700">{q.answer}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div class="text-center">
        <CallButton text="Call to Book an Exam" size="lg" variant="filled" />
      </div>
    </div>
    </div>
  </section>
</BaseLayout>
```

(HTML comments inside the template are temporary; Task 3 replaces each one.)

- [ ] **Step 3: Create `src/pages/zh-hant/immigration-medical-exam.astro`**

The same file with these differences:

```astro
const locale = 'zh-hant';
const title = '移民體檢（Form I-693）｜加州聖蓋博｜張勝雄醫師';
const description =
  '張勝雄醫師為美國移民局指定體檢醫師，於加州聖蓋博提供 Form I-693 移民體檢。採預約制，並以國語或英語為您說明結果。';
const canonicalUrl = new URL('/zh-hant/immigration-medical-exam/', Astro.site).href;

const breadcrumbs = [
  { label: getTranslation(locale, 'home'), href: '/zh-hant/' },
  { label: getTranslation(locale, 'services'), href: '/zh-hant/services/' },
  { label: '移民體檢', href: '/zh-hant/immigration-medical-exam/' },
];
```

Hero: `headline="移民體檢（Form I-693）"`,
`subheadline="張醫師為美國移民局指定體檢醫師（civil surgeon），移民體檢採預約制。"`.
Section headings: 體檢項目, 應攜帶的資料, 體檢流程. The FAQ heading comes from
`getTranslation`. Call button: `text="來電預約體檢"`.

- [ ] **Step 4: Create `src/pages/zh-hans/immigration-medical-exam.astro`**

The same as the zh-hant file, in simplified characters with Taiwan wording:

```astro
const locale = 'zh-hans';
const title = '移民体检（Form I-693）｜加州圣盖博｜张胜雄医师';
const description =
  '张胜雄医师为美国移民局指定体检医师，于加州圣盖博提供 Form I-693 移民体检。采预约制，并以国语或英语为您说明结果。';
const canonicalUrl = new URL('/zh-hans/immigration-medical-exam/', Astro.site).href;

const breadcrumbs = [
  { label: getTranslation(locale, 'home'), href: '/zh-hans/' },
  { label: getTranslation(locale, 'services'), href: '/zh-hans/services/' },
  { label: '移民体检', href: '/zh-hans/immigration-medical-exam/' },
];
```

Hero: `headline="移民体检（Form I-693）"`,
`subheadline="张医师为美国移民局指定体检医师（civil surgeon），移民体检采预约制。"`.
Section headings: 体检项目, 应携带的资料, 体检流程. Call button: `text="来电预约体检"`.

- [ ] **Step 5: Build and look**

Run: `npm test && ALLOW_INDEXING=true npm run build`
Expected: tests pass. The build passes `verify-build`: the English page is in the
sitemap, the Chinese pages are `noindex`, and the Chinese titles contain no
English name.

Run `npm run dev` and open all three pages at http://localhost:3120. Confirm
that the facts box shows 8 lines (no vaccines, no visits line), the fee line
says to call, and the FAQ shows 4 questions.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExamFacts.astro src/pages/immigration-medical-exam.astro src/pages/zh-hant/immigration-medical-exam.astro src/pages/zh-hans/immigration-medical-exam.astro
git commit -m "Add the I-693 page in three locales with a derived facts box and FAQ"
```

---

### Task 3: Sourced content for sections 3–5

**Files:**
- Modify: the three `immigration-medical-exam.astro` pages (replace the three HTML comments)

**Sources. Fetch each at execution time and quote from it; do not write from memory:**
- USCIS Form I-693 page: https://www.uscis.gov/i-693 (the instructions PDF is linked from it)
- CDC Technical Instructions for Civil Surgeons: https://www.cdc.gov/immigrant-refugee-health/hcp/civil-surgeons/index.html
- USCIS Policy Manual, Vol. 8, Part B (civil surgeon and I-693 validity): https://www.uscis.gov/policy-manual/volume-8-part-b

- [ ] **Step 1: Fetch the sources and record the facts**

For each source, record in the PR description: the URL, the date checked, and
the exact sentences used. Specifically establish, from the source text:
1. The components of the exam (history, physical, the specific blood tests
   and the ages they apply to, vaccination review)
2. What the applicant must bring (ID, vaccination records, and anything else
   the instructions list)
3. **The current timing rule**: whether I-693 must be filed with Form I-485,
   and how recently the civil surgeon must have signed it. This has changed
   recently; use only what the current source says.

- [ ] **Step 2: Write the English sections**

- *What the exam includes:* a short `<ul>` of the components from item 1,
  followed by: "Which tests you need depends on your age and history. The CDC
  sets the requirements; we follow them." Link the CDC source.
- *What to bring:* a `<ul>` from item 2 only. Nothing the instructions do not
  list. Link the USCIS source.
- *How it works:* an `<ol>`: (1) Call to book (appointment only). (2) Your
  exam. (3) Dr. Chang completes Form I-693 and gives it to you sealed. (4) The
  timing rule from item 3, stated exactly and with a "as of <date checked>"
  note. Link the source. **Do not state the number of visits or whether
  vaccines are given here**, since both are unknown.

Every link uses `rel="noopener"` and opens in the same tab. No text may
contradict the facts box.

- [ ] **Step 3: Translate into zh-hant, then zh-hans**

Taiwan Mandarin. Keep form numbers and the English tool name "Find a Civil
Surgeon" as-is. zh-hans is the same wording in simplified characters. Read the
trilingual-content skill (`.claude/skills/trilingual-content/SKILL.md`) before
writing.

- [ ] **Step 4: Run the language guards**

Run: `npx vitest run tests/i18n`
Expected: PASS. If `taiwan-register` parity fails, a concept is worded
differently in the two scripts; make them parallel.

- [ ] **Step 5: Commit**

```bash
git add src/pages/immigration-medical-exam.astro src/pages/zh-hant/immigration-medical-exam.astro src/pages/zh-hans/immigration-medical-exam.astro
git commit -m "I-693 page: what the exam includes, what to bring, how it works (sourced)"
```

---

### Task 4: Shrink the services section, re-point links and JSON-LD

**Files:**
- Modify: `src/pages/services.astro:65-111` (and the same `#immigration-exams` section in `zh-hant/services.astro` and `zh-hans/services.astro`)
- Modify: `src/pages/index.astro:42`, `src/pages/zh-hant/index.astro:37`, `src/pages/zh-hans/index.astro:37`
- Modify: `src/components/JsonLd.astro:180-194` (the immigration `MedicalService`)

- [ ] **Step 1: Replace the body of each `#immigration-exams` section**

Keep the `<section id="immigration-exams">` wrapper, the two-column grid, the
`<h2>` and the `ServiceIllustration` (old links to the anchor keep working).
Replace the paragraph, the four-item `<ul>` and the note box with:

English:
```astro
<p class="text-lg text-gray-700 mb-6 leading-relaxed">
  Dr. Chang is a <strong>USCIS-designated civil surgeon</strong>, authorized
  to complete <strong>Form I-693</strong> for adjustment of status. Exams are
  by appointment only, with results explained to you in English or Mandarin.
</p>
<a href="/immigration-medical-exam/" class="font-semibold text-primary-700 underline">
  What the exam includes, what to bring, and fees
</a>
```

zh-hant:
```astro
<p class="text-lg text-gray-700 mb-6 leading-relaxed">
  張醫師為<strong>美國移民局指定的體檢醫師（civil surgeon）</strong>，可辦理身分調整所需的 <strong>Form I-693</strong> 體檢。移民體檢採預約制，並以國語或英語為您說明結果。
</p>
<a href="/zh-hant/immigration-medical-exam/" class="font-semibold text-primary-700 underline">
  體檢項目、應攜帶的資料與費用
</a>
```

zh-hans:
```astro
<p class="text-lg text-gray-700 mb-6 leading-relaxed">
  张医师为<strong>美国移民局指定的体检医师（civil surgeon）</strong>，可办理身分调整所需的 <strong>Form I-693</strong> 体检。移民体检采预约制，并以国语或英语为您说明结果。
</p>
<a href="/zh-hans/immigration-medical-exam/" class="font-semibold text-primary-700 underline">
  体检项目、应携带的资料与费用
</a>
```

Keep the existing `CallButton` below it. This removes "missing doses given"
and "one visit wherever possible" from all three locales.

Before using `text-primary-700`, confirm it is on the token map in
`global.css` (CLAUDE.md: palette classes are hardcoded colors unless
redeclared). `theme-token-coverage` fails if not.

- [ ] **Step 2: Confirm the unconfirmed claims are gone**

Run:
```bash
grep -rn "missing doses\|one visit\|補接種\|补接种\|一次看診完成\|一次看诊完成" src
```
Expected: no output. The family-medicine line 例行預防接種與疫苗 / "routine
immunizations" is **out of scope** for this PR; note in the PR that it still
awaits the office's answer on vaccines.

- [ ] **Step 3: Re-point the home page cards**

In all three `index.astro` files, change `href="/services/#immigration-exams"`
(and the `/zh-hant/…` and `/zh-hans/…` forms) to the new page's URL for that
locale.

- [ ] **Step 4: Re-point the JSON-LD service**

In `JsonLd.astro`, for the immigration `MedicalService`:

```ts
    '@id': new URL('/immigration-medical-exam/#service', Astro.site).href,
    url: new URL('/immigration-medical-exam/', Astro.site).href,
```

(Add `url` if absent.) Search for the old id: `grep -rn "services/#immigration-exams" src`.
Expected: no output.

- [ ] **Step 5: Test, build, commit**

Run: `npm test && ALLOW_INDEXING=true npm run build`
Expected: PASS.

```bash
git add src/pages/services.astro src/pages/zh-hant/services.astro src/pages/zh-hans/services.astro src/pages/index.astro src/pages/zh-hant/index.astro src/pages/zh-hans/index.astro src/components/JsonLd.astro
git commit -m "Point I-693 links and JSON-LD at the new page; drop two unconfirmed claims"
```

---

### Task 5: Post-build checks: FAQ parity and all three pages built

**Files:**
- Modify: `scripts/verify-build.mjs` (add a numbered check before the final `if (failures.length)` block)

- [ ] **Step 1: Add the check**

```js
// 7. The FAQ that crawlers read must be the FAQ that patients read. The
//    I-693 page emits FAQPage JSON-LD from the same data as its visible <dl>;
//    this compares the two in the built HTML, where a hand edit to either
//    one would show.
const decode = (s) =>
  s
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
const EXAM_PAGES = [
  'immigration-medical-exam/index.html',
  'zh-hant/immigration-medical-exam/index.html',
  'zh-hans/immigration-medical-exam/index.html',
];
for (const rel of EXAM_PAGES) {
  const file = join(DIST, rel);
  if (!existsSync(file)) {
    fail(`I-693 page not built: ${rel}`);
    continue;
  }
  const html = read(file);
  const schemaJson = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((s) => s['@type'] === 'FAQPage');
  if (!schemaJson) {
    fail(`${rel}: no FAQPage JSON-LD`);
    continue;
  }
  const dl = html.match(/<dl class="exam-faq[^"]*"[^>]*>([\s\S]*?)<\/dl>/)?.[1] ?? '';
  const visible = [...dl.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map(
    (m) => [decode(m[1]), decode(m[2])],
  );
  const schema = schemaJson.mainEntity.map((q) => [q.name.trim(), q.acceptedAnswer.text.trim()]);
  if (visible.length === 0) fail(`${rel}: visible FAQ not found`);
  else if (JSON.stringify(visible) !== JSON.stringify(schema)) {
    fail(`${rel}: FAQPage JSON-LD differs from the visible FAQ`);
  }
}
```

(Use whatever the next unused check number is in the file.)

- [ ] **Step 2: Run it and confirm it passes**

Run: `ALLOW_INDEXING=true npm run build`
Expected: `[verify-build] OK`.

- [ ] **Step 3: Prove both checks can fail**

(a) In `examFaqSchema`, temporarily append `' '` + `'x'` to `q.answer` in the
`text` field. Rebuild. Expected: FAIL with "FAQPage JSON-LD differs from the
visible FAQ" for all three pages. Restore.
(b) Temporarily rename `src/pages/zh-hans/immigration-medical-exam.astro` to
`.bak`. Rebuild. Expected: FAIL with "I-693 page not built". Restore.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-build.mjs
git commit -m "verify-build: FAQ JSON-LD must equal the visible FAQ; all I-693 locales built"
```

---

### Task 6: Full verification and PR

- [ ] **Step 1: The CI-equivalent run**

```bash
npx tsc --noEmit && npm test && ALLOW_INDEXING=true npm run build
```
Expected: all green. Record the test count.

- [ ] **Step 2: Negation search before publishing**

```bash
grep -rn -i "walk-in\|walk in\|same-day\|same day\|現場\|现场\|免預約\|免预约" src
grep -rn -i "all ages\|newborn\|children\|兒童\|儿童\|孩童" src
```
Expected: nothing that contradicts "appointment only" or "adults only". The
new FAQ's children answer is the only "children" hit, and it states the
limit. Also re-read `JsonLd.astro` in full; it is not a page and a page-by-page
review misses it.

- [ ] **Step 3: Browser check**

`npm run dev`, then for each of the three pages, in light **and** dark
themes: the facts box is legible; the link on the services page is legible
at rest **and on hover**; the FAQ renders; the call button works. A resting
screenshot in one theme is not evidence.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin feat/immigration-medical-exam-page
gh pr create --title "Dedicated Form I-693 page in three locales" --body-file <written body>
```

The PR body lists: what shipped; the sources and dates from Task 3; the two
claims removed from `services.astro`; **still unconfirmed**: fee amount,
vaccines (including the family-medicine line 例行預防接種與疫苗), visit count,
turnaround; and that the Chinese pages stay `noindex` until Dr. Chang's review.

Do **not** merge without the owner asking for the merge in his own message.
