#!/usr/bin/env node
// Terminal lookup, so nobody has to install anything:
//
//   npx dlt-error-codes 635
//   npx dlt-error-codes template mismatch
//   npx dlt-error-codes --list

import { lookup, search, all, meta } from './index.js';

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
const c = (code, s) => (NO_COLOR ? s : `\u001b[${code}m${s}\u001b[0m`);
const bold = (s) => c('1', s);
const dim = (s) => c('2', s);
const red = (s) => c('31', s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const cyan = (s) => c('36', s);

const CONFIDENCE_STYLE = {
  verified: (s) => green(s),
  reported: (s) => yellow(s),
  unconfirmed: (s) => red(s),
};

function wrap(text, width = 76, indent = '  ') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(indent + line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(indent + line.trim());
  return lines.join('\n');
}

function render(e) {
  const head = e.code ? `DLT ${e.code}` : e.id;
  const conf = (CONFIDENCE_STYLE[e.confidence] ?? ((s) => s))(e.confidence);

  const out = [
    '',
    `${bold(head)}  ${cyan(e.label)}`,
    dim(`  category: ${e.category}   confidence: `) + conf +
      (e.verifiedOn ? dim(`   (${e.verifiedOn})`) : ''),
    '',
    bold('  What it means'),
    wrap(e.meaning),
    '',
    bold('  Fix'),
    wrap(e.fix),
  ];

  if (e.whenItBites) {
    out.push('', bold('  When it bites'), wrap(e.whenItBites));
  }

  out.push('', bold('  Sources'));
  for (const s of e.sources) out.push(dim('  - ' + s));
  out.push('');
  return out.join('\n');
}

function usage() {
  return [
    '',
    bold('dlt-error-codes') + ' - Indian DLT / TRAI SMS error codes explained',
    '',
    '  npx dlt-error-codes 635              look up a code',
    '  npx dlt-error-codes template-mismatch look up by slug',
    '  npx dlt-error-codes scrubbing         search all text',
    '  npx dlt-error-codes --list            list every entry',
    '  npx dlt-error-codes --json 635        machine-readable output',
    '',
    dim('  The DLT portal is the only authoritative source for your own'),
    dim('  templates. Verify there before acting on anything here.'),
    '',
  ].join('\n');
}

const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const args = argv.filter((a) => a !== '--json');
const query = args.join(' ').trim();

if (!query || query === '--help' || query === '-h') {
  process.stdout.write(usage());
  process.exit(0);
}

if (query === '--list' || query === '-l') {
  const entries = all();
  if (wantJson) {
    process.stdout.write(JSON.stringify(entries, null, 2) + '\n');
    process.exit(0);
  }
  const m = meta();
  process.stdout.write(
    `\n${bold(String(m.count))} entries  ${dim(`(reviewed ${m.lastReviewed})`)}\n\n`,
  );
  const keyWidth = Math.max(...entries.map((e) => (e.code ?? e.id).length));
  const confWidth = Math.max(...entries.map((e) => e.confidence.length));
  for (const e of entries) {
    const key = (e.code ?? e.id).padEnd(keyWidth);
    const conf = (CONFIDENCE_STYLE[e.confidence] ?? ((s) => s))(e.confidence.padEnd(confWidth));
    process.stdout.write(`  ${bold(key)}  ${conf}  ${e.label}\n`);
  }
  process.stdout.write('\n');
  process.exit(0);
}

if (query === '--version' || query === '-v') {
  process.stdout.write(`schema ${meta().schemaVersion}, ${meta().count} entries\n`);
  process.exit(0);
}

// Try the query as typed, then as a slug, so "template mismatch" finds
// "template-mismatch" without the user having to know the id format.
const hit = lookup(query) ?? lookup(query.replace(/\s+/g, '-'));

if (hit) {
  if (wantJson) {
    process.stdout.write(JSON.stringify(hit, null, 2) + '\n');
  } else {
    process.stdout.write(render(hit));
  }
  process.exit(0);
}

const matches = search(query);

if (matches.length === 0) {
  if (wantJson) {
    process.stdout.write(JSON.stringify({ query, matches: [] }, null, 2) + '\n');
  } else {
    process.stderr.write(
      `\n  ${red('No entry for')} ${bold(query)}\n\n` +
        `  This dataset is incomplete by design - only codes with a cited\n` +
        `  source are included. If you have hit this one, please add it:\n` +
        `  ${cyan('https://github.com/Raj-128/dlt-error-codes/issues')}\n\n` +
        `  ${dim('npx dlt-error-codes --list')} to see what is covered.\n\n`,
    );
  }
  process.exit(1);
}

if (wantJson) {
  process.stdout.write(JSON.stringify(matches, null, 2) + '\n');
  process.exit(0);
}

process.stdout.write(
  `\n  ${matches.length} match${matches.length === 1 ? '' : 'es'} for ${bold(query)}\n`,
);
for (const e of matches) process.stdout.write(render(e));
process.exit(0);
