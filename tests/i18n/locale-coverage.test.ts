/**
 * These tests exist to prevent two regressions that have actually happened in
 * this project, both of which shipped silently and were invisible to the build:
 *
 *  1. A value in practice.ts with no counterpart in practiceLocalized. The page
 *     falls back to the English string, so a Chinese page renders English
 *     mid-sentence. See docs/solutions/logic-errors/.
 *  2. A translation key present in `en` but missing in a Chinese locale.
 *     getTranslation() returns the key itself, so the page renders the literal
 *     text "hoursWeekday" or "footer.legal" to a patient.
 *
 * Both are content-correctness failures that typecheck and build cleanly, which
 * is exactly why they need tests rather than tooling.
 */
import { describe, it, expect } from 'vitest';
import {
  translations,
  locales,
  practiceLocalized,
  getTranslation,
  getPracticeLocalized,
} from '@i18n/locales';
import { practice } from '@data/practice';

const LOCALES = ['en', 'zh-hant', 'zh-hans'] as const;
const TARGET_LOCALES = ['zh-hant', 'zh-hans'] as const;

/** Flattens nested translation objects into dotted paths, e.g. `footer.hours`. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe('translation key coverage', () => {
  const englishKeys = keyPaths(translations.en).sort();

  it('defines the same set of locales in `locales` and `translations`', () => {
    expect(Object.keys(translations).sort()).toEqual(Object.keys(locales).sort());
  });

  for (const locale of TARGET_LOCALES) {
    it(`${locale} defines every key that en defines`, () => {
      const missing = englishKeys.filter(
        (k) => !keyPaths(translations[locale]).includes(k),
      );
      // A missing key renders as the raw key text on a live patient-facing page.
      expect(missing).toEqual([]);
    });

    it(`${locale} defines no keys that en does not`, () => {
      // An orphan key is dead weight, and usually means a rename landed in one
      // locale only — the other half of the same mistake.
      const orphans = keyPaths(translations[locale]).filter(
        (k) => !englishKeys.includes(k),
      );
      expect(orphans).toEqual([]);
    });

    it(`${locale} has no empty or whitespace-only values`, () => {
      const blanks = keyPaths(translations[locale]).filter((k) => {
        const v = getTranslation(locale, k);
        return typeof v === 'string' && v.trim() === '';
      });
      expect(blanks).toEqual([]);
    });
  }

  it('does not leave a Chinese value identical to its English counterpart', () => {
    // Identical strings almost always mean the key was copied and never
    // translated. Genuine exceptions are listed explicitly so that adding a new
    // one is a deliberate act rather than an oversight.
    const ALLOWED_IDENTICAL = new Set<string>([]);

    const untranslated: string[] = [];
    for (const locale of TARGET_LOCALES) {
      for (const key of englishKeys) {
        if (ALLOWED_IDENTICAL.has(key)) continue;
        const en = getTranslation('en', key);
        const target = getTranslation(locale, key);
        if (typeof en === 'string' && en === target && /[A-Za-z]{3,}/.test(en)) {
          untranslated.push(`${locale}:${key} = ${en}`);
        }
      }
    }
    expect(untranslated).toEqual([]);
  });
});

describe('getTranslation', () => {
  it('resolves a nested key', () => {
    expect(getTranslation('zh-hant', 'footer.hours')).toBe('門診時間');
  });

  it('returns the key itself for an unknown key rather than throwing', () => {
    // Callers render the result directly into markup, so throwing would break
    // the build and returning undefined would render "undefined" to a patient.
    // Returning the key is the least-bad option and callers rely on it.
    expect(getTranslation('en', 'nope.does.not.exist')).toBe('nope.does.not.exist');
  });

  it('returns the key itself for an unknown locale rather than throwing', () => {
    expect(getTranslation('fr', 'home')).toBe('home');
  });

  it('returns an empty string as-is, rather than treating it as missing', () => {
    // Shipped 2026-08-06. A new footer key used '' as its English value so that
    // English readers would see no marker. getTranslation ended in
    // `return value || key`, and '' is falsy — so it returned the KEY, and every
    // English page rendered the literal text "footer.englishOnly" in its footer.
    //
    // npm test was green throughout: the "no empty or whitespace-only values"
    // assertion above iterates TARGET_LOCALES, which is the two Chinese locales
    // only, so `en` was never in scope. It was found by grepping dist/.
    //
    // This asserts the function, not any particular key, so it does not depend
    // on a real key staying empty. `??` distinguishes "absent" from "empty";
    // `||` cannot. See docs/solutions/logic-errors/green-checks-that-cannot-see-the-defect.md
    const probe = '__empty_value_probe__';
    const en = translations.en as unknown as Record<string, unknown>;
    en[probe] = '';
    try {
      expect(getTranslation('en', probe)).toBe('');
    } finally {
      delete en[probe];
    }
  });
});

describe('no locale leaves a value empty, including en', () => {
  // The suite above checks emptiness for TARGET_LOCALES only. `en` being out of
  // scope is what let the empty `footer.englishOnly` through. The invariant is
  // true for the whole domain, so iterate the whole domain.
  for (const locale of LOCALES) {
    it(`${locale} has no empty or whitespace-only values`, () => {
      const blanks = keyPaths(translations[locale] as Record<string, unknown>).filter(
        (k) => String(getTranslation(locale, k)).trim() === '',
      );
      expect(blanks, 'empty values render as the key itself').toEqual([]);
    });
  }
});

describe('practiceLocalized covers every value in practice.ts', () => {
  for (const locale of LOCALES) {
    const pl = practiceLocalized[locale];

    it(`${locale} has a translation for every board certification specialty`, () => {
      const missing = practice.boardCertifications
        .map((c) => c.specialty)
        .filter((s) => !(s in pl.specialties));
      // This is the exact regression the fallback masks: a new certification
      // added to practice.ts silently renders in English on Chinese pages.
      expect(missing).toEqual([]);
    });

    it(`${locale} has a translation for every certifying board`, () => {
      const missing = practice.boardCertifications
        .map((c) => c.board)
        .filter((b) => !(b in pl.boards));
      expect(missing).toEqual([]);
    });

    it(`${locale} has a translation for every certification status`, () => {
      const missing = practice.boardCertifications
        .map((c) => c.currentStatus)
        .filter((s) => !(s in pl.certStatus));
      expect(missing).toEqual([]);
    });

    it(`${locale} lists one language label per entry in practice.languages`, () => {
      expect(pl.languages).toHaveLength(practice.languages.length);
    });
  }

  it('gives the Chinese locales actual Chinese for the localisable fields', () => {
    // Guards against a locale block being copy-pasted from `en` and left as-is,
    // which is how "License Renewed & Current" reached a Chinese page.
    const hasHan = (s: string) => /[一-鿿]/.test(s);
    for (const locale of TARGET_LOCALES) {
      const pl = practiceLocalized[locale];
      expect(hasHan(pl.school), `${locale} school`).toBe(true);
      for (const lang of pl.languages) {
        expect(hasHan(lang), `${locale} language label "${lang}"`).toBe(true);
      }
      for (const v of Object.values(pl.specialties)) {
        expect(hasHan(v), `${locale} specialty "${v}"`).toBe(true);
      }
      for (const v of Object.values(pl.certStatus)) {
        expect(hasHan(v), `${locale} certStatus "${v}"`).toBe(true);
      }
    }
  });

  // The licence-expiry test that lived here was removed on 2026-08-05 with the
  // licence fields themselves. It guarded practice.licenseExpiresDate leaking
  // onto a Chinese page as "July 31, 2028"; there is no such field any more, so
  // the test had nothing left to assert. See the comment block in practice.ts.
});

describe('service card labels are complete in every locale', () => {
  // The services page was narrowed on 2026-08-05 and these keys all changed at
  // once. A key present in `en` but missing from a Chinese locale makes
  // getTranslation return the key itself, so a patient sees the literal string
  // "serviceCards.citizenshipWaiver" where a service name should be.
  const SERVICE_KEYS = [
    'familyMedicine',
    'immigrationExams',
    'citizenshipWaiver',
    'medicalLegal',
    'stemCell',
  ] as const;

  for (const locale of LOCALES) {
    for (const key of SERVICE_KEYS) {
      it(`${locale} has a label for serviceCards.${key}`, () => {
        const value = getTranslation(locale, `serviceCards.${key}`);
        expect(value, `${locale} serviceCards.${key} fell through to the key`).not.toBe(
          `serviceCards.${key}`,
        );
        expect(value.length).toBeGreaterThan(0);
      });
    }
  }

  it('gives the Chinese locales actual Chinese service labels', () => {
    const hasHan = (s: string) => /[一-鿿]/.test(s);
    for (const locale of TARGET_LOCALES) {
      for (const key of SERVICE_KEYS) {
        const value = getTranslation(locale, `serviceCards.${key}`);
        expect(hasHan(value), `${locale} serviceCards.${key} = "${value}"`).toBe(true);
      }
    }
  });
});

describe('getPracticeLocalized', () => {
  it('returns the matching locale', () => {
    expect(getPracticeLocalized('zh-hant')).toBe(practiceLocalized['zh-hant']);
  });

  it('falls back to en for an unknown locale', () => {
    // Every caller immediately dereferences the result (pl.school), so
    // returning undefined would throw during the static build.
    expect(getPracticeLocalized('fr')).toBe(practiceLocalized.en);
    expect(getPracticeLocalized('')).toBe(practiceLocalized.en);
  });
});
