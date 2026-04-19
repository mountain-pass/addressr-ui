---
id: PROB-004
status: open
severity: medium
created: 2026-04-16
reopened: 2026-04-18
---

# RapidAPI gateway serves stale root Link header, hiding new rels

## Problem

The RapidAPI edge caches the response to `GET https://addressr.p.rapidapi.com/` and serves a stale `Link` header missing newer rels. When the addressr server adds new endpoint rels (e.g. `postcode-search`, `locality-search`, `state-search`), library consumers behind the gateway can't discover them until the cache eventually refreshes — timeline unknown, possibly days or indefinite.

Because the core client does HATEOAS discovery, any `searchPostcodes` / `searchLocalities` / `searchStates` call fails with "Search link relation not found in API root" for every consumer — even though the server has the rel, because the cached Link header they see doesn't.

Any query string parameter on the root URL bypasses the cache; the addressr server ignores unknown params. This is a workaround that needs to ship in core to make the new endpoints reachable for consumers.

## Evidence

- 2026-04-16 session (P1.1 HARD CHECKPOINT): First integration test against `https://addressr.p.rapidapi.com/` returned:
  ```
  DISCOVERED RELS: [
    "https://addressr.io/rels/address-search",
    "https://addressr.io/rels/health",
    "self"
  ]
  ```
  After adding `?_rapidapi-cache-bust=${Date.now()}` the same request returned:
  ```
  DISCOVERED RELS: [
    "https://addressr.io/rels/address-search",
    "https://addressr.io/rels/api-docs",
    "https://addressr.io/rels/health",
    "https://addressr.io/rels/locality-search",
    "https://addressr.io/rels/postcode-search",
    "https://addressr.io/rels/state-search",
    "self"
  ]
  ```
- Addressr maintainer confirmed: server has the rels; RapidAPI caching hides them.

## Impact

Blocks Release 1 (core + new search methods) until the cache-bust ships in the production client. Without it, consumers installing the new version would get `searchPostcodes`/`Localities`/`States` methods that throw at runtime. Also affects any future rel addition — every new endpoint is invisible behind the gateway until manual intervention.

## Potential Solutions

1. **New ADR 007 — Bypass RapidAPI edge cache on root discovery** (preferred). Add an opt-in `AddressrClientOptions.gatewayCacheBust?: boolean` defaulting to true when `apiUrl`/`apiHost` contains `rapidapi`. Param name neutral (`_cache-bust`), value via injectable `cacheBustValue?: () => string` so tests stay deterministic. Remove once upstream gateway is fixed.
2. Use a request header (`Cache-Control: no-cache`, `Pragma: no-cache`) instead of a URL param — cleaner but untested against RapidAPI's cache config.
3. Pre-publish a build script that resolves rels at build time and bakes them in — defeats HATEOAS, fragile.
4. Ask RapidAPI support to disable caching on the root path — no timeline; doesn't help in the interim.
5. Report upstream to the Addressr maintainers to publish the endpoints with a different cache-control policy.

Option 1 is being taken now. ADR 007 tracks the workaround with a clear exit ramp (flip default to false and deprecate once upstream is fixed).

## Resolution (2026-04-18, initial)

**Accepted as low-severity risk** — the RapidAPI cache is actually desirable (reduces load on upstream, speeds up discovery for all consumers). Rels are added rarely; when they are, there's an acceptable window before the cache refreshes and consumers can discover them.

- Production client keeps doing a plain `fetch(apiUrl)` — cache is used.
- Integration tests continue to cache-bust so they always verify against the latest contract.
- No ADR 007.
- Severity reduced from high to low; status closed-accepted.

If the cache window ever proves too long in practice (e.g., a rel addition that consumers urgently need), revisit with an opt-in `cacheBustRoot` option.

## Reopened (2026-04-18)

The trigger condition in the initial resolution fired: Release 1 (ADR 006 postcode/locality/state endpoints) needs those rels, and the stale cached root does not advertise them. Production `createAddressrClient()` therefore throws `Search link relation not found in API root` for any call to `searchPostcodes`/`searchLocalities`/`searchStates`.

### New evidence

- 2026-04-18 session: P1.5 live integration tests ran. `searchAddresses` passed (old rel is in the cached Link header). `searchLocalities` (first of the three new methods) failed with the rel-not-found error. Same would occur for `searchPostcodes` and `searchStates`.
- The `rootPromise` in-memory cache mitigation documented in the initial resolution only helps per-mount latency; it does not substitute a stale Link header with a fresh one.

### Mitigation in place

- Three new-method integration tests are marked `describe.skip` in `packages/core/src/api.integration.test.ts` with a reference to this ticket. The `Cache-Control` header, root-discovery, and `searchAddresses` tests remain active.
- ADR 006 remains `proposed` and cannot be promoted to `accepted` until this ticket is resolved end-to-end.
- Release 1 is blocked until this ticket closes.

### Decision: wait for upstream refresh

Owner preference (2026-04-18): do not add production cache-busting. Wait for the RapidAPI edge to refresh the cached root (max-age 604800 = 7 days, or sooner if addressr maintainers purge it).

### Resolution criteria

Close when any of:

1. RapidAPI edge serves a root response that advertises the postcode-search, locality-search, and state-search rels (verifiable by re-enabling the three skipped tests).
2. Addressr maintainers confirm the cache has been purged / configured to refresh on each deploy.
3. Project decides to introduce an opt-in `cacheBustRoot` flag via a new ADR (the "durable workaround" path). This would supersede the wait-for-upstream stance.

Severity raised from low → medium because it now blocks a committed release.
