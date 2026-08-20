import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Computes WCAG contrast from the token block in global.css.
 *
 * Every other check in this repo reads source or built HTML. None of them
 * resolves a color, which is why `.hover:text-primary-700` shipped at 1.67:1 on
 * the practice's primary call to action — the phone number — and was found by
 * eye, on the third pass. Arithmetic on the declared tokens is not a substitute
 * for reading the computed value out of a browser, but it is the part a machine
 * can own.
 *
 * It also pins the redesign's central claim: --brand keeps its hue between
 * themes. The palette this replaced swung deep red (#8a2f3c, hue ~351) to amber
 * (#e8b96b, hue ~38) — a 47 degree gap and a different color entirely. Both of
 * this repo's worst UI bugs trace to that swing.
 */

const CSS = readFileSync(
  fileURLToPath(new URL('../../src/styles/global.css', import.meta.url)),
  'utf8'
);

/** The first `:root { … }` block, and the first dark block. Tokens only. */
function tokenBlock(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`no ${selector} block in global.css`);
  const open = CSS.indexOf('{', start);
  let depth = 0;
  let end = CSS.length;
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  const out: Record<string, string> = {};
  for (const m of CSS.slice(open, end).matchAll(/(--[a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const LIGHT = tokenBlock(':root');
const DARK = tokenBlock("html[data-theme='dark']");

function rgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb(hex).map((v) => f(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue in degrees, 0–360. Achromatic colors return 0. */
function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** Smallest angle between two hues, so 359 and 1 are 2 degrees apart. */
function hueGap(a: string, b: string): number {
  const d = Math.abs(hue(a) - hue(b)) % 360;
  return d > 180 ? 360 - d : d;
}

describe('the token blocks parse, so nothing below can pass vacuously', () => {
  it('reads both blocks', () => {
    expect(Object.keys(LIGHT).length).toBeGreaterThan(10);
    expect(Object.keys(DARK).length).toBeGreaterThan(10);
  });

  it('defines every token in both themes', () => {
    const missing = Object.keys(LIGHT).filter((t) => !(t in DARK));
    expect(
      missing,
      'a token defined in light but not dark silently keeps its light value on a dark page'
    ).toEqual([]);
  });
});

describe('--brand keeps its hue between themes', () => {
  it('does not swing to a different color family', () => {
    expect(hueGap(LIGHT['--brand'], DARK['--brand'])).toBeLessThan(25);
  });
});

describe('--brand-fill is a surface, and does not invert', () => {
  /*
    --brand and --brand-fill exist separately because text and fill want
    opposite lightness in dark mode. --brand has to be LIGHT so it reads as
    text on a dark page; a hero filled with that same light rose reads as a
    pink banner. Splitting them is what fixed the insurance hero, which the
    contrast sweep passed at 8.32:1 while looking wrong.

    So the assertions here are about legibility ON the fill, plus the fill
    staying dark enough in both themes to still be the brand rather than a
    tint.
  */

  it('takes its label at AA in both themes', () => {
    expect(contrast(LIGHT['--on-brand-fill'], LIGHT['--brand-fill'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK['--on-brand-fill'], DARK['--brand-fill'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(LIGHT['--on-brand-fill'], LIGHT['--brand-fill-strong'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK['--on-brand-fill'], DARK['--brand-fill-strong'])).toBeGreaterThanOrEqual(4.5);
  });

  it('stays distinguishable from the page it sits on', () => {
    // WCAG 1.4.11 asks 3:1 for a control's boundary against its background.
    expect(contrast(DARK['--brand-fill'], DARK['--surface'])).toBeGreaterThanOrEqual(3);
    expect(contrast(LIGHT['--brand-fill'], LIGHT['--surface'])).toBeGreaterThanOrEqual(3);
  });

  it('stays dark enough to be the brand rather than a tint', () => {
    // The regression this exists for: pointing --brand-fill at --brand, which
    // in dark mode is a light rose and turns a full-width hero pink. A fill
    // lighter than its own label is the signature of that mistake.
    expect(luminance(DARK['--brand-fill'])).toBeLessThan(luminance(DARK['--on-brand-fill']));
    expect(luminance(LIGHT['--brand-fill'])).toBeLessThan(luminance(LIGHT['--on-brand-fill']));
    expect(DARK['--brand-fill']).not.toBe(DARK['--brand']);
  });

  it('keeps the brand hue across the split', () => {
    expect(hueGap(LIGHT['--brand-fill'], LIGHT['--brand'])).toBeLessThan(25);
    expect(hueGap(DARK['--brand-fill'], DARK['--brand'])).toBeLessThan(25);
  });
});

describe('--seal, the name chop, stays legible and stays cinnabar', () => {
  /*
    The seal is painted onto an alpha mask via background-color, so --seal is
    the only thing deciding whether the practice's mark is visible. It is a
    non-text graphic, which WCAG 1.4.11 puts at 3:1, but it is held to 4.5
    here for two reasons: it is the primary identity mark, and it renders at
    44px in the header where the thin seal-script strokes lose effective
    contrast well before the arithmetic does.

    As supplied, the artwork could not meet this at all — its darkest ink was
    2.34:1 on the dark ground and its paper 15.78:1. See
    docs/solutions/ui-bugs/raster-logo-cannot-serve-two-themes.md
  */

  it('clears 4.5:1 on the surface it sits on, in both themes', () => {
    expect(contrast(LIGHT['--seal'], LIGHT['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK['--seal'], DARK['--surface'])).toBeGreaterThanOrEqual(4.5);
  });

  it('stays one ink at two lightnesses rather than two colors', () => {
    // A chop is cinnabar. Lightening it for the dark ground is fine; letting it
    // wander to a different hue would make the mark read as a recolored logo,
    // which is the same mistake --brand made when it swung red to amber.
    expect(hueGap(LIGHT['--seal'], DARK['--seal'])).toBeLessThan(25);
  });

  it('is not silently the same value as --brand', () => {
    // If someone "tidies up" by pointing --seal at --brand, the seal becomes
    // burgundy in light and a pale rose in dark — and at that lightness the
    // mark reads pink rather than stamped. This is a deliberate design split,
    // so it gets an assertion rather than a comment.
    expect(LIGHT['--seal']).not.toBe(LIGHT['--brand']);
    expect(DARK['--seal']).not.toBe(DARK['--brand']);
  });
});

describe('every foreground/background pair the design relies on clears AAA', () => {
  const PAIRS: Array<[string, string, string]> = [
    ['brand on surface', '--brand', '--surface'],
    ['brand on surface-sunken', '--brand', '--surface-sunken'],
    ['brand on surface-raised', '--brand', '--surface-raised'],
    ['text-strong on surface', '--text-strong', '--surface'],
    ['text on surface', '--text', '--surface'],
    ['brand-contrast on brand', '--brand-contrast', '--brand'],
    ['brand-strong on surface', '--brand-strong', '--surface'],
    ['on-dark on surface-dark', '--on-dark', '--surface-dark'],
    ['on-dark on surface-deep', '--on-dark', '--surface-deep'],
  ];

  for (const [label, fg, bg] of PAIRS) {
    it(`light: ${label}`, () => {
      expect(contrast(LIGHT[fg], LIGHT[bg])).toBeGreaterThanOrEqual(7);
    });
    it(`dark: ${label}`, () => {
      expect(contrast(DARK[fg], DARK[bg])).toBeGreaterThanOrEqual(7);
    });
  }

  it('--text-muted still clears AA even though it is the weakest', () => {
    // Guards against "muted" drifting into decorative-only illegibility.
    expect(contrast(LIGHT['--text-muted'], LIGHT['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK['--text-muted'], DARK['--surface'])).toBeGreaterThanOrEqual(4.5);
  });
});
