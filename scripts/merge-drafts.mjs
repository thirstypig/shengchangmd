/**
 * Folds the per-topic draft files in private/drafts/ into private/schedule.json.
 *
 * Drafts are written one file per topic so that several writers never touch the
 * same file. This merges them by slug: the draft text and the sources land on
 * the matching schedule item, and a title is only overwritten when the schedule
 * item does not already have one in that locale.
 *
 * Both paths are gitignored; nothing here touches the repo's committed files.
 * Re-encrypt afterwards with: SCHEDULE_PASSPHRASE=… npm run schedule:encrypt
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SCHEDULE = 'private/schedule.json';
const DRAFTS = 'private/drafts';
const LOCALES = ['en', 'zh-hant', 'zh-hans'];

if (!existsSync(DRAFTS)) {
  console.error(`No ${DRAFTS} directory; nothing to merge.`);
  process.exit(1);
}

const schedule = JSON.parse(readFileSync(SCHEDULE, 'utf8'));
const bySlug = new Map(schedule.items.map((item) => [item.slug, item]));
const unmatched = [];
let merged = 0;

for (const file of readdirSync(DRAFTS).filter((f) => f.endsWith('.json'))) {
  const draft = JSON.parse(readFileSync(join(DRAFTS, file), 'utf8'));
  const item = bySlug.get(draft.slug);
  if (!item) {
    unmatched.push(draft.slug ?? file);
    continue;
  }
  for (const locale of LOCALES) {
    if (draft.title?.[locale] && !item.title[locale]) item.title[locale] = draft.title[locale];
  }
  item.draft = Object.fromEntries(LOCALES.map((l) => [l, draft.draft?.[l] ?? '']));
  if (draft.sources) item.sources = draft.sources;
  if (draft.checked) item.draftChecked = draft.checked;
  if (draft.notes) item.draftNotes = draft.notes;
  if (item.status === 'planned') item.status = 'drafting';
  merged += 1;
}

writeFileSync(SCHEDULE, JSON.stringify(schedule, null, 2) + '\n');
console.log(`Merged ${merged} draft(s) into ${SCHEDULE}.`);
if (unmatched.length) console.log(`No schedule item for: ${unmatched.join(', ')}`);
const missing = schedule.items.filter((i) => i.status !== 'published' && !i.draft);
if (missing.length) console.log(`Still without a draft: ${missing.map((i) => i.slug).join(', ')}`);
