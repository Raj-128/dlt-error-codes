# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-12

### Added

- `lookup()`, `all()`, `byCategory()`, `search()`, `verified()` and `meta()`
- `npx dlt-error-codes <code>` CLI with `--list`, `--json` and `--help`.
  Exits 0 on a hit and 1 on a miss so it is usable in scripts. Respects
  `NO_COLOR`. Multi-word queries resolve to slugs, so `template mismatch`
  finds `template-mismatch`
- `scripts/leak-check.mjs`, run automatically before every test, failing the
  build on anything resembling a credential, a DLT registration id, a phone
  number or an email address
- `examples/explain-failure.js` showing delivery-report handling
- Initial dataset of 10 entries covering the most commonly documented DLT
  failures: codes `634` and `635`, plus template mismatch, template/ID
  mismatch, wrong template category, header/telemarketer binding, unapproved
  templates, silent scrubbing failures, network-level scrubbing, and a note on
  gateway OTP endpoints as an alternative to managing templates
- Confidence levels (`verified` / `reported` / `unconfirmed`) with per-entry
  source URLs
- Test suite enforcing required fields, unique ids and codes, `https://`
  sources, and that no entry claims `verified` without a `verifiedOn` value

### Notes

- Every entry in this release is `reported` — compiled from public vendor
  documentation, not reproduced first-hand. The dataset is intentionally small
  rather than padded with guessed codes.
