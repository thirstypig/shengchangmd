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
