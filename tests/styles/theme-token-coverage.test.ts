import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards the hand-maintained colour map in global.css.
 *
 * global.css does not restyle templates. It re-points Tailwind's fixed palette
 * classes at theme-aware custom properties by redeclaring them later in the
 * same stylesheet. `--brand` inverts between themes — deep red in light, amber
 * in dark — so a class on that map follows the theme and a class off it keeps
 * whatever hex tailwind.config.ts assigned, in both themes.
 *
 * The failure mode is omission, and it is silent: the class still works, it
 * just stops being theme-aware. Nothing throws, nothing fails to compile, and
 * tsc, the other 55 tests, verify-css.mjs and verify-build.mjs all pass with it
 * shipped, because none of them resolves a computed colour.
 *
 * Four instances shipped on 2026-08-05, found in three separate passes:
 *
 *   .text-primary-700         19 links, incl. every inline link on the About
 *                             page and the Min Mey Chang link
 *   .hover:text-primary-700   the contact pages' phone number — the practice's
 *                             primary call to action. #6f2531 on #1d1719 is
 *                             1.67:1, and it only appears on hover
 *   .border-primary-600       the active nav item's underline, and the contact
 *                             pages' outlined button
 *   .hover:bg-primary-50      that same outlined button, flashing a near-white
 *                             #fdf5f4 panel under amber text on hover
 *
 * The first two passes were human: fix the class you noticed, miss its
 * siblings. That is partial-fix propagation, the same shape as
 * docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md.
 * This test exists so the *list* is checked rather than the entry someone
 * happened to see.
 *
 * Write-up: docs/solutions/ui-bugs/tailwind-palette-classes-bypass-theme-tokens.md
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC = join(ROOT, 'src');
const GLOBAL_CSS = join(SRC, 'styles/global.css');

/**
 * Palette families whose colour must move with the theme. `primary` is the
 * brand; `gray` carries body text and surfaces; `white` appears as a literal
 * surface and ring colour. Semantic families (success, info) are included
 * because they are mapped the same way.
 */
const THEMED = 'primary|gray|white|black|success|info';

/** text-primary-700, hover:bg-primary-50, md:hover:text-gray-900, to-white, … */
const UTILITY = new RegExp(
  `^(?:[a-z-]+:)*(?:text|bg|border|from|via|to|ring|divide|outline)-(?:${THEMED})(?:-\\d{2,3})?$`
);

function astroFiles(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return astroFiles(full);
    return entry.endsWith('.astro') ? [full] : [];
  });
}

