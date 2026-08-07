import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { practice } from '@data/practice';
import { translations } from '@i18n/locales';

/**
 * Guards against facts being stored in more than one place.
 *
 * Every test here encodes a defect that actually shipped on this site — see
 * docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md.
 * On 2026-08-05 the same failure appeared six times in one session: a fact
 * copied into a second location, corrected in one copy, left wrong in the rest.
 *
 * These complement scripts/verify-build.mjs rather than repeat it. That script
 * inspects the built output; these inspect the source, so they fail in `npm
 * test` — before the build — and name the offending file.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(astro|ts)$/.test(entry) ? [full] : [];
  });
}

const FILES = sourceFiles();
const rel = (f: string) => relative(SRC, f);
const read = (f: string) => readFileSync(f, 'utf8');

/** Strip comments so an explanatory note about a defect is not read as the defect. */
function code(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('practice.address stays derived from addressParts', () => {
  it('composes the one-line address from the parts', () => {
    // addressParts exists so the prose address and the JSON-LD PostalAddress
    // are one fact. Editing `address` directly re-creates the split that put a
    // hardcoded streetAddress in JsonLd.astro twice.
    const { street, locality, region, postalCode } = practice.addressParts;
    expect(practice.address).toBe(`${street}, ${locality}, ${region} ${postalCode}`);
  });

  it('keeps every part non-empty, since JSON-LD publishes each field separately', () => {
    for (const [key, value] of Object.entries(practice.addressParts)) {
      expect(value.trim(), `addressParts.${key} is empty`).not.toBe('');
    }
  });
});

describe('practice data is not restated anywhere in src/', () => {
  const DATA_FILE = 'data/practice.ts';

  it('no file other than practice.ts contains the street address', () => {
    // Shipped: JsonLd.astro held two copies of '330 W. Las Tunas Drive, Suite 3',
    // and both Chinese location pages baked the full address into a maps URL.
    const street = practice.addressParts.street;
    const offenders = FILES.filter((f) => rel(f) !== DATA_FILE && code(f).includes(street));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('no file other than practice.ts contains the office phone number', () => {
    const digits = practice.phone.replace(/\D/g, '');
    const offenders = FILES.filter((f) => {
      if (rel(f) === DATA_FILE) return false;
      const c = code(f);
      return c.includes(practice.phone) || new RegExp(`\\b${digits}\\b`).test(c);
    });
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe('map URLs are derived, never hardcoded', () => {
  it('no source file embeds a Google place id or a pre-baked embed URL', () => {
    // Shipped twice: a fabricated `maps/embed?pb=…` URL carrying invented place
    // ids (0x…f8f8f8f8f9:0x1234567890, 4v1234567890). It was corrected on the
    // English page and survived on both Chinese pages for a further week.
    // CLAUDE.md: "Map URLs → derive from practice.address, never hardcode
    // coordinates or Google place IDs".
    const banned = [/maps\/embed\?pb=/, /!1s0x[0-9a-f]+/i, /\b4v\d{10,}/];
    const offenders = FILES.filter((f) => banned.some((re) => re.test(code(f))));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('no source file hardcodes latitude/longitude for the office', () => {
    // Shipped: JsonLd.astro published geo 34.0853 / -118.1085, hardcoded and
    // never verified. Structured-data geo places the map pin, so a wrong value
    // sends a patient to the wrong building.
    const offenders = FILES.filter((f) => /\b(latitude|longitude)\s*:/.test(code(f)));
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe('office hours are stored once and translated, never restated', () => {
  const DATA_FILE = 'data/practice.ts';

  /** Every run of digits, in order: '9:00 AM – 1:00 PM' -> ['9','00','1','00'] */
  const clockDigits = (s: string) => s.match(/\d+/g) ?? [];

  it('no file other than practice.ts states a clock time', () => {
    // Shipped: the weekday hours lived in practice.ts, in locales.ts (en), and
    // as a bare literal in hours.astro — three English copies of one fact. The
    // scaffold said 6:00 PM, it was corrected to 12:00 PM, and the owner then
    // confirmed 1:00 PM. Each correction had to find every copy, and /hours/
    // was missed both times.
    //
    // This deliberately does NOT compare the time to practice.hours.weekday.
    // An earlier version did, and it passed while hours.astro still read
    // "9:00 AM – 12:00 PM" — a copy only becomes dangerous once it has drifted,
    // so matching against the current value excuses exactly the defect that
    // matters. Chinese locale strings use 上午/下午 and no AM/PM, and are
    // checked for digit parity by the test below.
    //
    // This rule is deliberately broad: it flags ANY Latin-script clock time in
    // src/ outside practice.ts, not just office hours, so an unrelated future
    // sentence like "arrive before your 2:00 PM appointment" will also fail
    // here. A narrower rule is what let the stale copy through in the first
    // place. If that happens, narrow this rule deliberately rather than
    // widening practice.ts to mean something it doesn't.
    const offenders = FILES.filter(
      (f) => rel(f) !== DATA_FILE && /\d{1,2}:\d{2}\s*(AM|PM)/i.test(code(f)),
    );
    expect(
      offenders.map(rel),
      'states a clock time outside practice.ts — if this is prose and not the office hours, narrow this rule deliberately',
    ).toEqual([]);
  });

  it('no file other than practice.ts hardcodes a 24-hour opening time', () => {
    // Shipped: JsonLd.astro held opens '09:00' / closes '12:00' at two sites,
    // rendered on every page in every locale by BaseLayout. The AM/PM guard
    // above cannot see them — they carry no meridiem — so a correction that
    // fixed all five visible copies still left the structured data that Google,
    // Apple Maps and voice assistants read saying the office closed at noon.
    const offenders = FILES.filter(
      (f) => rel(f) !== DATA_FILE && /\b(opens|closes)\s*:\s*['"`]\d{1,2}:\d{2}/.test(code(f)),
    );
    expect(offenders.map(rel), 'hardcodes a 24-hour opening time').toEqual([]);
  });

  it('every locale states the same clock times as practice.ts', () => {
    // A Chinese translation is not a duplicate fact, but it can still drift.
    // Comparing digits rather than text lets the wording differ while the times
    // cannot: '上午9:00 – 下午1:00' and 'Monday–Friday 9:00 AM – 1:00 PM' both
    // yield ['9','00','1','00'].
    const expected = clockDigits(practice.hours.weekday);
    expect(expected.length, 'practice.hours.weekday states no times').toBeGreaterThan(0);

    for (const [locale, t] of Object.entries(translations)) {
      expect(clockDigits((t as { hoursWeekday: string }).hoursWeekday), `${locale}.hoursWeekday`)
        .toEqual(expected);
    }
  });
});

describe('locale data is actually consumed by a page', () => {
  it('every serviceCards key is read by at least one page', () => {
    // This test exists because of a mistake made while fixing the others.
    // Fifteen tests were added asserting serviceCards labels existed in every
    // locale. They passed, and they measured nothing: the homepage cards used
    // hardcoded strings, so no page read serviceCards at all. A test that
    // cannot fail for a real reason is worse than no test, because "42 passing"
    // then gets quoted as evidence.
    const keys = Object.keys(translations.en.serviceCards);
    expect(keys.length).toBeGreaterThan(0);

    const allCode = FILES.map(code).join('\n');
    const unread = keys.filter((k) => !allCode.includes(`serviceCards.${k}`));
    expect(unread, 'defined in locales.ts but rendered by no page').toEqual([]);
  });
});
