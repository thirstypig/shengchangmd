import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations, practiceLocalized } from '@i18n/locales';

/**
 * Guards both Chinese locales against drifting into MAINLAND Mandarin.
 *
 * The rule, from CLAUDE.md and .claude/skills/trilingual-content/SKILL.md: both
 * Chinese locales are Taiwan Mandarin. Simplified here is a script, not a
 * dialect — Taiwan wording written in simplified characters. The readership is
 * the San Gabriel Valley Taiwanese community and Dr. Chang trained at National
 * Taiwan University.
 *
 * WHAT ACTUALLY SHIPPED. zh-hant used 醫師 exclusively (40 in the pages, 0 醫生)
 * while zh-hans used 医生 31 times. That is not a script conversion — every
 * conversion table maps 醫師 to 医师 — it is a different word, and it meant a
 * Taiwanese reader who clicked 简体 was addressed in Beijing's register on every
 * page of the site. Root cause and history:
 * docs/solutions/logic-errors/simplified-is-a-script-not-a-dialect.md
 *
 * WHY THE OTHER GUARDS CANNOT SEE IT. locale-coverage.test.ts imports
 * `translations` and never opens an .astro file, and its cross-locale assertions
 * are structural — key sets and emptiness. Its "not identical to English" check
 * needs Latin letters to fire, and its "is this Chinese?" check is /[一-鿿]/,
 * which 医生 satisfies. It asks *is this Chinese*, never *is this Taiwan
 * Chinese*. shared-component-labels.test.ts matches literal accessibility
 * attributes, not prose. Nothing in the repo compares zh-hant to zh-hans, and
 * that is the axis the defect lives on.
 *
 * TWO ASSERTIONS, and the second is the one that generalises.
 *
 *  1. BANNED FORMS — a table of mainland words. Catches only what someone
 *     thought to list, which is exactly how this defect survived two passes:
 *     PR #27 verified "no 信息/网络/软件/视频/移动/质量/数据/健保 anywhere in
 *     src" — true — and shipped with 31 医生 live, because 医生 was not on the
 *     list. PR #30 fixed 医生, verified against the same list, and shipped with
 *     seven more concepts drifted.
 *
 *  2. CROSS-LOCALE PARITY — for each concept, the Taiwan form's count in
 *     zh-hant must equal its simplified twin's count in zh-hans. The two locales
 *     are script conversions of one body of copy, so any inequality means one
 *     locale says something the other does not. This needs no vocabulary
 *     knowledge at all: it flags the SHAPE of the defect rather than an
 *     instance, so it catches words nobody listed. It is what found 普通话,
 *     身份, 筛查, 记录, 保险范围, 事先授权 and 就诊 after two hand passes had
 *     reported clean.
 *
 * This is not a fluency check and must never be quoted as one. Both Chinese
 * locales are `reviewed: false` and therefore noindex, and that gate — a fluent
 * reader — is the actual safety mechanism.
 *
 * VERIFIED BY MUTATION, per CLAUDE.md — a test not seen failing is not evidence:
 *
 *   医师 -> 医生 across zh-hans          RED: banned + parity (the original defect)
 *   联络 -> 联系 across zh-hans          RED: banned + parity
 *   预约就诊 -> 挂号就诊, one page       RED: parity ONLY, banned stayed green
 *   健保 inserted into a locale value    RED: the 健保 assertion
 *   corpus() returns []                  RED: the anti-vacuity guard
 *   REGISTER emptied                     RED: the table guard (101 -> 83 tests)
 *   strip() made identity, with a
 *     zh-hant-only comment added         RED: parity broke on a COMMENT,
 *                                             proving the stripping is
 *                                             load-bearing rather than tidiness
 *
 * The third one is the point of the whole file. 预约 has no banned-word entry —
 * it is in the table purely to be counted — so only parity caught it. That is
 * the difference between a rule that knows the answer and a rule that knows the
 * shape, and it is why a wordlist let this defect through twice.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
const CHINESE_LOCALES = ['zh-hant', 'zh-hans'] as const;
type ChineseLocale = (typeof CHINESE_LOCALES)[number];

/**
 * Strip comments before counting.
 *
 * Load-bearing, not tidiness: every write-up and in-file note here quotes the
 * offending word while explaining it. HeroSection.astro's note names 医生 and
 * both about.astro files name 護理/护理. Counting those would fail this test on
 * the documentation of its own fix, and a test that fails on its own rationale
 * gets deleted rather than obeyed.
 */
