import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
/** @type {import('./index.d.ts').Dataset} */
const dataset = require('../data/codes.json');

const entries = Object.freeze(dataset.entries.map(Object.freeze));

const byId = new Map(entries.map((e) => [e.id.toLowerCase(), e]));
const byCode = new Map(entries.filter((e) => e.code).map((e) => [String(e.code), e]));

/**
 * Look up a single entry by numeric DLT error code or by slug id.
 * Returns undefined when nothing matches — callers decide what to do.
 */
export function lookup(code) {
  if (code === null || code === undefined) return undefined;
  const key = String(code).trim();
  return byCode.get(key) ?? byId.get(key.toLowerCase());
}

/** Every entry, newest schema first. Frozen — treat as read-only. */
export function all() {
  return entries;
}

/** Entries in one category: template, linkage, registration, diagnosis, design. */
export function byCategory(category) {
  const key = String(category).toLowerCase();
  return entries.filter((e) => e.category === key);
}

/**
 * Free-text search across label, meaning, fix and whenItBites.
 * Case-insensitive substring match. No fuzzy matching, no dependencies.
 */
export function search(query) {
  const q = String(query).trim().toLowerCase();
  if (!q) return [];
  return entries.filter((e) =>
    [e.label, e.meaning, e.fix, e.whenItBites, e.id, e.code]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q)),
  );
}

/** Only entries a maintainer reproduced first-hand. */
export function verified() {
  return entries.filter((e) => e.confidence === 'verified');
}

/** Dataset metadata: schema version, last review date, confidence definitions. */
export function meta() {
  return Object.freeze({
    schemaVersion: dataset.schemaVersion,
    lastReviewed: dataset.lastReviewed,
    confidenceLevels: dataset.confidenceLevels,
    count: entries.length,
  });
}

export default { lookup, all, byCategory, search, verified, meta };
