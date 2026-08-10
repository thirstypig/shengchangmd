import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations, practiceLocalized } from '@i18n/locales';
import { practice } from '@data/practice';

/**
 * The English on this site is AMERICAN English.
 *
 * The practice is in San Gabriel, California. Its patients file USCIS forms,
 * carry Medi-Cal cards and see American physicians. British spelling on a
 * California medical site reads as though the copy came from somewhere else,
 * which on a page about credentials is precisely the wrong impression.
 *
 * WHAT HAPPENED. Every English string added between 2026-07-28 and 2026-08-10
 * was written in British English by the agent writing it, and nobody noticed
 * until the site owner did — "I notice that we are using English, meaning
 * English that is used in England". Eighteen occurrences were live, including
 * `paediatric` and `gynaecology` in the patient-scope copy, `authorisation` in
 * the referrals sentence, and a heading reading "California Medical Licence"
 * two lines from a data field already named `medicalLicenseNumber`.
 *
 * WHY NOTHING CAUGHT IT. Every spelling was a correctly-spelled English word.
 * Typecheck, the build, all 104 tests and every review passed, because none of
 * them has an opinion about which side of the Atlantic the copy comes from.
 *
 * A NOTE ON THIS TEST'S DESIGN, since this repo has just spent a session
 * learning that wordlists are weak. Cross-locale parity works for Chinese
 * because zh-hant and zh-hans are two scripts for one body of copy, so a
 * structural invariant exists. **There is no equivalent here.** BrE and AmE
 * differ word by word with no derivable rule — the -ise/-ize split alone has
 * dozens of words spelled -ise in BOTH (advise, surprise, exercise, comprise,
 * franchise, promise), so a pattern rule would fire on correct copy.
 *
 * So this IS a list, and it is weaker than the register guard by construction.
 * It is honest about that: it catches what is on it. The one productive pattern
 * safe enough to include is `-isation`, which is British in every case that
 * matters here. When something slips past, add the word — do not conclude the
 * test works.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/** Strip comments so a note *about* a British spelling is not read as one. */
function strip(source: string): string {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Everything an English-reading patient can see: the English pages, plus the
 * English values in locales.ts and practice.ts.
 *
 * The Chinese page directories are excluded — they are locale-forked, and the
 * only Latin text in them is form numbers and institution names.
 */
function corpus(): string {
  const pages = readdirSync(join(SRC, 'pages'))
    .filter((f) => f.endsWith('.astro'))
    .map((f) => strip(readFileSync(join(SRC, 'pages', f), 'utf8')));
  return [
    ...pages,
    JSON.stringify(translations.en),
    JSON.stringify(practiceLocalized.en),
    JSON.stringify(practice),
  ].join('\n');
}

const CORPUS = corpus();

/**
 * British → American. Each entry is a whole word, matched case-insensitively at
 * word boundaries.
 *
 * Chosen for a medical practice site: the medical digraphs first, because those
 * are the ones a patient reads in the scope copy, then the legal/administrative
 * words this site actually uses.
 *
 * NOT included, deliberately, because they are correct or acceptable in
 * American English and a rule would fire on good copy: `advise`, `surprise`,
 * `exercise`, `comprise`, `franchise`, `promise`, `advertise`, `aesthetic`,
 * `catalogue`, `dialogue`, `glamour`, `toward(s)` — the last is a style
 * preference, not a spelling.
 */
const BRITISH: Array<[string, string]> = [
  // Medical — the highest-visibility ones on this site
  ['paediatric', 'pediatric'],
  ['paediatrics', 'pediatrics'],
  ['gynaecology', 'gynecology'],
  ['gynaecological', 'gynecological'],
  ['obstetrics', 'obstetrics'], // same both sides; here so the pair reads complete
  ['orthopaedic', 'orthopedic'],
  ['anaesthesia', 'anesthesia'],
  ['anaemia', 'anemia'],
  ['haematology', 'hematology'],
  ['haemorrhage', 'hemorrhage'],
  ['oesophagus', 'esophagus'],
  ['diarrhoea', 'diarrhea'],
  ['foetal', 'fetal'],
  ['tumour', 'tumor'],
  ['immunisation', 'immunization'],
  // Legal and administrative — what this site's copy is full of
  ['licence', 'license'],
  ['licences', 'licenses'],
  ['practise', 'practice'],
  ['practised', 'practiced'],
  ['practising', 'practicing'],
  ['defence', 'defense'],
  ['offence', 'offense'],
  ['authorisation', 'authorization'],
  ['authorised', 'authorized'],
  ['naturalisation', 'naturalization'],
  ['organisation', 'organization'],
  ['organised', 'organized'],
  ['recognised', 'recognized'],
  ['specialised', 'specialized'],
  ['enquiry', 'inquiry'],
  ['enquiries', 'inquiries'],
  ['programme', 'program'],
  // General prose
  ['colour', 'color'],
  ['behaviour', 'behavior'],
  ['honour', 'honor'],
  ['honoured', 'honored'],
  ['favour', 'favor'],
  ['neighbour', 'neighbor'],
  ['labour', 'labor'],
  ['centre', 'center'],
  ['metre', 'meter'],
  ['theatre', 'theater'],
  ['fibre', 'fiber'],
  ['whilst', 'while'],
  ['amongst', 'among'],
  ['grey', 'gray'],
  ['ageing', 'aging'],
  ['judgement', 'judgment'],
  ['travelling', 'traveling'],
  ['cancelled', 'canceled'],
  ['labelled', 'labeled'],
  ['counsellor', 'counselor'],
  ['fulfil', 'fulfill'],
  ['instalment', 'installment'],
  ['skilful', 'skillful'],
];

/**
 * The one safe productive pattern. `-isation` is British in every case this
 * site would plausibly use — organisation, authorisation, naturalisation,
 * immunisation, specialisation, hospitalisation, localisation. Included so the
 * list does not have to have thought of the specific noun.
 */
const ISATION = /\b\w+isation(s)?\b/gi;

describe('the American English guard is actually reading the site', () => {
  it('builds a non-trivial corpus', () => {
    // A guard that silently reads nothing passes forever. This repo shipped 15
    // such tests once and quoted the passing count as evidence.
    expect(CORPUS.length).toBeGreaterThan(10_000);
    expect(CORPUS).toContain(practice.doctorName);
  });

  it('strips comments, so a note explaining a British spelling is not flagged', () => {
    expect(strip("{/* paediatric is British */}\n// licence too\nconst a = 1;")).not.toMatch(
      /paediatric|licence/,
    );
  });

  it('has a list containing the words that actually shipped', () => {
    const words = BRITISH.map(([b]) => b);
    expect(words).toEqual(
      expect.arrayContaining(['paediatric', 'gynaecology', 'licence', 'authorisation']),
    );
  });
});

describe('user-facing English is American English', () => {
  it.each(BRITISH.filter(([b, a]) => b !== a))('does not use "%s"', (british, american) => {
    const hits = CORPUS.match(new RegExp(`\\b${british}\\b`, 'gi')) ?? [];
    expect(
      hits,
      `British spelling on a California medical site. Use "${american}".`,
    ).toEqual([]);
  });

  it('uses no -isation noun anywhere', () => {
    const hits = [...new Set(CORPUS.match(ISATION) ?? [])];
    expect(
      hits,
      'British -isation. American English uses -ization (organization, authorization, naturalization).',
    ).toEqual([]);
  });
});
