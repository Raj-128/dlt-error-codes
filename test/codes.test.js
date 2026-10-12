import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { lookup, all, byCategory, search, verified, meta } from '../src/index.js';

const require = createRequire(import.meta.url);
const dataset = require('../data/codes.json');

const CONFIDENCE = ['verified', 'reported', 'unconfirmed'];
const CATEGORIES = ['template', 'linkage', 'registration', 'diagnosis', 'design'];

test('lookup finds a numeric code', () => {
  const e = lookup('635');
  assert.equal(e?.label, 'TEMPLATE_VARIABLE_EXCEEDED_MAX_LENGTH');
});

test('lookup accepts a number as well as a string', () => {
  assert.equal(lookup(635)?.id, lookup('635')?.id);
});

test('lookup finds a slug id', () => {
  assert.equal(lookup('template-mismatch')?.label, 'TEMPLATE_MISMATCH');
});

test('lookup is case-insensitive on slugs and tolerates whitespace', () => {
  assert.ok(lookup('  TEMPLATE-MISMATCH  '));
});

test('lookup returns undefined for unknown input rather than throwing', () => {
  for (const bad of ['999999', '', null, undefined, 'nope']) {
    assert.equal(lookup(bad), undefined);
  }
});

test('every entry has the required fields', () => {
  for (const e of all()) {
    assert.ok(e.id, 'id missing');
    assert.ok(e.label, `label missing on ${e.id}`);
    assert.ok(e.meaning, `meaning missing on ${e.id}`);
    assert.ok(e.fix, `fix missing on ${e.id}`);
    assert.ok(CATEGORIES.includes(e.category), `bad category on ${e.id}: ${e.category}`);
    assert.ok(CONFIDENCE.includes(e.confidence), `bad confidence on ${e.id}: ${e.confidence}`);
  }
});

test('every entry cites at least one source', () => {
  for (const e of all()) {
    assert.ok(Array.isArray(e.sources) && e.sources.length > 0, `no sources on ${e.id}`);
    for (const url of e.sources) {
      assert.match(url, /^https:\/\//, `source not https on ${e.id}: ${url}`);
    }
  }
});

test('an entry claiming verified must say where and when', () => {
  for (const e of all()) {
    if (e.confidence === 'verified') {
      assert.ok(e.verifiedOn, `${e.id} claims verified but verifiedOn is empty`);
    }
  }
});

test('ids are unique', () => {
  const ids = all().map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate id');
});

test('numeric codes are unique', () => {
  const codes = all().map((e) => e.code).filter(Boolean);
  assert.equal(new Set(codes).size, codes.length, 'duplicate numeric code');
});

test('byCategory filters and accepts any casing', () => {
  const t = byCategory('template');
  assert.ok(t.length > 0);
  assert.ok(t.every((e) => e.category === 'template'));
  assert.equal(byCategory('TEMPLATE').length, t.length);
});

test('search matches on meaning text', () => {
  assert.ok(search('scrubbing').length > 0);
});

test('search is case-insensitive', () => {
  assert.equal(search('SCRUBBING').length, search('scrubbing').length);
});

test('search returns empty for a blank query instead of everything', () => {
  assert.deepEqual(search('   '), []);
});

test('verified() only returns verified entries', () => {
  assert.ok(verified().every((e) => e.confidence === 'verified'));
});

test('meta reports the real entry count', () => {
  assert.equal(meta().count, dataset.entries.length);
  assert.equal(meta().schemaVersion, dataset.schemaVersion);
});

test('entries are frozen so callers cannot mutate the dataset', () => {
  const e = all()[0];
  assert.throws(() => {
    'use strict';
    e.meaning = 'tampered';
  }, TypeError);
});

test('lastReviewed is an ISO date', () => {
  assert.match(dataset.lastReviewed, /^\d{4}-\d{2}-\d{2}$/);
});
