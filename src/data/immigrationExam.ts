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
  const languages = getPracticeLocalized(locale).languages;
  if (locale !== 'en') return languages.join('、');
  if (languages.length < 2) return languages.join(', ');
  return `${languages.slice(0, -1).join(', ')}, and ${languages[languages.length - 1]}`;
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
