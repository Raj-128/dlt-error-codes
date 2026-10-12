# Security

## Reporting

Email **rajpatil052003@gmail.com** with the details. Please do not open a public issue for
a security problem.

Expect an acknowledgement within a week. This is a volunteer project, so there
is no commercial SLA.

## Threat model

This package has a deliberately small attack surface:

- **Zero runtime dependencies** — nothing transitive to compromise
- **No install scripts** — no `preinstall`, `postinstall` or `prepare`
- **No network access** — at install time or at runtime
- **No filesystem writes**
- **No dynamic evaluation** — no `eval`, no `new Function`
- Published files are `src/` and `data/` only, enforced by the `files`
  allowlist and checked in CI with `npm pack --dry-run`

Releases are published from GitHub Actions with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements), so
every version on npm links back to the exact commit and workflow run that
produced it.

## Verifying a release

```bash
npm pack dlt-error-codes --dry-run   # list every file that ships
npm view dlt-error-codes dist.integrity
```

The npm package page shows a **Provenance** badge linking to the source commit.
If that badge is missing from a release, treat it as suspect and open an issue.

## Scope

Incorrect data is a **correctness** bug, not a security one — open a normal
issue with your source. Security reports should concern the code, the published
artifact, or the release pipeline.