/** Strip comments so a note *about* a class is not read as a use of it. */
function templateCode(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Every colour utility used in a template, mapped to the files using it.
 * Reads class="…", class={`…`} and the string literals inside class={…}
 * expressions, which is how Navigation.astro applies its active state.
 */
function usedUtilities(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const file of astroFiles()) {
    const code = templateCode(file);
    for (const match of code.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g)) {
      const [, dq, sq, expr] = match;
      // Inside an expression, only string/template literals can hold classes.
      const literals = expr ? [...expr.matchAll(/[`'"]([^`'"]*)[`'"]/g)].map((m) => m[1]) : [];
      for (const chunk of [dq, sq, ...literals]) {
        if (!chunk) continue;
        for (const token of chunk.split(/\s+/)) {
          if (!UTILITY.test(token)) continue;
          if (!found.has(token)) found.set(token, new Set());
          found.get(token)!.add(relative(ROOT, file));
        }
      }
    }
  }
  return found;
}

const CSS = readFileSync(GLOBAL_CSS, 'utf8');

/**
 * Every `html[data-theme='dark'] { … }` block, concatenated. A literal value
 * inside one is still correct: the block is theme-specific by construction.
 *
 * There is more than one such block — the tokens live in the first, the class
 * overrides in a later one — and reading only the first made this test report
 * border-primary-200/300 as unmapped when they are handled.
 */
const DARK_SELECTOR = "html[data-theme='dark'] {";

function darkBlock(): string {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const start = CSS.indexOf(DARK_SELECTOR, from);
    if (start === -1) break;
    let depth = 0;
    let end = CSS.length;
    for (let i = start; i < CSS.length; i++) {
      if (CSS[i] === '{') depth++;
      else if (CSS[i] === '}' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    blocks.push(CSS.slice(start, end));
    from = end;
  }
  return blocks.join('\n');
}

const COLOUR_PROPERTY =
  /(?:^|[\s;{])(?:color|background-color|border-color|--tw-ring-color|--tw-gradient-(?:from|to))\s*:/;

/**
 * Class names global.css redeclares with a colour, split by whether the value
 * is a token. `.hover\:text-primary-700:hover` is recorded as the template
 * would write it: `hover:text-primary-700`.
 */
function redeclared(css: string): { tokenised: Set<string>; literal: Set<string> } {
  const tokenised = new Set<string>();
  const literal = new Set<string>();
  for (const rule of css.matchAll(/((?:\.[A-Za-z0-9\\:_-]+\s*,\s*)*\.[A-Za-z0-9\\:_-]+)\s*\{([^{}]*)\}/g)) {
    const [, selectors, body] = rule;
    if (!COLOUR_PROPERTY.test(body)) continue;
    const target = body.includes('var(--') ? tokenised : literal;
    for (const sel of selectors.matchAll(/\.([A-Za-z0-9\\:_-]+)/g)) {
      target.add(sel[1].replace(/\\/g, '').replace(/:(?:hover|focus|active|focus-visible)$/, ''));
    }
  }
  return { tokenised, literal };
}

/** global.css with every dark block removed, i.e. the theme-neutral map. */
function withoutDarkBlocks(): string {
  let rest = CSS;
  for (const block of darkBlock().split(DARK_SELECTOR).slice(1)) {
    rest = rest.replace(DARK_SELECTOR + block, '');
  }
  return rest;
}

const TOP_LEVEL = redeclared(withoutDarkBlocks());
const DARK = redeclared(darkBlock());

/**
 * Classes that are legitimately absent from the map. Every entry needs a
 * reason, and the reason has to be why the class is *already* theme-correct —
 * not that fixing it is inconvenient.
 */
const EXEMPT = new Map<string, string>([
  [
    'text-white',
    // Only ever applied alongside bg-primary-600, whose mapped rule sets both
    // background-color and color: var(--brand-contrast). That rule is emitted
    // later in the stylesheet, so it wins at equal specificity and the label
    // tracks the fill. Verified in the compiled CSS: .text-white{color:#fff}
    // at ~13k, .bg-primary-600{…color:var(--brand-contrast)} at ~20k.
    'always paired with bg-primary-600, whose mapped rule sets the label colour and is emitted later',
  ],
]);

describe('every themed utility class used in a template is mapped in global.css', () => {
  const used = usedUtilities();

  it('finds the colour utilities actually in use, so the test cannot pass vacuously', () => {
    // If the template scanner silently stops matching, every assertion below
    // passes against an empty set. This is the guard against that.
    expect(used.size).toBeGreaterThan(15);
    expect([...used.keys()]).toContain('text-primary-700');
    expect([...used.keys()]).toContain('hover:text-primary-700');
  });

  it('reads the map out of global.css, so the test cannot pass vacuously', () => {
    expect(TOP_LEVEL.tokenised.size).toBeGreaterThan(10);
    expect(TOP_LEVEL.tokenised).toContain('text-primary-600');
  });

  it('leaves no used utility resolving to a fixed Tailwind hex in both themes', () => {
    const unmapped = [...used.entries()]
      .filter(([cls]) => !EXEMPT.has(cls))
      .filter(([cls]) => !TOP_LEVEL.tokenised.has(cls))
      .filter(([cls]) => !DARK.tokenised.has(cls) && !DARK.literal.has(cls))
      .map(([cls, files]) => `${cls}  (${[...files].sort().join(', ')})`);

    expect(
      unmapped,
      'These classes keep light mode\'s colour in dark mode. Add them to the map in ' +
        'src/styles/global.css, or to EXEMPT here with a reason why they are already correct.'
    ).toEqual([]);
  });

  it('maps the hover variant whenever it maps the base class, since hover outranks it', () => {
    // Tailwind emits .hover\:x:hover at higher specificity than .x, so mapping
    // only the base class looks correct at rest and reverts on interaction.
    // This is how .hover:text-primary-700 and .hover:bg-primary-50 survived a
    // fix to their base classes.
    const missing = [...used.keys()]
      .filter((cls) => cls.startsWith('hover:'))
      .filter((cls) => !EXEMPT.has(cls))
      .filter((cls) => {
        const base = cls.slice('hover:'.length);
        const baseMapped = TOP_LEVEL.tokenised.has(base) || DARK.tokenised.has(base) || DARK.literal.has(base);
        const hoverMapped = TOP_LEVEL.tokenised.has(cls) || DARK.tokenised.has(cls) || DARK.literal.has(cls);
        return baseMapped && !hoverMapped;
      });

    expect(missing, 'base class is theme-aware but its hover variant is not').toEqual([]);
  });
});

describe('the tokens the map depends on are defined for both themes', () => {
  const referenced = [...CSS.matchAll(/var\((--[a-z-]+)\)/g)].map((m) => m[1]);

  it('defines every custom property the map references, in the light theme', () => {
    // A typo'd token name makes the declaration invalid and the class falls
    // back to inherit — silently, and only where that class is used.
    const undefinedTokens = [...new Set(referenced)].filter(
      (token) => !new RegExp(`${token}\\s*:`).test(CSS)
    );
    expect(undefinedTokens).toEqual([]);
  });

  it('redefines the theme-dependent brand tokens inside the dark block', () => {
    // --brand inverting is the whole premise. If the dark block stops
    // redefining it, every mapped class quietly renders light mode's colour
    // and this file's other tests still pass.
    const dark = darkBlock();
    for (const token of ['--brand', '--brand-strong', '--brand-contrast', '--text', '--surface']) {
      expect(dark, `${token} is not redefined for dark mode`).toContain(`${token}:`);
    }
  });
});
