---
id: PROB-008
status: closed
severity: low
created: 2026-04-24
fix-released: 2026-04-24
closed: 2026-04-27
---

# CI fails opaquely when required GitHub Actions secrets are missing

## Problem

`.github/workflows/release.yml` references `${{ secrets.ADDRESSR_RAPIDAPI_KEY }}` for `pnpm test:integration` and `${{ secrets.NPM_TOKEN }}` for `changeset publish`, but the workflow has no preflight check that these secrets are actually set on the repo. When a secret is missing, GitHub Actions substitutes the empty string, and the failure surfaces deep inside the job step with a tool-specific error message (a vitest setup throw for `ADDRESSR_RAPIDAPI_KEY`; an npm auth error for `NPM_TOKEN`).

The gap between "something is missing at the repo-admin level" and "vitest throws at `test/integration-setup.ts:4:9`" is wide. Diagnosing requires reading the CI log, recognising the symptom, and running `gh secret list` to confirm — none of which the failure message itself hints at.

## Evidence

- 2026-04-24 release attempt: first push to `main` after unblocking Release 1 failed at the `pnpm test:integration` step with `Error: ADDRESSR_RAPIDAPI_KEY is required for integration tests`. Local `pnpm test:integration` had been green 5/5 that morning. `gh secret list` showed only `NPM_TOKEN` was configured — the RapidAPI key had never been registered despite the workflow referencing it since commit `11e74b6` (2026-04-19).
- Every push to `main` since 2026-04-19 (5 days) had been silently failing the same way. The user was not aware; the failure was not surfaced in any session-level summary.
- Setting the secret (`gh secret set ADDRESSR_RAPIDAPI_KEY`) and re-running the failed run resolved it on the next attempt.

## Impact

Minor but recurring. Every new fork, every repo rotation, every secret rotation has the same silent-failure cliff. It cost ~10 minutes in this session to diagnose and fix. The worse variant is a secret that silently expires mid-release: `changeset publish` fails with a 401, the Release PR doesn't publish, and nobody notices until a consumer reports the version never landed on npm.

## Potential Solutions

1. **Preflight secret check at the top of `build-and-test`** (preferred). Add a step before `pnpm lint`:
   ```yaml
   - name: Verify required secrets
     env:
       ADDRESSR_RAPIDAPI_KEY: ${{ secrets.ADDRESSR_RAPIDAPI_KEY }}
       NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
     run: |
       [ -n "$ADDRESSR_RAPIDAPI_KEY" ] || { echo "::error::Repo secret ADDRESSR_RAPIDAPI_KEY is not set. Run: printf %s \"\$ADDRESSR_RAPIDAPI_KEY\" | gh secret set ADDRESSR_RAPIDAPI_KEY"; exit 1; }
       [ -n "$NPM_TOKEN" ] || { echo "::error::Repo secret NPM_TOKEN is not set"; exit 1; }
   ```
   Fails in ~5 seconds with a clear, actionable message, before any install or test work.
2. **Onboarding checklist in `CONTRIBUTING.md`** that enumerates the required secrets and how to set them. Lower-assurance than option 1 (docs drift from CI config) but useful as defence in depth.
3. **A repo-admin script** (`scripts/bootstrap-secrets.sh`) that reads `.env` and uploads each `ADDRESSR_*` entry as a GitHub secret. Single command to reconstitute a forked repo's CI config. Could call the preflight check locally before push.

Option 1 is the cheapest and highest-leverage. Options 2 and 3 are complementary.

## Routing

Local fix — `.github/workflows/release.yml` edit. No upstream dependency.

## Fix Released

Applied Option 1 (preflight secret check) in `.github/workflows/release.yml` on 2026-04-24. Each job now verifies its required secret immediately after checkout and fails with an actionable `::error::` line in ~5 seconds when a secret is missing, rather than continuing into `pnpm install`/`pnpm test:integration`/`changeset publish` only to fail obscurely.

- `build-and-test` job checks `ADDRESSR_RAPIDAPI_KEY`.
- `release` job checks `NPM_TOKEN`.

Awaiting user verification: the next push to `main` will exercise the new preflight. Verification is green if the "Verify required secrets" step passes silently (both secrets set) and the remainder of CI completes as before. Negative-path verification (secret missing → loud failure) is left as a future event — no action needed to trigger it deliberately.

## Closed

Verified by user on 2026-04-27 after two consecutive CI runs exercised the new preflight silently:

- Run [24889370990](https://github.com/mountain-pass/addressr-ui/actions/runs/24889370990) (commit `d86240c`) — first run with the preflight; both jobs passed cleanly.
- Run [24946057769](https://github.com/mountain-pass/addressr-ui/actions/runs/24946057769) (commit `e5f0eb3`) — second run; preflight remained silent, full pipeline green.

The positive-path behaviour is confirmed. Negative-path (a deliberately missing secret triggering the `::error::` line) was not exercised — but the gate is dormant until needed and the implementation is straightforward enough that user judgment accepts the closure without negative-path proof.
