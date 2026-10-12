# dlt-error-codes

[![npm version](https://img.shields.io/npm/v/dlt-error-codes?color=cb3837&logo=npm)](https://www.npmjs.com/package/dlt-error-codes)
[![CI](https://github.com/Raj-128/dlt-error-codes/actions/workflows/ci.yml/badge.svg)](https://github.com/Raj-128/dlt-error-codes/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/Raj-128/dlt-error-codes/blob/main/package.json)
[![install size](https://img.shields.io/bundlephobia/min/dlt-error-codes)](https://bundlephobia.com/package/dlt-error-codes)
[![licence](https://img.shields.io/npm/l/dlt-error-codes?color=blue)](LICENSE)
[![downloads](https://img.shields.io/npm/dm/dlt-error-codes?color=blue)](https://www.npmjs.com/package/dlt-error-codes)

**Your SMS said "sent" but never arrived. The delivery report says `635`. Here is what that means and how to fix it.**

Indian DLT error codes in plain English, with the fix for each one. Every entry cites its source and tells you whether a maintainer actually reproduced it or just read it in vendor documentation.

Zero dependencies. No install scripts. No network calls.

---

## Common codes

### `635` — TEMPLATE_VARIABLE_EXCEEDED_MAX_LENGTH

A variable in your message was longer than the length registered for that variable position in the approved template.

**Fix:** open the template in the DLT portal and read the length registered for that variable. Shorten the value you are inserting, or re-register the template with a longer variable. **Do not assume a fixed limit such as 30 characters** — it is set per template.

**Why it hits in production:** test data is short. A long customer name or order reference overflows a variable that worked for every short test value.

### `634` — HEADER_NOT_LINKED_TO_TEMPLATE

The sender header and the template both exist, but they are not associated with each other on the DLT platform.

**Fix:** in the DLT portal, open the template and confirm which header it is registered against. Send with that exact header, or add the header to the template's allowed list.

**When:** after adding a second sender header, or reusing a template across two brands.

### TEMPLATE_MISMATCH — no code, just a dropped message

The operator compared your text against the registered template and they did not match. Outside the variable positions, the comparison is **exact**.

**Fix:** diff the rendered message against the registered template character by character. An extra space, a changed comma, a different dash, a stray newline or a smart quote is enough. Watch for whitespace introduced by string concatenation.

### WRONG_TEMPLATE_CATEGORY — the expensive first mistake

**Transactional is reserved for banks.** A non-bank sending OTPs under that category will not deliver.

**Fix:** non-banks register OTP and alert templates as **Service Implicit**. Re-registering costs another approval cycle, so get this right the first time.

### SILENT_SCRUBBING_FAILURE — "it returned success but nothing arrived"

The gateway's HTTP response only tells you the request was *accepted*. The scrubbing verdict arrives later, in the delivery report.

**Fix:** pull the DLR and read the DLT code from it. **Log the DLR code for every send** — without it you have nothing to debug.

Run `search()` or read [`data/codes.json`](data/codes.json) for the rest.

---

## How to use it

Four ways, in the order people actually reach for them.

### 1. Terminal, nothing installed

```bash
npx dlt-error-codes 635
```

```
DLT 635  TEMPLATE_VARIABLE_EXCEEDED_MAX_LENGTH
  category: template   confidence: reported

  What it means
  A variable in your message was longer than the length registered for
  that variable position in the approved DLT template.

  Fix
  Open the template in the DLT portal and read the length registered for
  that variable. Shorten the value you are inserting, or re-register the
  template with a longer variable. Do not assume a fixed limit such as 30
  characters; it is set per template.

  When it bites
  Usually in production rather than testing, because test data is short...

  Sources
  - https://...
```

```bash
npx dlt-error-codes template mismatch   # words work, no need to know the slug
npx dlt-error-codes scrubbing           # searches all text
npx dlt-error-codes --list              # every entry
npx dlt-error-codes --json 635          # pipe into jq
```

Exits `0` on a hit, `1` on a miss, so it works in scripts. Respects `NO_COLOR`.

### 2. In your backend

```bash
npm install dlt-error-codes
```

```js
import { lookup } from 'dlt-error-codes';

function explain(dltCode) {
  const e = lookup(dltCode);
  if (!e) return `DLT ${dltCode}: not in dataset`;
  return `DLT ${dltCode} (${e.label}): ${e.meaning}\nFix: ${e.fix}`;
}
```

Wire it into wherever you handle delivery reports, so a failure logs something
actionable instead of a bare number:

```js
function onDeliveryReportFailed({ messageId, dltCode }) {
  const e = lookup(dltCode);
  logger.error({
    messageId,
    dltCode,
    label: e?.label ?? 'UNKNOWN',
    action: e?.fix ?? 'Check the gateway dashboard',
  });
}
```

Full working version in [`examples/explain-failure.js`](examples/explain-failure.js).

### 3. Any other language

The dataset is plain JSON with no wrapper. Vendor a copy or fetch it:

```python
import json, urllib.request

URL = "https://raw.githubusercontent.com/Raj-128/dlt-error-codes/main/data/codes.json"
codes = {e["id"]: e for e in json.load(urllib.request.urlopen(URL))["entries"]}

e = codes["635"]
print(e["meaning"], "\nFix:", e["fix"])
```

Pin a release tag rather than `main` if you care about reproducibility.

### 4. Just read it

[`data/codes.json`](data/codes.json) on GitHub is a perfectly good way to use
this. No install, no code. Plenty of people will only ever use it this way, and
that is a success, not a failure.

## API

| Function | Returns |
|---|---|
| `lookup(codeOrSlug)` | One entry, or `undefined`. Accepts strings or numbers. |
| `all()` | Every entry, frozen. |
| `byCategory(category)` | Entries in one category. Any casing. |
| `search(query)` | Case-insensitive substring match across all text fields. |
| `verified()` | Only entries reproduced first-hand. |
| `meta()` | Schema version, last review date, entry count, confidence definitions. |

## What an entry looks like

```js
lookup('635');
// {
//   id: '635',
//   code: '635',
//   label: 'TEMPLATE_VARIABLE_EXCEEDED_MAX_LENGTH',
//   category: 'template',
//   meaning: 'A variable in your message was longer than ...',
//   fix: 'Open the template in the DLT portal and ...',
//   whenItBites: 'Usually in production rather than testing, ...',
//   confidence: 'reported',
//   verifiedOn: null,
//   sources: ['https://...']
// }

```

`code` is `null` for failure modes that have no numeric code. `whenItBites` is
optional. Everything else is always present — the test suite enforces it.

---

## Confidence levels

No authority validates DLT error-code documentation, and vendor pages contradict each other. So every entry says how much to trust it:

| Level | Means |
|---|---|
| `verified` | Reproduced first-hand. `verifiedOn` records the gateway, operator and date. |
| `reported` | From vendor or provider documentation. Not reproduced by a maintainer. Sources listed. |
| `unconfirmed` | Seen in forums without corroboration. Treat with suspicion. |

**Current state: every entry is `reported`.** The dataset is seeded from public documentation and is deliberately small — about ten entries — rather than padded with guessed codes. Entries get promoted to `verified` as maintainers reproduce them.

An entry claiming `verified` without a `verifiedOn` value fails the test suite.

---

## What this does **not** do

- It does not send SMS. Use your gateway's SDK.
- It does not validate your message against your template. That may land in a later version.
- It does not talk to the DLT portal, and it has no idea what your templates say.
- It does not cover every DLT code. Coverage is the roadmap — see below.
- **It is not authoritative.** The DLT portal is the only source of truth for your own templates and their variable lengths. Check there before acting on anything here.

---

## Trust

- MIT licensed
- **Zero dependencies**
- **No install scripts**, no network calls, no telemetry
- Published from CI with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC) — no long-lived token exists for this package, and every release from `0.1.1` onward carries a provenance statement linking it to the exact source commit
- Small enough to audit by hand. One JSON file and about 70 lines of lookup:
  ```bash
  npm pack dlt-error-codes --dry-run
  ```
- Every entry cites its sources and states its confidence level

**Not affiliated with TRAI, any DLT operator, or any SMS gateway.** Error codes are compiled from public documentation and first-hand testing.

---

## Repository layout

What each file is and why it exists:

| Path | What it is |
|---|---|
| `data/codes.json` | **The actual product.** Every error code and failure mode, with meaning, fix, confidence and sources. Plain JSON on purpose, so it is usable from any language without installing anything. |
| `src/index.js` | The lookup functions. About 70 lines, no dependencies, no build step. This exact file is what npm publishes. |
| `src/index.d.ts` | TypeScript types, hand-written. Also serves as the written definition of the entry schema. |
| `test/codes.test.js` | 18 tests. Half check the functions; half check the *data* — required fields, unique ids, `https://` sources, no unevidenced `verified` claims. |
| `package.json` | npm metadata. The `files` allowlist is what restricts a release to `src/` and `data/`. |
| `README.md` | This file. Written so someone arriving from a search for their error code finds the fix without scrolling. |
| `LICENSE` | MIT. |
| `SECURITY.md` | How to report a vulnerability, and the threat model. |
| `CHANGELOG.md` | What changed in each release. |
| `.github/workflows/ci.yml` | Runs tests on Node 18, 20 and 22 for every push and pull request. Also validates the JSON and checks which files would ship. |
| `.github/workflows/publish.yml` | Publishes to npm with provenance when a `v*` tag is pushed. Nothing publishes manually. |

## Data schema

One object per entry in `data/codes.json` under `entries`. Field by field:

| Field | Type | Required | What it holds |
|---|---|---|---|
| `id` | string | yes | Stable lookup key. The numeric code when there is one, otherwise a kebab-case slug. Never changes once published. |
| `code` | string \| null | yes | The numeric DLT error code, as a string. `null` for failure modes that have no code — a plain template mismatch, for example. |
| `label` | string | yes | `SCREAMING_SNAKE_CASE` name, stable across releases. Safe to branch on in code. |
| `category` | enum | yes | One of `template`, `linkage`, `registration`, `diagnosis`, `design`. |
| `meaning` | string | yes | What the error actually means, in plain English. No vendor jargon. |
| `fix` | string | yes | What to do about it. Must be an action, not a restatement of the problem. |
| `whenItBites` | string | no | When this tends to hit in practice — which is often the most useful field. |
| `confidence` | enum | yes | `verified`, `reported` or `unconfirmed`. See above. |
| `verifiedOn` | string \| null | yes | Operator, gateway and date when `confidence` is `verified`. `null` otherwise. Required if `verified` — the test suite enforces it. |
| `sources` | string[] | yes | At least one `https://` URL. Tests reject empty arrays and non-HTTPS links. |

### Categories

| Category | Covers |
|---|---|
| `template` | The message text or its variables do not match the registered template |
| `linkage` | Header, template, entity and telemarketer exist but are not correctly associated |
| `registration` | The template or header is missing, pending approval, or in the wrong category |
| `diagnosis` | How to find out what went wrong, rather than a specific failure |
| `design` | Not an error — a design decision that avoids a whole class of these problems |

### Adding an entry

```json
{
  "id": "636",
  "code": "636",
  "label": "SHORT_STABLE_NAME",
  "category": "template",
  "meaning": "What it means, plainly.",
  "fix": "What to do about it.",
  "whenItBites": "When this tends to happen.",
  "confidence": "reported",
  "verifiedOn": null,
  "sources": ["https://example.com/where-you-found-it"]
}
```

Then `npm test`. The suite will tell you if anything is missing or inconsistent.

## Project rules

Non-negotiable, because they are what the package's credibility rests on:

1. **No invented codes.** If you cannot cite a source or reproduce it, it does not go in. A thin honest dataset beats a padded guessed one — the whole point of this package is being trustworthy about what it does and does not know.
2. **No credentials, ever.** No API keys, tokens, entity IDs, header IDs, telemarketer IDs, sender IDs, phone numbers or real template text from any specific business. Error codes and their meanings are general knowledge; your DLT registration details are not. CI greps for these on every push.
3. **No real project data in examples.** Use `<operator>`, `<gateway>`, `YYYY-MM-DD` placeholders. Never a real sender header or a real approved template.
4. **Zero runtime dependencies.** If something needs a dependency, it belongs in a different package.
5. **No install scripts and no network calls.** Not at install, not at runtime.
6. **The published files are the source files.** No build step, no bundle, no minification — so anyone can read exactly what they installed.

## Contributing

The dataset is the product. The most useful contributions, in order:

1. **A code that is missing.** Add it to `data/codes.json` with at least one `https://` source.
2. **A `reported` entry you have reproduced.** Change `confidence` to `verified` and fill `verifiedOn` with the DLT operator, the gateway and the date, in the form `"<operator> DLT via <gateway>, YYYY-MM-DD"`.
3. **A correction.** Vendor documentation is often wrong. Say what you observed and on which gateway.

Entry schema is in [`src/index.d.ts`](src/index.d.ts). Tests enforce the required fields, unique ids, `https://` sources, and that nothing claims `verified` without evidence.

```bash
npm test
```

No build step. The published files are the source files.

---

## Licence

MIT — see [LICENSE](LICENSE).