function strip(source: string): string {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Everything a reader of `locale` can see, as one string: the locale-forked
 * pages plus that locale's own subtree of locales.ts.
 *
 * Reading locales.ts is not optional. `普通话` sat in
 * practiceLocalized['zh-hans'].languages and rendered under the homepage
 * heading 看诊语言 — it told a patient which languages the office speaks, in the
 * PRC's word for the language — and a pages-only sweep could not see it.
 *
 * It also means anything later moved OUT of a shared component and INTO
 * locales.ts lands in this corpus for free. That is the payoff of the pending
 * HeroSection/StickyCallBar/Header refactor.
 */
function corpus(locale: ChineseLocale): string {
  const dir = join(SRC, 'pages', locale);
  const pages = readdirSync(dir)
    .filter((f) => f.endsWith('.astro'))
    .map((f) => strip(readFileSync(join(dir, f), 'utf8')));
  return [
    ...pages,
    JSON.stringify(translations[locale]),
    JSON.stringify(practiceLocalized[locale]),
  ].join('\n');
}

const CORPUS: Record<ChineseLocale, string> = {
  'zh-hant': corpus('zh-hant'),
  'zh-hans': corpus('zh-hans'),
};

const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

interface RegisterTerm {
  gloss: string;
  /** The same Taiwan word in the two scripts — that is what makes parity meaningful. */
  hant: string;
  hans: string;
  /** Mainland forms for this concept, per script. May be empty: some rows exist only to be counted. */
  banned: Partial<Record<ChineseLocale, string>>;
  why: string;
}

/**
 * Every row here is a word that ACTUALLY DRIFTED on this site, or one the
 * project's own vocabulary table names. Adding a row is cheap; deleting one
 * needs a reason.
 *
 * DELIBERATELY ABSENT: 項目/项目. Both trilingual skills mark 項目 as the mainland
 * form — for "project" (專案) and "programme of study" (課程). This site uses it
 * in neither sense: 診療項目, 篩檢項目, 服務項目 all mean "item", which is
 * ordinary Taiwan medical usage.
 *
 * VERIFIED, not assumed, on 2026-08-10 against .tw sources: 診療項目 is the
 * heading used by 衛生福利部苗栗醫院 (a Ministry of Health and Welfare hospital)
 * and appears as a formal term throughout the Taiwan Medical Association's
 * National Health Insurance payment-standard document
 * (tma.tw/files/meeting/N201981685840_002.pdf), alongside many Taiwanese
 * clinics. A banned-word rule is context-blind and would fire ten times per
 * locale on correct copy. The skills' tables are translator's guides; only rows
 * wrong in EVERY context belong in a lint rule.
 */
const REGISTER: RegisterTerm[] = [
  {
    gloss: 'doctor / physician',
    hant: '醫師',
    hans: '医师',
    banned: { 'zh-hant': '醫生', 'zh-hans': '医生' },
    why: 'THE defect. 醫師 is Taiwan formal medical register; 医生 is the mainland default. 31 instances shipped.',
  },
  {
    gloss: 'to contact',
    hant: '聯絡',
    hans: '联络',
    banned: { 'zh-hant': '聯繫', 'zh-hans': '联系' },
    why: 'The zh-hans nav label said 联络 while the contact heading said 联系 — the site disagreed with itself.',
  },
  {
    gloss: 'Mandarin (the language)',
    hant: '國語',
    hans: '国语',
    banned: { 'zh-hant': '普通話', 'zh-hans': '普通话' },
    why: 'Survived two hand passes. One instance rendered under the homepage 看诊语言 heading.',
  },
  {
    gloss: 'identity / status',
    hant: '身分',
    hans: '身分',
    banned: { 'zh-hant': '身份', 'zh-hans': '身份' },
    why: 'Taiwan writes 身分調整, 身分證件. Same characters in both scripts, so the pair is identical.',
  },
  {
    gloss: 'screening',
    hant: '篩檢',
    hans: '筛检',
    banned: { 'zh-hant': '篩查', 'zh-hans': '筛查' },
    why: 'Taiwan says 篩檢; 筛查 is the mainland form. Shipped in the immigration-exam copy.',
  },
  {
    gloss: 'record (noun)',
    hant: '紀錄',
    hans: '纪录',
    banned: { 'zh-hant': '記錄', 'zh-hans': '记录' },
    why: 'Taiwan uses 紀錄 for the noun and 記錄 for the verb. 疫苗紀錄 is a noun.',
  },
  {
    gloss: 'information',
    hant: '資訊',
    hans: '资讯',
    banned: { 'zh-hant': '信息', 'zh-hans': '信息' },
    why: 'Fixed once already in 8e3f980 — 信息 had reached four places in zh-hans.',
  },
  {
    gloss: 'health insurance benefit',
    hant: '給付',
    hans: '给付',
    banned: {},
    why: 'Parity only. zh-hant said 保險給付 in five places where zh-hans said 保险范围.',
  },
  {
    gloss: 'network / internet',
    hant: '網路',
    hans: '网路',
    banned: { 'zh-hant': '網絡', 'zh-hans': '网络' },
    why: 'Skill table. The plan document itself drafted 網絡 once; caught in review.',
  },
  {
    gloss: 'data',
    hant: '資料',
    hans: '资料',
    banned: { 'zh-hant': '數據', 'zh-hans': '数据' },
    why: 'Skill table. Currently clean; listed so it stays that way.',
  },
  {
    gloss: 'software',
    hant: '軟體',
    hans: '软体',
    banned: { 'zh-hant': '軟件', 'zh-hans': '软件' },
    why: 'Skill table.',
  },
  {
    gloss: 'video',
    hant: '影片',
    hans: '影片',
    banned: { 'zh-hant': '視頻', 'zh-hans': '视频' },
    why: 'Skill table.',
  },
  {
    gloss: 'quality',
    hant: '品質',
    hans: '品质',
    banned: { 'zh-hant': '質量', 'zh-hans': '质量' },
    why: 'Skill table.',
  },
  { gloss: 'clinic', hant: '診所', hans: '诊所', banned: {}, why: 'Parity only.' },
  { gloss: 'appointment', hant: '預約', hans: '预约', banned: {}, why: 'Parity only.' },
  { gloss: 'clinic hours', hant: '門診', hans: '门诊', banned: {}, why: 'Parity only.' },
  { gloss: 'to attend clinic', hant: '看診', hans: '看诊', banned: {}, why: 'Parity only — zh-hans once said 就诊 in a sentence where zh-hant said 看診.' },
  { gloss: 'prior (authorization)', hant: '事前', hans: '事前', banned: {}, why: 'Parity only — zh-hans once said 事先授权 against 事前授權.' },
];

/**
 * `健保` is Taiwan's National Health Insurance, which does not operate in
 * California. It is not a register question — it is a false statement about
 * what this practice accepts — so it is banned outright in every locale rather
 * than paired with a Taiwan equivalent.
 */
const NEVER_ANYWHERE = '健保';

/**
 * Concepts whose counts may legitimately differ between the locales. Each entry
 * needs a reason the divergence is CORRECT, not a note that fixing it is
 * inconvenient. Empty on purpose: there is no such case today, and seeding an
 * exemption map with the defect it exists to prevent is how a hazard becomes
 * permanent.
 */
const PARITY_EXEMPT = new Map<string, string>([
  // ['看診', 'reason the two locales genuinely say this a different number of times'],
]);

describe('the register guard is actually reading the site', () => {
  // 15 tests once shipped here asserting serviceCards labels that no page
  // rendered, and "42 passing" was quoted as evidence several times before
  // anyone noticed. If the corpus builder or the counter silently breaks, every
  // assertion below passes against an empty string. Prove both work first.
  it('builds a non-trivial corpus for each Chinese locale', () => {
    for (const locale of CHINESE_LOCALES) {
      expect(CORPUS[locale].length, `${locale} corpus is empty`).toBeGreaterThan(5000);
      expect(/[一-鿿]/.test(CORPUS[locale]), `${locale} corpus contains no Han`).toBe(true);
    }
  });

  it('reads locales.ts, not only the pages', () => {
    // 普通话 hid in practiceLocalized.languages, invisible to a pages-only sweep.
    expect(CORPUS['zh-hant']).toContain(practiceLocalized['zh-hant'].school);
    expect(CORPUS['zh-hans']).toContain(practiceLocalized['zh-hans'].school);
  });

  it('strips comments, so a note explaining a banned word is not read as one', () => {
    const sample = "{/* 醫生 is wrong */}\n// 医生 is wrong\nconst a = '醫師';";
    expect(count(strip(sample), '醫生')).toBe(0);
    expect(count(strip(sample), '医生')).toBe(0);
    expect(count(strip(sample), '醫師')).toBe(1);
  });

  it('counts every occurrence, not every line', () => {
    expect(count('醫師與醫師', '醫師')).toBe(2);
    expect(count('nothing here', '醫師')).toBe(0);
  });

  it('has a table containing the defect that occasioned it', () => {
    // Guards the table itself: a refactor that empties REGISTER would make every
    // loop below iterate nothing and still report green.
    expect(REGISTER.length).toBeGreaterThan(10);
    expect(REGISTER.map((t) => t.hant)).toEqual(expect.arrayContaining(['醫師', '聯絡', '國語']));
  });
});

describe('neither Chinese locale uses a mainland form', () => {
  for (const locale of CHINESE_LOCALES) {
    it(`${locale} contains no banned mainland vocabulary`, () => {
      const offenders = REGISTER.flatMap((term) => {
        const bad = term.banned[locale];
        if (!bad) return [];
        const hits = count(CORPUS[locale], bad);
        if (hits === 0) return [];
        const want = locale === 'zh-hant' ? term.hant : term.hans;
        return [`"${bad}" x${hits} — use "${want}" (${term.gloss}). ${term.why}`];
      });
      expect(
        offenders,
        'Both Chinese locales are Taiwan Mandarin. Simplified is a script, not a dialect.',
      ).toEqual([]);
    });

    it(`${locale} never writes 健保`, () => {
      expect(
        count(CORPUS[locale], NEVER_ANYWHERE),
        '健保 is Taiwan National Health Insurance, which does not operate in California. ' +
          'A patient reading it would think this practice accepts it.',
      ).toBe(0);
    });
  }
});

describe('the two Chinese locales are one body of copy in two scripts', () => {
  it.each(REGISTER.map((t) => [t.gloss, t] as const))(
    '%s appears equally often in both locales',
    (_gloss, term) => {
      if (PARITY_EXEMPT.has(term.hant)) return;
      const hant = count(CORPUS['zh-hant'], term.hant);
      const hans = count(CORPUS['zh-hans'], term.hans);
      expect(
        { 'zh-hant': hant, 'zh-hans': hans },
        `"${term.hant}"/"${term.hans}" (${term.gloss}) diverged. The two locales are ` +
          `script conversions of one body of copy, so a count mismatch means one ` +
          `locale says something the other does not — either a mainland form took ` +
          `the other slot, or a sentence exists in only one locale. Find the ` +
          `sentence; do not pad the count. If the divergence is genuinely correct, ` +
          `add "${term.hant}" to PARITY_EXEMPT with the reason.`,
      ).toEqual({ 'zh-hant': hant, 'zh-hans': hant });
    },
  );
});

/**
 * The parity table above is described as structural, and it is — but its DOMAIN
 * is still a hand-maintained list of concepts, so it inherits one level up the
 * exact weakness it was built to remove. It missed 導覽/選單: zh-hans said
 * 打开或关闭导航菜单 where zh-hant said 開啟或關閉導覽選單, i.e. mainland 导航
 * and 菜单 (in Taiwan 菜單 is a restaurant menu) in an aria-label — the text a
 * screen-reader user hears. 198 tests passed either way.
 *
 * This assertion needs no table at all. The two locales are one body of copy in
 * two scripts, so pairing them by key and zipping character by character yields
 * a Traditional-to-Simplified map DERIVED from the corpus. A traditional
 * character always has exactly one simplified counterpart, so if the corpus
 * shows one mapping to two different characters, the two locales used different
 * WORDS at that position. 覽 mapped to 览 in one string and 航 in another.
 *
 * Its coverage grows with the corpus rather than with anyone's memory, which is
 * the property the table lacks. It is not complete: a character that occurs
 * once has nothing to contradict, which is why 選 -> 菜 slipped past it while
 * 覽 -> 航 did not. Complete would need a real conversion table, which is not
 * available offline here.
 */
const flattenStrings = (value: unknown, prefix = ''): [string, string][] =>
  typeof value === 'string'
    ? [[prefix, value]]
    : Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
        flattenStrings(v, prefix ? `${prefix}.${k}` : k),
      );

