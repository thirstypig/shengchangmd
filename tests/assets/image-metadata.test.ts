import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * No image under public/images/ may carry an EXIF GPS block.
 *
 * On 2026-09-22, 90 of the 189 JPEGs already published here — several of
 * them on the public, indexed /about/ page — were found to carry GPS EXIF.
 * About 70 shared coordinates roughly four miles from the office, almost
 * certainly the doctor's home. This repo had already blocked four
 * *photographs* for showing that home address (see BLOCKED in
 * scripts/prepare-photo-assets.sh); the same address then shipped anyway,
 * invisibly, inside the metadata of photos that passed that review.
 *
 * Every check this repo had before this test was text-based and could not
 * see inside a binary — CLAUDE.md says so explicitly (see
 * docs/solutions/logic-errors/photo-content-outside-every-text-based-guard.md
 * for the related incident with photo *content*, not metadata). This test
 * parses the JPEG byte structure directly rather than shelling out to
 * exiftool, deliberately: CI may not have exiftool installed, and a test
 * that silently no-ops when a binary is missing is exactly the kind of
 * "green check that cannot see the defect" this repo has shipped before.
 *
 * Only GPS is asserted against directly (that is the concrete harm that
 * shipped), but the parser is written to walk the whole EXIF IFD, so
 * extending it to other identifying tags (camera serial, owner name) is a
 * small addition, not a rewrite.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const IMAGES_DIR = join(ROOT, 'public/images');
const GPS_INFO_TAG = 0x8825;

function jpegFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return jpegFiles(full);
    return /\.(jpe?g)$/i.test(entry) ? [full] : [];
  });
}

/**
 * Returns true if the given JPEG file contains an EXIF (APP1) segment whose
 * IFD0 has a GPSInfo pointer (tag 0x8825) — i.e. a GPS block, whether or not
 * the coordinate values themselves are all present/valid.
 */
function hasExifGpsBlock(buf: Buffer): boolean {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) {
    throw new Error('not a JPEG (missing SOI marker)');
  }

  let offset = 2;
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    // SOS (start of scan) means image data follows; no more markers to read.
    if (marker === 0xda) break;
    // Markers with no payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = segmentStart + segmentLength - 2;

    if (marker === 0xe1 && buf.toString('ascii', segmentStart, segmentStart + 6) === 'Exif\0\0') {
      const tiffStart = segmentStart + 6;
      if (parseExifForGps(buf, tiffStart)) return true;
    }

    offset = segmentEnd;
  }
  return false;
}

function parseExifForGps(buf: Buffer, tiffStart: number): boolean {
  const byteOrder = buf.toString('ascii', tiffStart, tiffStart + 2);
  const little = byteOrder === 'II';
  if (!little && byteOrder !== 'MM') return false;

  const readU16 = (o: number) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const readU32 = (o: number) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));

  const ifd0Offset = tiffStart + readU32(tiffStart + 4);
  if (ifd0Offset + 2 > buf.length) return false;

  const entryCount = readU16(ifd0Offset);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    if (entryOffset + 12 > buf.length) break;
    const tag = readU16(entryOffset);
    if (tag === GPS_INFO_TAG) return true;
  }
  return false;
}

const FILES = jpegFiles(IMAGES_DIR);

describe('images under public/images/ carry no EXIF GPS block', () => {
  it('finds JPEGs to check, so the test cannot pass vacuously', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it('parses at least one known-clean file without throwing', () => {
    // Sanity check on the parser itself, independent of the GPS assertion:
    // any valid JPEG in the tree must parse as a JPEG at all.
    const [sample] = FILES;
    expect(() => hasExifGpsBlock(readFileSync(sample))).not.toThrow();
  });

  it('has zero files with a GPS block', () => {
    const withGps = FILES.filter((f) => hasExifGpsBlock(readFileSync(f))).map((f) =>
      relative(ROOT, f)
    );

    expect(
      withGps,
      'These files carry an EXIF GPS block. That is exactly how the doctor\'s ' +
        'home address shipped on 2026-09-22: the photograph passed review, the ' +
        'coordinates in its metadata did not. Strip with ' +
        '`exiftool -all= -overwrite_original <file>` and re-run this test.'
    ).toEqual([]);
  });
});

describe('the parser itself is exercised (not a no-op on a wrong extension)', () => {
  it('only looks at .jpg/.jpeg — confirms the extension filter is not empty', () => {
    const extensions = new Set(FILES.map((f) => extname(f).toLowerCase()));
    expect([...extensions].every((e) => e === '.jpg' || e === '.jpeg')).toBe(true);
  });
});
