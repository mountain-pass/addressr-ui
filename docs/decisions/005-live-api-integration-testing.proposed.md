---
status: "proposed"
date: 2026-04-15
decision-makers: [tom-howard]
consulted: [wr-architect:agent, wr-jtbd:agent]
informed: []
reassessment-date: 2026-07-15
---

# Live API Integration Testing

## Context and Problem Statement

The test suite currently mocks `fetch` for every test. This catches contract violations against our local fixtures but cannot detect drift between the addressr.io API and our client — schema changes, rel renames, header changes, retry-relevant status codes, or HATEOAS link shape changes all go undetected until a consumer reports a runtime failure.

We need a way to verify the real client against the real API on every push (the team practices trunk-based development per the DORA Accelerate research — small batches merged to trunk on every push, gated by CI), across all four packages (core + react/svelte/vue), without leaking secrets into the repo.

A 1Password-backed `.env.tpl` template is the immediate trigger for this decision: introducing it implicitly creates a new testing tier and a secret-management convention. Both deserve to be documented.

### Interaction with ADR 003 (Retry)

Integration tests exercise the live retry path. Default retry config (2 retries, ~7.5s worst-case) would (a) inflate test latency on transient blips and (b) mask genuine intermittent failures behind eventual-success. Integration tests therefore configure the client with `retry: { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 }` so failures surface immediately. ADR 003's retry behaviour is itself separately exercised by dedicated retry unit tests against mocked fetch — that coverage is unaffected.

### Interaction with ADR 001 (Monorepo)

Integration tests live alongside unit tests in each package's `src/` tree, named `*.integration.test.ts` (vs `*.test.ts` for unit tests). A new turbo task `test:integration` runs only the integration suites; the existing `test` task continues to run unit tests only and remains offline-capable with no env vars required. CI runs both tasks; local `pnpm test` stays fast and network-free unless the contributor opts into `pnpm test:integration`.

### Interaction with ADR 007 (Browser-mode integration testing)

ADR 007 adds a third, browser-mode integration tier (`*.browser.integration.test.ts`) for HTTP-cache-sensitive behaviour that Node cannot observe. Browser-mode tests are a distinct category and are **not** subject to this ADR's Confirmation criterion 6 (retry disabled via `createIntegrationClient()`) — they use raw `fetch()` to measure cache behaviour directly. This ADR's Confirmation criteria remain authoritative for Node-based integration tests only.

## Decision Drivers

- Trunk-based development on every push — fast, reliable signal required
- Unlimited RapidAPI quota — cost/throttling is not a constraint
- All four packages must verify against the live API
- Secrets must never enter the repo
- Contributors without an API key should get a clear failure, not silent skips
- Existing mocked unit tests must remain the primary feedback loop (faster, deterministic, offline)
- ADR 003 retry behaviour must not mask integration-test failures
- ADR 001 monorepo structure must be respected (per-package tests via turbo)

## Considered Options

1. **Two-tier testing: mocked unit tests + live integration tests in every package**
2. **Recorded fixtures (Polly.js / MSW with snapshots)** replayed in CI; live calls only for refresh
3. **Single tier — replace all mocks with live calls**
4. **Status quo — mocked only, accept the drift risk**

## Decision Outcome

Chosen option: **"Two-tier testing"**, because it preserves the speed and determinism of mocked unit tests while adding live-API verification on every push. Unlimited quota removes the usual cost objection. All four packages run integration tests so framework-specific regressions are caught.

Integration test files live alongside unit tests as `*.integration.test.ts`, gated by a separate turbo task `test:integration`. Default `pnpm test` remains offline-capable. CI runs both tasks on every push.

Secrets are referenced via 1Password using `.env.tpl` at the repo root. Local dev resolves it with `op inject -i .env.tpl -o .env`. CI receives the key as a GitHub Actions secret (`ADDRESSR_RAPIDAPI_KEY`) injected into the job environment — CI does not use the 1Password CLI.

