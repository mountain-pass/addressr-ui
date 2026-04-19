---
status: "proposed"
date: 2026-04-18
decision-makers: [tom-howard]
consulted: [wr-architect:agent, wr-jtbd:agent]
informed: []
reassessment-date: 2026-07-18
---

# Browser-Mode Integration Testing for HTTP-Cache-Sensitive Behaviour

## Context and Problem Statement

The addressr.io HATEOAS client does root discovery on every new JavaScript context. In a browser, this is tolerable because the browser's HTTP cache serves the root response on subsequent page loads — the first page pays the network cost; every subsequent page, with its fresh JS context and no cookies/localStorage, gets the same root in ~1-10ms from the browser cache. This is driven entirely by the server's `Cache-Control` headers; our code does nothing special.

That whole chain is a non-functional contract: the server must send cacheable headers, and the browser must honour them. If the server ever stops sending `Cache-Control` (or sends `no-store`), every page load pays the full network round trip — silent regression, no error, just slower search-first-render across every consumer's app.

This extends the Developer (Integration) persona's documented pain point "Not knowing whether the API contract still holds (drift risk) between releases" (`docs/jtbd/developer-integration/persona.md`) into the non-functional layer. It also protects JTBD-100's desired outcome "Results appear within a few hundred milliseconds of typing" for return visitors.

ADR 005 added Node-based live-API integration tests. Node's fetch has no HTTP cache layer, so those tests cannot catch this class of regression. We need a new tier that runs in a real browser.

## Decision Drivers

- Catch server cache-header regressions before they silently slow every consumer's UX
- Verify browser HTTP cache actually serves the second page load from cache — end-to-end non-functional assertion
- Complement ADR 005, not replace — Node integration tests remain the primary API contract gate
- Minimise CI cost — Playwright and a Chromium download add ~30-60s per run
- Keep test signal sharp, not noisy — avoid timing-based flakes

## Considered Options

1. **`@playwright/test` runner with Chromium, running cross-page-load fixture tests**
2. **Vitest browser-mode + Playwright** — rejected during implementation prep: `@vitest/browser` runs tests *inside* a single browser tab with no native `page.goto()` / multi-page navigation API. Cross-page-load scenarios require escape hatches that under-serve this ADR's stated scope.
3. **Puppeteer driven directly**
4. **Single-context Playwright test** — one page, multiple fetches (simpler but under-specifies the scenario)
5. **Status quo — no browser tier**; rely on manual verification

## Decision Outcome

Chosen option: **"1 — `@playwright/test` runner with Chromium, cross-page-load scenario"**, because it is the native fit for multi-page-load tests (`page.goto(fixtureA)` → `page.goto(fixtureB)` with browser HTTP cache intact across navigations) and it matches the stated scenario precisely (fresh JS context, no carried state).

### Scope — cross-page-load, not single-context

The test navigates Playwright to a small fixture HTML page A that fetches the addressr root once (populating the browser HTTP cache), then navigates to a separate fixture HTML page B with a fresh JS context and no shared state that fetches the same URL. Assertion: page B's fetch is served from HTTP cache.

Rationale: option 3 (single-context, multiple fetches) proves "browser cache works within a session" but does not prove "browser cache survives across page loads with no JS state carried". The scenario this ADR protects is the latter. Fixture pages close the gap cleanly.

### Cache-hit assertion

**Primary signal**: Chrome DevTools Protocol `Network.responseReceived` event flags — `fromDiskCache || fromServiceWorker || fromPrefetchCache`. The test attaches a CDP session via `context.newCDPSession(page)`, listens on `Network.responseReceived` filtered to the root URL, and on the Page B navigation asserts that every non-preflight event carries a true cache flag.

**Why not `PerformanceResourceTiming.transferSize === 0`**: Chromium redacts `transferSize` to 0 for cross-origin responses that lack a `Timing-Allow-Origin` header. RapidAPI does not send that header, so a cross-origin network response and a cache hit are indistinguishable via `transferSize` for this test. CDP sidesteps the redaction because it inspects the browser's internal network layer, not the JS-visible performance timeline.

**Dropped**: the `duration < 10ms` timing assertion considered in early discussion. Timing thresholds in CI flake; the CDP flags are a sharp boolean signal instead.

**Preflight filter**: CORS preflight responses (status 204) are excluded from the assertion. The addressr OPTIONS response carries no `Access-Control-Max-Age`, so preflight itself never caches; that is a separate server-side concern from data-response caching.

**Companion Node assertion**: a test in the existing `api.integration.test.ts` asserts the root response carries `Cache-Control` with a non-zero `max-age`. This catches server-side regressions without needing a browser.

### Carve-out from ADR 005 Confirmation criterion 6

ADR 005 requires Node integration tests to use `createIntegrationClient()` with retries disabled. This ADR's browser tests deliberately bypass that helper and use raw `fetch()` — retry logic would wrap the call and corrupt cache-behaviour measurements. The browser tier is a **distinct test category**, not subject to ADR 005 criterion 6. ADR 005 is amended (criterion 6 scoped to Node tests, new "Interaction with ADR 007" subsection) as part of accepting this ADR.

### Tooling

