import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');

/** Run the CLI with colour disabled. Returns { status, stdout, stderr }. */
function run(...args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

test('looks up a numeric code and exits 0', () => {
  const r = run('635');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /TEMPLATE_VARIABLE_EXCEEDED_MAX_LENGTH/);
  assert.match(r.stdout, /What it means/);
  assert.match(r.stdout, /Fix/);
});

test('looks up a slug', () => {
  const r = run('template-mismatch');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /TEMPLATE_MISMATCH/);
});

test('falls back to search when there is no exact match', () => {
  const r = run('scrubbing');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /matches for scrubbing/);
});

test('joins multiple words into one query', () => {
  const r = run('template', 'mismatch');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /TEMPLATE/);
});

test('unknown code exits 1 and points at the issue tracker', () => {
  const r = run('999999');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /No entry for/);
  assert.match(r.stderr, /issues/);
});

test('--list shows every entry with aligned columns', () => {
  const r = run('--list');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /entries/);
  assert.match(r.stdout, /635/);
  assert.match(r.stdout, /CONSIDER_GATEWAY_OTP_ENDPOINT/);
});

test('--json emits parseable JSON for a hit', () => {
  const r = run('--json', '635');
  assert.equal(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.code, '635');
  assert.ok(Array.isArray(parsed.sources));
});

test('--json emits parseable JSON for --list', () => {
  const r = run('--json', '--list');
  assert.equal(r.status, 0);
  assert.ok(Array.isArray(JSON.parse(r.stdout)));
});

test('--json on a miss still emits valid JSON and exits 1', () => {
  const r = run('--json', '999999');
  assert.equal(r.status, 1);
  assert.deepEqual(JSON.parse(r.stdout), { query: '999999', matches: [] });
});

test('no arguments prints usage and exits 0', () => {
  const r = run();
  assert.equal(r.status, 0);
  assert.match(r.stdout, /npx dlt-error-codes/);
});

test('--help prints usage', () => {
  assert.match(run('--help').stdout, /look up a code/);
});

test('usage carries the not-authoritative warning', () => {
  assert.match(run('--help').stdout, /DLT portal is the only authoritative source/);
});

test('NO_COLOR output contains no ANSI escapes', () => {
  const r = run('635');
  assert.doesNotMatch(r.stdout, /\u001b\[/);
});
