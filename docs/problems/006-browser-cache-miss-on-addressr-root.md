---
id: PROB-006
status: open
severity: low
created: 2026-04-18
upstream-reported: 2026-04-18
---

# Browser does not cache addressr root response despite Cache-Control: public

## Problem

The RapidAPI-fronted addressr root (`https://addressr.p.rapidapi.com/`) sends `cache-control: public, max-age=604800`, but Chromium does **not** serve subsequent cross-origin fetches from the HTTP cache. Every fetch round-trips to the network, and every fetch is gated by a fresh CORS preflight (the OPTIONS response has no `Access-Control-Max-Age`).

The expected UX — "second page load gets root from browser cache in <10ms" — does not hold in practice for consumers behind the RapidAPI gateway.

## Evidence

- 2026-04-18 session: ADR 007 browser test exposed this. Playwright CDP (`Network.responseReceived.fromDiskCache`) returns `false` for same-page back-to-back fetches:
  - Request 1: preflight (204) + GET (200), both network.
  - Request 2: preflight (204) + GET (200), both network — `fromDiskCache: false` on the GET despite the `max-age=604800` response header.
- Node integration test (`api.integration.test.ts`) confirms the server IS sending `cache-control: public, max-age=604800` — the contract at the header level is fine.
- Likely contributing factors (not confirmed):
  - Server sends `access-control-allow-credentials: true` on preflight + echoes specific origin → Chromium may skip HTTP cache for credentialed-looking cross-origin responses.
  - Preflight has no `Access-Control-Max-Age` → preflight itself is always a fresh network trip.

## Impact

**Low** given mitigation: core's `createAddressrClient` caches `rootPromise` in-memory for the lifetime of the client instance (typically the lifetime of the component mount or the page). So even without browser HTTP cache, a single page only does the root fetch once. Across page navigations the cost re-appears, but in practice this is tolerable (~100-300ms once per page load).

Would become **medium** if the library were used in a pattern that creates clients frequently (e.g., one per search keystroke) — but that's not the intended use.

## Mitigation in place

`packages/core/src/api.ts` `getRoot()` already caches the root fetch promise in closure scope. One root fetch per client instance.

## Upstream

Reported to addressr maintainers 2026-04-18. Suggestions for them:
- Set `Access-Control-Max-Age` on the OPTIONS preflight response (caches the preflight).
- Relax the `access-control-allow-credentials: true` on the preflight — the response contents are public and don't need credentialed CORS.
- Alternatively, serve the root via a same-origin path on each consumer's site (not feasible via RapidAPI).

## Test status

- `packages/core/src/api.integration.test.ts` keeps the Node-side `Cache-Control` assertion — useful regression detector for the server header contract.
- `packages/core/src/api.browser.integration.test.ts` is marked `.skip` with a reference to this ticket. The ADR 007 infrastructure stays in place so the test can flip back on quickly once upstream is fixed.

## Resolution criteria

Close when either:

1. Upstream gateway is fixed: re-running the Playwright test shows `fromDiskCache: true` (or no network event fired) for Page B's GET.
2. Project decides to remove the browser-cache assertion entirely (unlikely; the test is cheap infrastructure).
