import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Guards the encrypted, unlisted editorial-schedule page's invariants.
 * Modeled on tests/routes/gallery-unlisted.test.ts.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (relPath: string) => readFileSync(`${ROOT}/${relPath}`, 'utf8');

describe('the schedule page stays unlinked and unindexed', () => {
  const pageSource = read('src/pages/schedule-7q2m4x.astro');
  const pageCode = pageSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not import or render BaseLayout or any medical-practice chrome component', () => {
    for (const name of ['BaseLayout', 'Header', 'StickyCallBar', 'WeChatQR', 'CallButton', 'Footer']) {
      expect(pageCode, `schedule-7q2m4x.astro references ${name} outside a comment`).not.toMatch(
        new RegExp(`\\b${name}\\b`),
      );
    }
  });

  it('hardcodes a noindex robots meta tag rather than computing one', () => {
    expect(pageSource).toMatch(/<meta\s+name="robots"\s+content="noindex,\s*nofollow"\s*\/?>/);
  });

  it('is excluded from the sitemap in astro.config.mjs', () => {
    const config = read('astro.config.mjs');
    expect(config).toMatch(/schedule-7q2m4x/);
    const filterBody = config.match(/filter:\s*\(page\)\s*=>\s*{([\s\S]*?)},\s*}\)/)?.[1] ?? '';
    expect(filterBody, 'schedule-7q2m4x exclusion not found inside the sitemap filter').toMatch(
      /schedule-7q2m4x/,
    );
  });

  it('is not linked from any other page under src/pages', () => {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    const pagesDir = `${ROOT}/src/pages`;

    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = `${dir}/${entry}`;
        return statSync(full).isDirectory() ? walk(full) : [full];
      });

    const files = walk(pagesDir).filter((f) => !f.endsWith('schedule-7q2m4x.astro'));
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} links to schedule-7q2m4x`).not.toMatch(/schedule-7q2m4x/);
    }
  });
});

describe('the committed ciphertext leaks no plaintext', () => {
  const encryptedSource = read('src/data/schedule.enc.json');
  const encrypted = JSON.parse(encryptedSource);

  it('contains none of the known plaintext markers from the schedule', () => {
    for (const marker of ['I-693', 'Medi-Cal', 'N-648', 'Dr. Chang', '體檢', '医师']) {
      expect(encryptedSource, `ciphertext file contains plaintext marker "${marker}"`).not.toContain(
        marker,
      );
    }
  });

  it('has a base64 ciphertext field', () => {
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(encrypted.ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('the plaintext schedule is gitignored', () => {
  it('lists private/ in .gitignore', () => {
    const gitignore = read('.gitignore');
    expect(gitignore).toMatch(/^private\/$/m);
  });
});
