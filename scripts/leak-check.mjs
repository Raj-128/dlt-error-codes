// Fails the build if anything resembling a credential, a DLT registration
// detail, or data belonging to a specific business reaches the repository.
//
// This package documents error codes. It must never carry anyone's API keys,
// entity IDs, sender headers, phone numbers or approved template text.
//
//   node scripts/leak-check.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git']);
const SKIP_FILES = new Set(['leak-check.mjs', 'SECURITY.md', 'package-lock.json']);
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.yml', '.yaml', '.txt']);

const RULES = [
  {
    name: 'API key or secret assignment',
    re: /\b(api[_-]?key|apikey|secret|password|passwd|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*["'][^"'<\[\s]{6,}["']/i,
  },
  { name: 'Bearer token', re: /\bBearer\s+[A-Za-z0-9._-]{16,}/ },
  { name: 'Private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: 'DLT registration id',
    re: /\b(pe[_-]?id|entity[_-]?id|tm[_-]?id|telemarketer[_-]?id|header[_-]?id|template[_-]?id)\b\s*[:=]\s*["']?\d{5,}/i,
  },
  { name: 'Indian phone number', re: /(?:\+91[-\s]?)?\b[6-9]\d{9}\b/ },
  { name: 'Long numeric id (possible DLT or template id)', re: /\b\d{14,}\b/ },
  {
    name: 'Email address',
    re: /\b[A-Za-z0-9._%+-]+@(?!example\.(?:com|org))[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  },
];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (!SKIP_FILES.has(basename(p)) && TEXT_EXT.has(extname(p))) files.push(p);
  }
})('.');

const findings = [];
for (const file of files) {
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (/^\s*(\/\/|#)/.test(line)) return; // comments
      if (/https?:\/\//.test(line)) return; // citation URLs are expected
      if (/\$\{\{\s*secrets\./.test(line)) return; // GitHub Actions secret refs
      for (const rule of RULES) {
        if (rule.re.test(line)) {
          findings.push(`${file}:${i + 1}  ${rule.name}\n    ${line.trim().slice(0, 120)}`);
        }
      }
    });
}

if (findings.length) {
  console.error(`\nLeak check FAILED — ${findings.length} finding(s):\n`);
  for (const f of findings) console.error(f + '\n');
  console.error('Nothing resembling a credential or a specific business’s DLT');
  console.error('registration may be committed. Use placeholders instead.\n');
  process.exit(1);
}

console.log(`Leak check passed — ${files.length} files scanned, nothing sensitive found.`);
