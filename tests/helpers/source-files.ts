import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Every file under `dir`, recursively, whose path relative to `dir` passes
 * `keep`. Returns [] when `dir` does not exist, so a guard can name a directory
 * before anything has been written there (src/content/ did not exist when the
 * language guards were widened to cover it).
 *
 * Both language guards used to call readdirSync on a single directory level.
 * A page in a subfolder, or a Markdown article under src/content/, was outside
 * what they could see, and would have passed while saying 医生 or "colour".
 */
export function filesUnder(dir: string, keep: (relPath: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((entry) => {
      const full = join(d, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  return walk(dir).filter((f) => keep(relative(dir, f).split(sep).join('/')));
}

/** Content files (Markdown/MDX) for one locale: any path with a `<locale>/` segment. */
export const isContentFor = (locale: string) => (rel: string) =>
  /\.(md|mdx)$/.test(rel) && rel.split('/').includes(locale);
