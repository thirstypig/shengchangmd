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

describe('languageList serial comma (en only)', () => {
  it('en: joins with a serial comma before the last item', () => {
    const line = getExamFacts('en', known).find((f) => f.key === 'languages')!;
    expect(line.value).toContain(', and Vietnamese');
  });

  it('zh-hant: stays joined with 、', () => {
    const line = getExamFacts('zh-hant', known).find((f) => f.key === 'languages')!;
    expect(line.value).toContain('、');
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