`@playwright/test` as a devDep in `packages/core` only (no framework packages run browser-mode tests in this ADR). New `packages/core/playwright.config.ts` with `testMatch: '**/*.browser.integration.test.ts'` and a single `projects: [{ name: 'chromium', ... }]` entry. New script `test:integration:browser` (runs `playwright test`). New turbo task `test:integration:browser`. CI workflow runs `npx playwright install --with-deps chromium` before the browser test step. Fixture pages A and B live under `packages/core/test/fixtures/` and are served either via Playwright's `page.setContent()` or a small static file route — implementation detail left open.

### Fixture pages

Two minimal HTML files at `packages/core/test/fixtures/cache-page-a.html` and `cache-page-b.html` (each a `<title>` and a short `<p>`). They serve only as distinct navigation targets so Playwright can give each page a fresh JS context while keeping the browser's HTTP cache intact across the two navigations. The test process navigates Playwright to each via `context.route()` (virtual `http://cache-fixtures.localhost` origin) and injects the fetch call through `page.evaluate()` so the test owns the API key and headers. Cache-hit detection happens at the CDP layer, not via `postMessage`.

## Consequences

### Good

- Catches server-side `Cache-Control` regressions on every push (companion Node test)
- Catches end-to-end browser-cache regressions on every push (browser test)
- Distinct from ADR 005's API-contract tier — both tiers can regress independently and both are caught
- Sharp boolean signal (`transferSize === 0`) minimises flakiness
- Cross-page-load fidelity matches the real-world scenario, not a session-level approximation

### Neutral

- Adds a third test tier (unit / Node integration / browser integration). Contributors learn the convention (`*.browser.integration.test.ts`) and run `pnpm test:integration:browser` alongside the other two
- Playwright becomes a required dev tool; contributors run `npx playwright install chromium` once

### Bad

- CI time increases ~30-60s per run for Chromium install + browser boot. Cacheable via Playwright's built-in caching layer or GitHub Actions cache, but not free
- Browser test depends on addressr.io being reachable and responsive — same live-service risk ADR 005 already accepts
- Browser tests are inherently heavier to debug than Node tests. Failures may require running Playwright in headed mode locally
- Only `packages/core` gets this tier in this decision — framework packages (react/svelte/vue) are not covered. The shared behaviour is in core's client, so this is the right coverage level, but it means framework-specific cache regressions (unlikely) would not be caught here

## Confirmation

1. `packages/core/playwright.config.ts` exists with `testMatch: '**/*.browser.integration.test.ts'` and a `projects` entry using the `chromium` device. Verifiable by read.
2. `packages/core/src/api.browser.integration.test.ts` exists, attaches a CDP session, listens on `Network.responseReceived`, and asserts every non-preflight event for Page B's root fetch has `fromDiskCache || fromServiceWorker || fromPrefetchCache === true`. Verifiable by grep. (Currently `.skip`-gated pending PROB-006 upstream fix — see `docs/problems/006-browser-cache-miss-on-addressr-root.md`.)
3. `packages/core/src/api.integration.test.ts` has a `Cache-Control` header assertion on the root response. Verifiable by grep.
4. `turbo.json` has a `test:integration:browser` task. Verifiable by read.
5. Root `package.json` and `packages/core/package.json` have a `test:integration:browser` script. Verifiable by read.
6. CI workflow runs `npx playwright install --with-deps chromium` and `pnpm test:integration:browser` unconditionally after `pnpm test:integration`. Verifiable by workflow file.
7. The browser test does NOT import `createIntegrationClient()` — it uses raw `fetch()` per the ADR 005 carve-out. Verifiable by grep.
8. Fixture pages exist at `packages/core/test/fixtures/cache-page-{a,b}.html`. Verifiable by read.

## Pros and Cons of the Options

### Option 1 — `@playwright/test`, cross-page-load (chosen)

- Good: native `page.goto()` makes the two-page scenario express naturally
- Good: well-documented, widely used, first-class Chromium support
- Bad: adds Playwright + Chromium to CI
- Bad: `@playwright/test` is a distinct test runner from vitest — contributors run it via `pnpm test:integration:browser` so daily workflow is unchanged, but debugging requires familiarity with its CLI

### Option 2 — Vitest browser-mode + Playwright (rejected)

- Good: shares tooling family with ADR 005 runners
- Bad: `@vitest/browser` runs tests inside a single tab; no `page.goto()` / multi-page API
- Bad: cross-page scenarios require escape hatches that under-specify the ADR's scope

### Option 3 — Puppeteer direct

- Good: slightly lighter than Playwright
- Bad: smaller ecosystem for modern browser testing

### Option 4 — Single-context Playwright

- Good: simpler to write; faster to run
- Bad: under-specifies the stated scenario — doesn't prove cross-page-load cache behaviour
- Bad: documentation mismatch between purpose and implementation

### Option 5 — No browser tier

- Good: zero new CI time, zero new tooling
- Bad: server `Cache-Control` regressions go undetected until users notice slow pages
- Bad: no automated assertion for the browser-cache scenario at all

## Reassessment Criteria

- Revisit if CI time for this tier exceeds 2 minutes or flakes become persistent
- Revisit if a framework-specific cache regression is ever reported (would indicate this tier's core-only coverage is insufficient)
- Revisit if addressr.io stops sending `Cache-Control` deliberately (e.g., for request-signing reasons) — the test becomes a bug, not a feature
- Revisit if Playwright introduces breaking changes that make the test brittle
- Default reassessment date: 2026-07-18 (3 months).