When `ADDRESSR_RAPIDAPI_KEY` is absent, integration tests fail loudly. Unit tests are unaffected.

The 1Password reference points to the maintainer's personal `Private` vault (`op://Private/addressr-rapidapi/credential`). External contributors cannot resolve it; the template documents the env shape so they can supply their own key. CI does not depend on 1Password.

Integration tests run with retries disabled (`maxRetries: 0`) so failures surface immediately rather than being absorbed by ADR 003's default retry behaviour.

## Consequences

### Good

- Drift between client and API caught on every push, not at release
- Framework-specific integration regressions covered for react/svelte/vue, not just core
- Unit tests remain fast and deterministic — still the primary loop
- Loud failure on missing key prevents silent regressions
- `.env.tpl` documents the env contract for any new contributor
- `test:integration` separation keeps default `pnpm test` offline-capable

### Neutral

- Two test layers per package — contributors learn the `*.integration.test.ts` convention
- 1Password CLI is a local-dev dependency for maintainers; CI is independent of it
- Personal Private vault means external contributors need their own RapidAPI key for integration tests; unit tests still run freely

### Bad

- CI requires the GitHub Actions secret to be configured before this can land — one-time setup
- Live tests depend on addressr.io uptime; an outage will redden CI even when our code is correct (mitigation: integration tests run with retry disabled so failures surface fast and can be triaged; persistent outages require manual override)
- External contributors without a RapidAPI key cannot fully verify their PRs locally — they get loud failures on integration tests
- Shared team vault is not used; if more maintainers join, this decision should be revisited

## Confirmation

1. `.env.tpl` exists at the repo root and contains only 1Password `op://` references — never raw secret values. Verifiable by grep.
2. `.env` is in `.gitignore` (already true).
3. Each package has at least one `*.integration.test.ts` file that fails (not skips) when `ADDRESSR_RAPIDAPI_KEY` is unset. Verifiable by running `pnpm test:integration` without the env var and asserting non-zero exit.
4. `pnpm test` (unit only) passes with no env vars set. Verifiable in a clean shell.
5. CI workflow injects `ADDRESSR_RAPIDAPI_KEY` from GitHub Actions secrets and runs both `test` and `test:integration`. Verifiable by reading the workflow file.
6. Node integration test files (`*.integration.test.ts`, excluding `*.browser.integration.test.ts`) instantiate the client with `retry: { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 }` (enforced structurally via a shared `createIntegrationClient()` helper in each package's integration-setup). Browser-mode tests are carved out per ADR 007. Verifiable by grep.
7. No commit contains the literal RapidAPI key string. Verifiable via git log search and secret scanning.

## Pros and Cons of the Options

### Option 1 — Two-tier (mocked + live)

- Good: fast unit feedback preserved; real drift caught every push
- Good: each package can independently test what it owns
- Bad: maintenance cost of two test styles; integration tests are flakier by nature

### Option 2 — Recorded fixtures

- Good: deterministic CI without live dependency
- Good: cheap and fast in CI
- Bad: fixtures rot silently — same problem as pure mocking, just a layer further out
- Bad: refresh cadence becomes a process question

### Option 3 — Single-tier live only

- Good: simplest mental model
- Bad: every test is slower and depends on network; CI feedback loop suffers
- Bad: harder to test error paths the live API does not return on demand

### Option 4 — Status quo (mocked only)

- Good: zero new infrastructure
- Bad: API drift caught only by users in production
- Bad: does not justify why we'd introduce `.env.tpl` at all

## Reassessment Criteria

Revisit this decision if any of the following occur:

- A second active maintainer joins (consider migrating from `Private` vault to a shared team vault)
- RapidAPI introduces quota limits or pricing that makes per-push live tests costly
- Integration tests become persistently flaky due to upstream instability (consider option 2 — recorded fixtures with periodic refresh)
- The team adopts a different secret-management tool
- A 5th framework is added to the monorepo and integration-test maintenance becomes burdensome

Default reassessment date: 2026-07-15 (3 months from decision date).