/** 著 is the one character with two legitimate simplified forms (着 / 著). */
const MULTI_FORM_EXEMPT = new Set(['著']);

describe('a Traditional-to-Simplified map derived from the copy itself', () => {
  const hant = new Map(
    flattenStrings(translations['zh-hant']).concat(flattenStrings(practiceLocalized['zh-hant'])),
  );
  const hans = new Map(
    flattenStrings(translations['zh-hans']).concat(flattenStrings(practiceLocalized['zh-hans'])),
  );

  // Guards the derivation itself, in the same spirit as "finds the nested blocks
  // to check" in source-integrity. Both assertions below iterate a map and expect
  // an empty list of problems, so BOTH pass when the map is empty — replacing the
  // zh-hant construction above with [] left all 29 tests green while checking
  // nothing. A rename or a flattening of the locale shape would do the same
  // silently. The floor is deliberately well under the real count so ordinary
  // copy edits never trip it; it only catches the map collapsing.
  it('derives a non-trivial map, so the assertions below cannot pass vacuously', () => {
    const paired = [...hant.keys()].filter((k) => hans.has(k));
    expect(hant.size, 'zh-hant produced no strings — the locale shape changed').toBeGreaterThan(50);
    expect(hans.size, 'zh-hans produced no strings — the locale shape changed').toBeGreaterThan(50);
    expect(paired.length, 'no key exists in both locales, so nothing is compared').toBeGreaterThan(50);
  });

  it('sees a conversion it must see, proving the zip reads real copy', () => {
    // 醫 -> 医 is the most load-bearing character on the site: it is in the
    // doctor's title on every page. If the zip is running at all, it is here.
    const pairs = new Set<string>();
    for (const [key, traditional] of hant) {
      const simplified = hans.get(key);
      if (simplified === undefined) continue;
      const a = [...traditional];
      const b = [...simplified];
      if (a.length !== b.length) continue;
      a.forEach((ch, i) => pairs.add(`${ch}${b[i]}`));
    }
    expect([...pairs], 'the derived map never saw 醫 -> 医').toContain('醫医');
  });

  it('pairs every keyed string at equal length, so the zip below is valid', () => {
    const unalignable = [...hant.keys()]
      .filter((k) => hans.has(k))
      .filter((k) => [...hant.get(k)!].length !== [...hans.get(k)!].length)
      .map((k) => `${k}: zh-hant ${[...hant.get(k)!].length} chars, zh-hans ${[...hans.get(k)!].length}`);
    expect(
      unalignable,
      'Script conversion is one character to one character, so a length difference ' +
        'for the same key means the two locales are not the same sentence. It also ' +
        'silently removes that key from the conflict check below, so this is ' +
        'asserted rather than skipped.',
    ).toEqual([]);
  });

  it('never maps one traditional character to two different simplified ones', () => {
    const seen = new Map<string, Map<string, string[]>>();
    for (const [key, traditional] of hant) {
      const simplified = hans.get(key);
      if (simplified === undefined) continue;
      const a = [...traditional];
      const b = [...simplified];
      if (a.length !== b.length) continue;
      a.forEach((ch, i) => {
        if (!/[\u4e00-\u9fff]/.test(ch) || MULTI_FORM_EXEMPT.has(ch)) return;
        if (!seen.has(ch)) seen.set(ch, new Map());
        const targets = seen.get(ch)!;
        if (!targets.has(b[i])) targets.set(b[i], []);
        targets.get(b[i])!.push(key);
      });
    }

    const conflicts = [...seen.entries()]
      .filter(([, targets]) => targets.size > 1)
      .map(
        ([ch, targets]) =>
          `${ch} -> ` +
          [...targets.entries()].map(([to, keys]) => `${to} (${keys.join(', ')})`).join('  vs  '),
      );

    expect(
      conflicts,
      'One traditional character resolved to two different simplified characters, ' +
        'so at that position the two locales say different words. Read both ' +
        'strings and make them the same sentence; do not exempt the character ' +
        'unless it genuinely has two simplified forms.',
    ).toEqual([]);
  });
});
